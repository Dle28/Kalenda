use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked};

declare_id!("TmMkt11111111111111111111111111111111111111");

const BPS_DENOM: u64 = 10_000;
const STABLE_T0_BPS: u64 = 5_000; // 50%
const AUCTION_T0_BPS: u64 = 4_000; // 40%
const FINAL_RELEASE_BPS: u64 = 9_800; // 98%

#[program]
pub mod timemarket {
    use super::*;

    pub fn init_platform(
        ctx: Context<InitPlatform>,
        platform_fee_bps: u16,
    ) -> Result<()> {
        require!(platform_fee_bps <= 10_000, ErrorCode::InvalidBps);

        let platform = &mut ctx.accounts.platform;
        platform.admin = ctx.accounts.admin.key();
        platform.platform_fee_bps = platform_fee_bps;
        platform.mint = ctx.accounts.mint.key();
        platform.dispute_vault = ctx.accounts.dispute_vault.key();
        platform.bump = ctx.bumps.platform;
        Ok(())
    }

    pub fn init_creator_profile(
        ctx: Context<InitCreatorProfile>,
        payout_wallet: Pubkey,
        fee_bps_override: Option<u16>,
    ) -> Result<()> {
        if let Some(bps) = fee_bps_override {
            require!(bps <= 10_000, ErrorCode::InvalidBps);
        }

        let profile = &mut ctx.accounts.profile;
        profile.authority = ctx.accounts.authority.key();
        profile.payout_wallet = payout_wallet;
        profile.fee_bps_override = fee_bps_override;
        profile.platform = ctx.accounts.platform.key();
        profile.bump = ctx.bumps.profile;
        Ok(())
    }

    pub fn update_creator_profile(
        ctx: Context<UpdateCreatorProfile>,
        new_payout_wallet: Option<Pubkey>,
        new_fee_bps_override: Option<Option<u16>>,
    ) -> Result<()> {
        if let Some(Some(bps)) = new_fee_bps_override {
            require!(bps <= 10_000, ErrorCode::InvalidBps);
        }
        let profile = &mut ctx.accounts.profile;
        if let Some(w) = new_payout_wallet {
            profile.payout_wallet = w;
        }
        if let Some(new_fee) = new_fee_bps_override {
            profile.fee_bps_override = new_fee;
        }
        Ok(())
    }

    pub fn create_time_slot(
        ctx: Context<CreateTimeSlot>,
        params: CreateSlotParams,
    ) -> Result<()> {
        // Basic validation
        require!(params.start_ts < params.end_ts, ErrorCode::InvalidTimes);
        require!(params.capacity > 0, ErrorCode::InvalidCapacity);
        require!(params.min_increment_bps <= 10_000, ErrorCode::InvalidBps);

        match params.mode {
            Mode::Stable => {
                require!(params.price > 0, ErrorCode::InvalidPrice);
            }
            Mode::EnglishAuction | Mode::SealedBid => {
                require!(params.auction_start_ts.is_some(), ErrorCode::MissingAuctionWindow);
                require!(params.auction_end_ts.is_some(), ErrorCode::MissingAuctionWindow);
                let start = params.auction_start_ts.unwrap();
                let end = params.auction_end_ts.unwrap();
                require!(start < end, ErrorCode::InvalidTimes);
            }
        }

        let slot = &mut ctx.accounts.slot;
        slot.creator_profile = ctx.accounts.profile.key();
        slot.creator_authority = ctx.accounts.profile.authority;
        slot.platform = ctx.accounts.platform.key();
        slot.mint = ctx.accounts.mint.key();
        slot.start_ts = params.start_ts;
        slot.end_ts = params.end_ts;
        slot.tz_offset_min = params.tz_offset_min;
        slot.subject_hash = params.subject_hash;
        slot.venue_hash = params.venue_hash;
        slot.mode = params.mode;
        slot.state = SlotState::Open;
        slot.frozen = false;
        slot.buyer_checked_in = false;
        slot.capacity = params.capacity;
        slot.nft_mint = params.nft_mint.unwrap_or(Pubkey::default());
        slot.price = params.price;
        slot.min_increment_bps = params.min_increment_bps;
        slot.buy_now = params.buy_now;
        slot.auction_start_ts = params.auction_start_ts;
        slot.auction_end_ts = params.auction_end_ts;
        slot.anti_sniping_sec = params.anti_sniping_sec;
        slot.bump = ctx.bumps.slot;
        Ok(())
    }

    pub fn init_escrow(ctx: Context<InitEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.slot = ctx.accounts.slot.key();
        escrow.token_acc = ctx.accounts.escrow_vault.key();
        escrow.amount_locked = 0;
        escrow.buyer = None;
        escrow.bump = ctx.bumps.escrow;
        Ok(())
    }

    pub fn init_bid_book(ctx: Context<InitBidBook>) -> Result<()> {
        let bidbook = &mut ctx.accounts.bidbook;
        bidbook.slot = ctx.accounts.slot.key();
        bidbook.highest_bid = 0;
        bidbook.highest_bidder = Pubkey::default();
        bidbook.next_min_bid = 0;
        bidbook.last_bid_ts = 0;
        bidbook.pending_refund_amount = 0;
        bidbook.pending_refund_bidder = Pubkey::default();
        bidbook.bump = ctx.bumps.bidbook;
        Ok(())
    }

    pub fn init_commit_store(ctx: Context<InitCommitStore>, max_entries: u16) -> Result<()> {
        require!(max_entries > 0, ErrorCode::InvalidCapacity);
        let store = &mut ctx.accounts.commit_store;
        store.slot = ctx.accounts.slot.key();
        store.max_entries = max_entries;
        store.count = 0;
        store.entries = Vec::with_capacity(max_entries as usize);
        store.bump = ctx.bumps.commit_store;
        Ok(())
    }

    pub fn bid_commit(ctx: Context<BidCommit>, commitment_hash: [u8; 32]) -> Result<()> {
        let slot = &ctx.accounts.slot;
        require!(slot.mode == Mode::SealedBid, ErrorCode::WrongMode);
        let store = &mut ctx.accounts.commit_store;
        require!((store.count as usize) < store.entries.capacity(), ErrorCode::InvalidCapacity);
        // ensure unique per bidder
        require!(
            store
                .entries
                .iter()
                .find(|e| e.bidder == ctx.accounts.bidder.key())
                .is_none(),
            ErrorCode::AlreadyCommitted
        );
        store.entries.push(CommitEntry {
            bidder: ctx.accounts.bidder.key(),
            commitment_hash,
            revealed: false,
            bid_amount: None,
        });
        store.count = store.count.saturating_add(1);
        emit!(CommitPlacedEvent { slot: slot.key(), bidder: ctx.accounts.bidder.key() });
        Ok(())
    }

    pub fn bid_reveal(ctx: Context<BidReveal>, bid_amount: u64, salt: [u8; 32]) -> Result<()> {
        use anchor_lang::solana_program::hash::hashv;
        let slot = &ctx.accounts.slot;
        require!(slot.mode == Mode::SealedBid, ErrorCode::WrongMode);
        let store = &mut ctx.accounts.commit_store;
        let expected = hashv(&[
            &bid_amount.to_le_bytes(),
            &salt,
            &ctx.accounts.bidder.key().to_bytes(),
        ]);
        let entry = store
            .entries
            .iter_mut()
            .find(|e| e.bidder == ctx.accounts.bidder.key())
            .ok_or(ErrorCode::NotCommitted)?;
        require!(!entry.revealed, ErrorCode::AlreadyRevealed);
        require!(entry.commitment_hash == expected.to_bytes(), ErrorCode::RevealMismatch);
        entry.revealed = true;
        entry.bid_amount = Some(bid_amount);
        emit!(RevealAcceptedEvent { slot: slot.key(), bidder: ctx.accounts.bidder.key(), bid_amount });
        Ok(())
    }

    // ===================== English Auction (MVP) =====================
    pub fn auction_start(ctx: Context<AuctionStart>) -> Result<()> {
        let slot = &mut ctx.accounts.slot;
        require!(slot.mode == Mode::EnglishAuction, ErrorCode::WrongMode);
        require!(slot.state == SlotState::Open, ErrorCode::InvalidState);
        require_keys_eq!(slot.creator_authority, ctx.accounts.creator.key(), ErrorCode::Unauthorized);
        let now = Clock::get()?.unix_timestamp;
        let start = slot.auction_start_ts.ok_or(ErrorCode::MissingAuctionWindow)?;
        require!(now >= start, ErrorCode::TooEarly);
        slot.state = SlotState::AuctionLive;
        emit!(AuctionStartedEvent { slot: slot.key(), start_ts: now });
        Ok(())
    }

    pub fn bid_place(ctx: Context<BidPlace>, bid_amount: u64, _max_auto_bid: Option<u64>) -> Result<()> {
        let slot = &mut ctx.accounts.slot;
        let book = &mut ctx.accounts.bidbook;
        require!(slot.mode == Mode::EnglishAuction, ErrorCode::WrongMode);
        require!(slot.state == SlotState::AuctionLive, ErrorCode::InvalidState);
        require!(ctx.accounts.bidder.key() != slot.creator_authority, ErrorCode::Unauthorized);

        // Enforce min increment
        let min_required = if book.highest_bid == 0 {
            slot.price // treat as starting price
        } else {
            let inc = core::cmp::max(1u64, mul_bps_u64(book.highest_bid, slot.min_increment_bps as u64)?);
            book.highest_bid.checked_add(inc).ok_or(ErrorCode::Overflow)?
        };
        require!(bid_amount >= min_required, ErrorCode::BidTooLow);

        // Transfer bidder -> escrow vault (full bid amount)
        let decimals = ctx.accounts.mint.decimals;
        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.bidder_token.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.escrow_vault.to_account_info(),
                    authority: ctx.accounts.bidder.to_account_info(),
                },
            ),
            bid_amount,
            decimals,
        )?;

        // Mark refund for previous highest (if any)
        if book.highest_bid > 0 {
            book.pending_refund_amount = book.highest_bid;
            book.pending_refund_bidder = book.highest_bidder;
        }

        // Anti-sniping: extend if within window
        let now = Clock::get()?.unix_timestamp;
        if let (Some(end), Some(ext)) = (slot.auction_end_ts, slot.anti_sniping_sec) {
            if end - now <= ext as i64 {
                slot.auction_end_ts = Some(end + ext as i64);
                emit!(AuctionExtendedEvent { slot: slot.key(), new_end_ts: end + ext as i64 });
            }
        }

        // Update highest
        book.highest_bid = bid_amount;
        book.highest_bidder = ctx.accounts.bidder.key();
        book.next_min_bid = min_required; // for display; next call recomputes
        book.last_bid_ts = now;
        // Keep escrow.amount_locked equal to highest bid + any pending refund
        let escrow = &mut ctx.accounts.escrow;
        escrow.amount_locked = escrow
            .amount_locked
            .checked_add(bid_amount)
            .ok_or(ErrorCode::Overflow)?;
        emit!(BidPlacedEvent { slot: slot.key(), bidder: book.highest_bidder, amount: bid_amount });
        Ok(())
    }

    pub fn bid_outbid_refund(ctx: Context<BidOutbidRefund>) -> Result<()> {
        let book = &mut ctx.accounts.bidbook;
        require!(book.pending_refund_amount > 0, ErrorCode::NothingToRefund);
        require_keys_eq!(book.pending_refund_bidder, ctx.accounts.prev_bidder.key(), ErrorCode::Unauthorized);
        // Transfer escrow -> prev bidder token
        let decimals = ctx.accounts.mint.decimals;
        let slot_key = ctx.accounts.slot.key();
        let escrow_bump = ctx.accounts.escrow.bump;
        let token_program = ctx.accounts.token_program.to_account_info();
        let escrow_vault = ctx.accounts.escrow_vault.to_account_info();
        let mint = ctx.accounts.mint.to_account_info();
        let prev_bidder_token = ctx.accounts.prev_bidder_token.to_account_info();
        let escrow_info = ctx.accounts.escrow.to_account_info();
        let prev_bidder_key = ctx.accounts.prev_bidder.key();
        let bump_seed = [escrow_bump];
        let seeds: &[&[u8]] = &[b"escrow", slot_key.as_ref(), &bump_seed];
        let signer: &[&[&[u8]]] = &[seeds];
        let escrow = &mut ctx.accounts.escrow;
        let amt = book.pending_refund_amount;
        transfer_checked(
            CpiContext::new_with_signer(
                token_program,
                TransferChecked {
                    from: escrow_vault,
                    mint,
                    to: prev_bidder_token,
                    authority: escrow_info.clone(),
                },
                signer,
            ),
            amt,
            decimals,
        )?;
        // Adjust escrow locked sum
        escrow.amount_locked = escrow.amount_locked.checked_sub(amt).ok_or(ErrorCode::Overflow)?;
        emit!(OutbidRefundedEvent { slot: slot_key, to: prev_bidder_key, amount: amt });
        // Clear pending
        book.pending_refund_amount = 0;
        book.pending_refund_bidder = Pubkey::default();
        Ok(())
    }

    pub fn auction_end(ctx: Context<AuctionEnd>) -> Result<()> {
        let decimals = ctx.accounts.mint.decimals;
        let slot_key = ctx.accounts.slot.key();
        let escrow_bump = ctx.accounts.escrow.bump;
        let token_program = ctx.accounts.token_program.to_account_info();
        let escrow_vault = ctx.accounts.escrow_vault.to_account_info();
        let creator_payout = ctx.accounts.creator_payout_ata.to_account_info();
        let platform_vault = ctx.accounts.platform_vault.to_account_info();
        let mint = ctx.accounts.mint.to_account_info();
        let escrow_info = ctx.accounts.escrow.to_account_info();
        let bump_seed = [escrow_bump];
        let seeds: &[&[u8]] = &[b"escrow", slot_key.as_ref(), &bump_seed];
        let signer: &[&[&[u8]]] = &[seeds];

        let slot = &mut ctx.accounts.slot;
        let book = &mut ctx.accounts.bidbook;
        require!(slot.mode == Mode::EnglishAuction, ErrorCode::WrongMode);
        require!(slot.state == SlotState::AuctionLive, ErrorCode::InvalidState);
        require!(book.pending_refund_amount == 0, ErrorCode::RefundsPending);
        let now = Clock::get()?.unix_timestamp;
        let end = slot.auction_end_ts.ok_or(ErrorCode::MissingAuctionWindow)?;
        require!(now >= end, ErrorCode::TooEarly);
        require!(book.highest_bid > 0, ErrorCode::NoBids);

        // Bind escrow to winner
        let escrow = &mut ctx.accounts.escrow;
        escrow.buyer = Some(book.highest_bidder);
        // Enforce locked equals highest
        require!(escrow.amount_locked == book.highest_bid, ErrorCode::InvalidEscrowBalance);

        // T0 payout (40%) to creator, fee pro-rata
        let total_fee = mul_bps_u64(book.highest_bid, ctx.accounts.platform.platform_fee_bps as u64)?;
        let t0_base = mul_bps_u64(book.highest_bid, AUCTION_T0_BPS)?;
        let t0_fee = mul_bps_u64(total_fee, AUCTION_T0_BPS)?;
        let t0_creator = t0_base.checked_sub(t0_fee).ok_or(ErrorCode::Overflow)?;
        // creator payout
        transfer_checked(
            CpiContext::new_with_signer(
                token_program.clone(),
                TransferChecked {
                    from: escrow_vault.clone(),
                    mint: mint.clone(),
                    to: creator_payout,
                    authority: escrow_info.clone(),
                },
                signer,
            ),
            t0_creator,
            decimals,
        )?;
        // fee
        transfer_checked(
            CpiContext::new_with_signer(
                token_program,
                TransferChecked {
                    from: escrow_vault,
                    mint,
                    to: platform_vault,
                    authority: escrow_info,
                },
                signer,
            ),
            t0_fee,
            decimals,
        )?;
        escrow.amount_locked = escrow.amount_locked.checked_sub(t0_creator + t0_fee).ok_or(ErrorCode::Overflow)?;
        slot.state = SlotState::Locked;
        emit!(AuctionEndedEvent { slot: slot_key, winner: book.highest_bidder, winning_bid: book.highest_bid });
        Ok(())
    }

    pub fn auction_checkin(ctx: Context<AuctionCheckin>) -> Result<()> {
        let slot = &mut ctx.accounts.slot;
        require!(slot.mode == Mode::EnglishAuction, ErrorCode::WrongMode);
        require!(slot.state == SlotState::Locked || slot.state == SlotState::Reserved, ErrorCode::InvalidState);
        // Only winner (buyer) or creator authority may mark check-in
        let buyer = ctx.accounts.escrow.buyer.ok_or(ErrorCode::NotReserved)?;
        require!(
            ctx.accounts.signer.key() == buyer || ctx.accounts.signer.key() == slot.creator_authority,
            ErrorCode::Unauthorized
        );
        slot.buyer_checked_in = true;
        slot.state = SlotState::Completed;
        emit!(CheckinEvent { slot: slot.key(), by: ctx.accounts.signer.key() });
        Ok(())
    }

    pub fn auction_settle(ctx: Context<AuctionSettle>) -> Result<()> {
        let decimals = ctx.accounts.mint.decimals;
        let slot_key = ctx.accounts.slot.key();
        let escrow_bump = ctx.accounts.escrow.bump;
        let token_program = ctx.accounts.token_program.to_account_info();
        let escrow_vault = ctx.accounts.escrow_vault.to_account_info();
        let mint = ctx.accounts.mint.to_account_info();
        let creator_payout = ctx.accounts.creator_payout_ata.to_account_info();
        let platform_vault = ctx.accounts.platform_vault.to_account_info();
        let escrow_info = ctx.accounts.escrow.to_account_info();
        let bump_seed = [escrow_bump];
        let seeds: &[&[u8]] = &[b"escrow", slot_key.as_ref(), &bump_seed];
        let signer: &[&[&[u8]]] = &[seeds];

        let platform = &ctx.accounts.platform;
        let slot = &mut ctx.accounts.slot;
        let escrow = &mut ctx.accounts.escrow;
        let book = &ctx.accounts.bidbook;
        require!(slot.mode == Mode::EnglishAuction, ErrorCode::WrongMode);
        require!(!slot.frozen, ErrorCode::Frozen);
        require!(book.highest_bid > 0, ErrorCode::NoBids);
        // After T0, T1 happens from Completed state
        require!(slot.state == SlotState::Completed, ErrorCode::InvalidState);

        // Remaining base after T0 is (winning_bid - T0_base)
        let t0_base = mul_bps_u64(book.highest_bid, AUCTION_T0_BPS)?;
        let t1_base = book.highest_bid.checked_sub(t0_base).ok_or(ErrorCode::Overflow)?;
        let t1_release = mul_bps_u64(t1_base, FINAL_RELEASE_BPS)?;
        let t1_withhold = t1_base.checked_sub(t1_release).ok_or(ErrorCode::Overflow)?;
        let t1_fee = mul_bps_u64(t1_base, platform.platform_fee_bps as u64)?;
        let t1_creator = t1_release.checked_sub(t1_fee).ok_or(ErrorCode::Overflow)?;

        // to creator
        transfer_checked(
            CpiContext::new_with_signer(
                token_program.clone(),
                TransferChecked {
                    from: escrow_vault.clone(),
                    mint: mint.clone(),
                    to: creator_payout.clone(),
                    authority: escrow_info.clone(),
                },
                signer,
            ),
            t1_creator,
            decimals,
        )?;
        // fee
        transfer_checked(
            CpiContext::new_with_signer(
                token_program.clone(),
                TransferChecked {
                    from: escrow_vault.clone(),
                    mint: mint.clone(),
                    to: platform_vault.clone(),
                    authority: escrow_info.clone(),
                },
                signer,
            ),
            t1_fee,
            decimals,
        )?;
        if t1_withhold > 0 {
            transfer_checked(
                CpiContext::new_with_signer(
                    token_program.clone(),
                    TransferChecked {
                        from: escrow_vault.clone(),
                        mint: mint.clone(),
                        to: platform_vault.clone(),
                        authority: escrow_info.clone(),
                    },
                    signer,
                ),
                t1_withhold,
                decimals,
            )?;
        }

        let total_out = t1_creator
            .checked_add(t1_fee).ok_or(ErrorCode::Overflow)?
            .checked_add(t1_withhold).ok_or(ErrorCode::Overflow)?;
        require!(escrow.amount_locked >= total_out, ErrorCode::InvalidEscrowBalance);
        escrow.amount_locked = escrow.amount_locked.checked_sub(total_out).ok_or(ErrorCode::Overflow)?;
        slot.state = SlotState::Settled;
        emit!(SettledT1Event { slot: slot_key, to: ctx.accounts.creator_payout_ata.key(), amount: t1_creator, fee: t1_fee, retained: t1_withhold });
        Ok(())
    }

    // ===================== StableNFT flow =====================
    pub fn stable_reserve(ctx: Context<StableReserve>, amount: u64) -> Result<()> {
        let slot = &mut ctx.accounts.slot;
        require!(slot.mode == Mode::Stable, ErrorCode::WrongMode);
        require!(slot.state == SlotState::Open, ErrorCode::InvalidState);
        require!(amount == slot.price, ErrorCode::InvalidPrice);
        // Transfer buyer -> escrow_vault
        let decimals = ctx.accounts.mint.decimals;
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.buyer_token.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        transfer_checked(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
            amount,
            decimals,
        )?;

        let escrow = &mut ctx.accounts.escrow;
        escrow.amount_locked = escrow
            .amount_locked
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;
        escrow.buyer = Some(ctx.accounts.buyer.key());
        slot.state = SlotState::Reserved;
        emit!(ReservedEvent { slot: slot.key(), buyer: ctx.accounts.buyer.key(), amount });
        Ok(())
    }

    pub fn stable_cancel(ctx: Context<StableCancel>) -> Result<()> {
        let decimals = ctx.accounts.mint.decimals;
        let slot_key = ctx.accounts.slot.key();
        let buyer_key = ctx.accounts.buyer.key();
        let escrow_bump = ctx.accounts.escrow.bump;
        let token_program = ctx.accounts.token_program.to_account_info();
        let escrow_vault = ctx.accounts.escrow_vault.to_account_info();
        let mint = ctx.accounts.mint.to_account_info();
        let buyer_token = ctx.accounts.buyer_token.to_account_info();
        let escrow_info = ctx.accounts.escrow.to_account_info();
        let bump_seed = [escrow_bump];
        let seeds: &[&[u8]] = &[b"escrow", slot_key.as_ref(), &bump_seed];
        let signer: &[&[&[u8]]] = &[seeds];

        let slot = &mut ctx.accounts.slot;
        require!(slot.mode == Mode::Stable, ErrorCode::WrongMode);
        require!(slot.state == SlotState::Reserved, ErrorCode::InvalidState);
        // Before T0 only
        let now = Clock::get()?.unix_timestamp;
        let t0 = t0_ts(slot);
        require!(now < t0, ErrorCode::TooLate);

        let escrow = &mut ctx.accounts.escrow;
        let buyer = escrow.buyer.ok_or(ErrorCode::NotReserved)?;
        require_keys_eq!(buyer, buyer_key, ErrorCode::UnauthorizedBuyer);
        let amount = escrow.amount_locked;
        require!(amount > 0, ErrorCode::NothingToRefund);
        let cpi_accounts = TransferChecked {
            from: escrow_vault,
            mint,
            to: buyer_token,
            authority: escrow_info,
        };
        transfer_checked(
            CpiContext::new_with_signer(
                token_program,
                cpi_accounts,
                signer,
            ),
            amount,
            decimals,
        )?;
        escrow.amount_locked = 0;
        escrow.buyer = None;
        slot.state = SlotState::Open;
        emit!(RefundedEvent { slot: slot_key, to: buyer_key, amount });
        Ok(())
    }

    pub fn stable_checkin(ctx: Context<StableCheckin>) -> Result<()> {
        let slot = &mut ctx.accounts.slot;
        require!(slot.mode == Mode::Stable, ErrorCode::WrongMode);
        require!(slot.state == SlotState::Reserved || slot.state == SlotState::Locked, ErrorCode::InvalidState);
        // Only buyer or creator authority may mark check-in for now (MVP)
        let buyer = ctx.accounts.escrow.buyer.ok_or(ErrorCode::NotReserved)?;
        require!(
            ctx.accounts.signer.key() == buyer || ctx.accounts.signer.key() == slot.creator_authority,
            ErrorCode::Unauthorized
        );
        slot.buyer_checked_in = true;
        slot.state = SlotState::Completed; // allow T1 payout
        emit!(CheckinEvent { slot: slot.key(), by: ctx.accounts.signer.key() });
        Ok(())
    }

    pub fn stable_settle(ctx: Context<StableSettle>) -> Result<()> {
        let decimals = ctx.accounts.mint.decimals;
        let slot_key = ctx.accounts.slot.key();
        let escrow_bump = ctx.accounts.escrow.bump;
        let token_program = ctx.accounts.token_program.to_account_info();
        let escrow_vault = ctx.accounts.escrow_vault.to_account_info();
        let mint = ctx.accounts.mint.to_account_info();
        let creator_payout = ctx.accounts.creator_payout_ata.to_account_info();
        let platform_vault = ctx.accounts.platform_vault.to_account_info();
        let escrow_info = ctx.accounts.escrow.to_account_info();
        let bump_seed = [escrow_bump];
        let seeds: &[&[u8]] = &[b"escrow", slot_key.as_ref(), &bump_seed];
        let signer: &[&[&[u8]]] = &[seeds];

        let platform = &ctx.accounts.platform;
        let slot = &mut ctx.accounts.slot;
        let escrow = &mut ctx.accounts.escrow;
        require!(slot.mode == Mode::Stable, ErrorCode::WrongMode);
        require!(!slot.frozen, ErrorCode::Frozen);
        require!(escrow.amount_locked == slot.price, ErrorCode::InvalidEscrowBalance);

        let total_fee = mul_bps_u64(slot.price, platform.platform_fee_bps as u64)?;
        let t0_base = mul_bps_u64(slot.price, STABLE_T0_BPS)?;
        let t1_base = slot.price.checked_sub(t0_base).ok_or(ErrorCode::Overflow)?;

        match slot.state {
            SlotState::Reserved => {
                // T0 release (50%) if time reached
                let now = Clock::get()?.unix_timestamp;
                let t0 = t0_ts(slot);
                require!(now >= t0, ErrorCode::TooEarly);

                let t0_fee = mul_bps_u64(total_fee, STABLE_T0_BPS)?;
                let t0_creator = t0_base.checked_sub(t0_fee).ok_or(ErrorCode::Overflow)?;

                // payout to creator
                transfer_checked(
                    CpiContext::new_with_signer(
                        token_program.clone(),
                        TransferChecked {
                            from: escrow_vault.clone(),
                            mint: mint.clone(),
                            to: creator_payout.clone(),
                            authority: escrow_info.clone(),
                        },
                        signer,
                    ),
                    t0_creator,
                    decimals,
                )?;
                // platform fee for T0
                transfer_checked(
                    CpiContext::new_with_signer(
                        token_program.clone(),
                        TransferChecked {
                            from: escrow_vault.clone(),
                            mint: mint.clone(),
                            to: platform_vault.clone(),
                            authority: escrow_info.clone(),
                        },
                        signer,
                    ),
                    t0_fee,
                    decimals,
                )?;

                // Update remaining escrow (T1 base still in escrow)
                escrow.amount_locked = escrow
                    .amount_locked
                    .checked_sub(t0_creator + t0_fee)
                    .ok_or(ErrorCode::Overflow)?;
                slot.state = SlotState::Locked;
                emit!(SettledT0Event { slot: slot_key, to: ctx.accounts.creator_payout_ata.key(), amount: t0_creator, fee: t0_fee });
                Ok(())
            }
            SlotState::Completed => {
                // T1 release (98% of remainder)
                let t1_release = mul_bps_u64(t1_base, FINAL_RELEASE_BPS)?; // amount destined for creator before platform fee
                let t1_withhold = t1_base.checked_sub(t1_release).ok_or(ErrorCode::Overflow)?; // retained per policy
                let t1_fee = mul_bps_u64(t1_base, platform.platform_fee_bps as u64)?;
                let t1_creator = t1_release.checked_sub(t1_fee).ok_or(ErrorCode::Overflow)?;

                // payouts
                transfer_checked(
                    CpiContext::new_with_signer(
                        token_program.clone(),
                        TransferChecked {
                            from: escrow_vault.clone(),
                            mint: mint.clone(),
                            to: creator_payout.clone(),
                            authority: escrow_info.clone(),
                        },
                        signer,
                    ),
                    t1_creator,
                    decimals,
                )?;
                transfer_checked(
                    CpiContext::new_with_signer(
                        token_program.clone(),
                        TransferChecked {
                            from: escrow_vault.clone(),
                            mint: mint.clone(),
                            to: platform_vault.clone(),
                            authority: escrow_info.clone(),
                        },
                        signer,
                    ),
                    t1_fee,
                    decimals,
                )?;
                if t1_withhold > 0 {
                    transfer_checked(
                        CpiContext::new_with_signer(
                            token_program.clone(),
                            TransferChecked {
                                from: escrow_vault.clone(),
                                mint: mint.clone(),
                                to: platform_vault.clone(),
                                authority: escrow_info.clone(),
                            },
                            signer,
                        ),
                        t1_withhold,
                        decimals,
                    )?;
                }

                // Update escrow and state
                let total_out = t1_creator
                    .checked_add(t1_fee).ok_or(ErrorCode::Overflow)?
                    .checked_add(t1_withhold).ok_or(ErrorCode::Overflow)?;
                require!(escrow.amount_locked >= total_out, ErrorCode::InvalidEscrowBalance);
                escrow.amount_locked = escrow.amount_locked.checked_sub(total_out).ok_or(ErrorCode::Overflow)?;
                slot.state = SlotState::Settled;
                emit!(SettledT1Event { slot: slot_key, to: ctx.accounts.creator_payout_ata.key(), amount: t1_creator, fee: t1_fee, retained: t1_withhold });
                Ok(())
            }
            _ => err!(ErrorCode::InvalidState),
        }
    }

    // ===================== Dispute =====================
    pub fn raise_dispute(ctx: Context<RaiseDispute>, _reason_code: u16) -> Result<()> {
        let slot = &mut ctx.accounts.slot;
        require!(!slot.frozen, ErrorCode::Frozen);
        let buyer = ctx.accounts.escrow.buyer.ok_or(ErrorCode::NotReserved)?;
        require!(
            ctx.accounts.raiser.key() == buyer || ctx.accounts.raiser.key() == slot.creator_authority,
            ErrorCode::Unauthorized
        );
        slot.frozen = true;
        emit!(DisputeRaisedEvent { slot: slot.key(), by: ctx.accounts.raiser.key() });
        Ok(())
    }

    pub fn resolve_dispute(ctx: Context<ResolveDispute>, payout_split_bps_to_creator: u16) -> Result<()> {
        require!(payout_split_bps_to_creator <= 10_000, ErrorCode::InvalidBps);
        let decimals = ctx.accounts.mint.decimals;
        let slot_key = ctx.accounts.slot.key();
        let escrow_bump = ctx.accounts.escrow.bump;
        let token_program = ctx.accounts.token_program.to_account_info();
        let escrow_vault = ctx.accounts.escrow_vault.to_account_info();
        let mint = ctx.accounts.mint.to_account_info();
        let creator_payout = ctx.accounts.creator_payout_ata.to_account_info();
        let buyer_token = ctx.accounts.buyer_token.to_account_info();
        let escrow_info = ctx.accounts.escrow.to_account_info();
        let bump_seed = [escrow_bump];
        let seeds: &[&[u8]] = &[b"escrow", slot_key.as_ref(), &bump_seed];
        let signer: &[&[&[u8]]] = &[seeds];

        let slot = &mut ctx.accounts.slot;
        require!(slot.frozen, ErrorCode::Unauthorized);
        let escrow = &mut ctx.accounts.escrow;
        let remaining = escrow.amount_locked;

        let to_creator = mul_bps_u64(remaining, payout_split_bps_to_creator as u64)?;
        let to_buyer = remaining.checked_sub(to_creator).ok_or(ErrorCode::Overflow)?;

        if to_creator > 0 {
            transfer_checked(
                CpiContext::new_with_signer(
                    token_program.clone(),
                    TransferChecked {
                        from: escrow_vault.clone(),
                        mint: mint.clone(),
                        to: creator_payout.clone(),
                        authority: escrow_info.clone(),
                    },
                    signer,
                ),
                to_creator,
                decimals,
            )?;
        }
        if to_buyer > 0 {
            transfer_checked(
                CpiContext::new_with_signer(
                    token_program.clone(),
                    TransferChecked {
                        from: escrow_vault,
                        mint,
                        to: buyer_token,
                        authority: escrow_info.clone(),
                    },
                    signer,
                ),
                to_buyer,
                decimals,
            )?;
        }

        escrow.amount_locked = 0;
        slot.frozen = false;
        slot.state = if to_creator > 0 { SlotState::Settled } else { SlotState::Refunded };
        emit!(DisputeResolvedEvent { slot: slot_key, creator_amount: to_creator, buyer_amount: to_buyer });
        Ok(())
    }
}

// Accounts

#[derive(Accounts)]
pub struct InitPlatform<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + Platform::LEN,
        seeds = [b"platform"],
        bump
    )]
    pub platform: Account<'info, Platform>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = platform,
        associated_token::token_program = token_program
    )]
    pub dispute_vault: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitCreatorProfile<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    /// Ensure we bind profile to a specific platform/mint
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = authority,
        space = 8 + CreatorProfile::LEN,
        seeds = [b"creator", authority.key().as_ref(), platform.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, CreatorProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCreatorProfile<'info> {
    pub authority: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(
        mut,
        seeds = [b"creator", authority.key().as_ref(), platform.key().as_ref()],
        bump = profile.bump,
        has_one = authority,
        constraint = profile.platform == platform.key()
    )]
    pub profile: Account<'info, CreatorProfile>,
}

#[derive(Accounts)]
#[instruction(params: CreateSlotParams)]
pub struct CreateTimeSlot<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        seeds = [b"creator", authority.key().as_ref(), platform.key().as_ref()],
        bump = profile.bump,
        has_one = authority,
        has_one = platform
    )]
    pub profile: Account<'info, CreatorProfile>,
    #[account(
        init,
        payer = authority,
        space = 8 + TimeSlot::LEN,
        // Uniqueness: profile + start_ts
        seeds = [b"slot", profile.key().as_ref(), &params.start_ts.to_le_bytes()],
        bump
    )]
    pub slot: Account<'info, TimeSlot>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitEscrow<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        seeds = [b"slot", profile.key().as_ref(), &slot.start_ts.to_le_bytes()],
        bump = slot.bump
    )]
    pub slot: Account<'info, TimeSlot>,
    #[account(
        mut,
        seeds = [b"creator", slot.creator_authority.as_ref(), platform.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, CreatorProfile>,
    #[account(
        init,
        payer = authority,
        space = 8 + Escrow::LEN,
        seeds = [b"escrow", slot.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = escrow,
        associated_token::token_program = token_program
    )]
    pub escrow_vault: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitBidBook<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(
        init,
        payer = authority,
        space = 8 + BidBook::LEN,
        seeds = [b"bidbook", slot.key().as_ref()],
        bump
    )]
    pub bidbook: Account<'info, BidBook>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(max_entries: u16)]
pub struct InitCommitStore<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(
        init,
        payer = authority,
        space = CommitStore::space_for(max_entries),
        seeds = [b"commit", slot.key().as_ref()],
        bump
    )]
    pub commit_store: Account<'info, CommitStore>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BidCommit<'info> {
    pub bidder: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    pub slot: Account<'info, TimeSlot>,
    #[account(mut, seeds = [b"commit", slot.key().as_ref()], bump = commit_store.bump)]
    pub commit_store: Account<'info, CommitStore>,
}

#[derive(Accounts)]
pub struct BidReveal<'info> {
    pub bidder: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    pub slot: Account<'info, TimeSlot>,
    #[account(mut, seeds = [b"commit", slot.key().as_ref()], bump = commit_store.bump)]
    pub commit_store: Account<'info, CommitStore>,
}

// Data

#[account]
pub struct Platform {
    pub admin: Pubkey,
    pub platform_fee_bps: u16,
    pub mint: Pubkey,
    pub dispute_vault: Pubkey,
    pub bump: u8,
}

impl Platform {
    pub const LEN: usize = 32 + 2 + 32 + 32 + 1;
}

#[account]
pub struct CreatorProfile {
    pub authority: Pubkey,
    pub payout_wallet: Pubkey,
    pub fee_bps_override: Option<u16>,
    pub platform: Pubkey,
    pub bump: u8,
}

impl CreatorProfile {
    pub const LEN: usize = 32 + 32 + 1 + 2 + 32 + 1; // Option<u16> ~ 1 tag + 2 value
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Mode {
    Stable,
    EnglishAuction,
    SealedBid,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum SlotState {
    Draft,
    Open,
    Reserved,
    AuctionLive,
    Locked,      // T0 payout done
    Completed,   // check-in / post-session OK
    Settled,
    Refunded,
    Closed,
}

#[account]
pub struct TimeSlot {
    pub creator_profile: Pubkey,
    pub creator_authority: Pubkey,
    pub platform: Pubkey,
    pub mint: Pubkey,
    pub start_ts: i64,
    pub end_ts: i64,
    pub tz_offset_min: i16,
    pub subject_hash: [u8; 32],
    pub venue_hash: [u8; 32],
    pub mode: Mode,
    pub state: SlotState,
    pub frozen: bool,
    pub buyer_checked_in: bool,
    pub capacity: u16,
    pub nft_mint: Pubkey,
    pub price: u64,
    pub min_increment_bps: u16,
    pub buy_now: Option<u64>,
    pub auction_start_ts: Option<i64>,
    pub auction_end_ts: Option<i64>,
    pub anti_sniping_sec: Option<u32>,
    pub bump: u8,
}

impl TimeSlot {
    pub const LEN: usize = 32 + 32 + 32 + 32 + 8 + 8 + 2 + 32 + 32 + 1 + 1 + 1 + 1 + 2 + 32 + 8 + 2 + (1 + 8) + (1 + 8) + (1 + 8) + (1 + 4) + 1;
}

#[account]
pub struct Escrow {
    pub slot: Pubkey,
    pub token_acc: Pubkey,
    pub amount_locked: u64,
    pub buyer: Option<Pubkey>,
    pub bump: u8,
}

impl Escrow {
    pub const LEN: usize = 32 + 32 + 8 + (1 + 32) + 1;
}

#[account]
pub struct BidBook {
    pub slot: Pubkey,
    pub highest_bid: u64,
    pub highest_bidder: Pubkey,
    pub next_min_bid: u64,
    pub last_bid_ts: i64,
    pub pending_refund_amount: u64,
    pub pending_refund_bidder: Pubkey,
    pub bump: u8,
}

impl BidBook {
    pub const LEN: usize = 32 + 8 + 32 + 8 + 8 + 8 + 32 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CommitEntry {
    pub bidder: Pubkey,
    pub commitment_hash: [u8; 32],
    pub revealed: bool,
    pub bid_amount: Option<u64>,
}

impl CommitEntry {
    pub const LEN: usize = 32 + 32 + 1 + (1 + 8);
}

#[account]
pub struct CommitStore {
    pub slot: Pubkey,
    pub max_entries: u16,
    pub count: u16,
    pub bump: u8,
    pub entries: Vec<CommitEntry>,
}

impl CommitStore {
    pub fn space_for(max_entries: u16) -> usize {
        // discriminator
        let base = 8 + 32 + 2 + 2 + 1 + 4; // vec prefix = 4
        base + (CommitEntry::LEN * max_entries as usize)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateSlotParams {
    pub start_ts: i64,
    pub end_ts: i64,
    pub tz_offset_min: i16,
    pub subject_hash: [u8; 32],
    pub venue_hash: [u8; 32],
    pub mode: Mode,
    pub capacity: u16,
    pub nft_mint: Option<Pubkey>,
    pub price: u64,
    pub min_increment_bps: u16,
    pub buy_now: Option<u64>,
    pub auction_start_ts: Option<i64>,
    pub auction_end_ts: Option<i64>,
    pub anti_sniping_sec: Option<u32>,
}

// Errors

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid basis points")] 
    InvalidBps,
    #[msg("Invalid time window")] 
    InvalidTimes,
    #[msg("Invalid capacity")] 
    InvalidCapacity,
    #[msg("Invalid price")] 
    InvalidPrice,
    #[msg("Missing auction window")] 
    MissingAuctionWindow,
    #[msg("Wrong mode for instruction")] 
    WrongMode,
    #[msg("Invalid state")] 
    InvalidState,
    #[msg("Too early")] 
    TooEarly,
    #[msg("Too late")] 
    TooLate,
    #[msg("Not reserved")] 
    NotReserved,
    #[msg("Unauthorized buyer")] 
    UnauthorizedBuyer,
    #[msg("Unauthorized")] 
    Unauthorized,
    #[msg("Nothing to refund")] 
    NothingToRefund,
    #[msg("Escrow balance mismatch")] 
    InvalidEscrowBalance,
    #[msg("Slot frozen by dispute")] 
    Frozen,
    #[msg("Bid too low")] 
    BidTooLow,
    #[msg("Pending refunds exist")] 
    RefundsPending,
    #[msg("No bids to end")] 
    NoBids,
    #[msg("Arithmetic overflow")] 
    Overflow,
    #[msg("Already committed")] 
    AlreadyCommitted,
    #[msg("Not committed")] 
    NotCommitted,
    #[msg("Already revealed")] 
    AlreadyRevealed,
    #[msg("Reveal mismatch")] 
    RevealMismatch,
}

// ===================== CPI helpers =====================

fn mul_bps_u64(amount: u64, bps: u64) -> Result<u64> {
    let v = (amount as u128)
        .checked_mul(bps as u128)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(BPS_DENOM as u128)
        .ok_or(ErrorCode::Overflow)?;
    Ok(v as u64)
}

fn t0_ts(slot: &TimeSlot) -> i64 {
    match slot.mode {
        Mode::Stable => slot.start_ts,
        Mode::EnglishAuction | Mode::SealedBid => slot.auction_end_ts.unwrap_or(slot.start_ts),
    }
}

// ===================== Events =====================

#[event]
pub struct ReservedEvent {
    pub slot: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RefundedEvent {
    pub slot: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
}

#[event]
pub struct CheckinEvent {
    pub slot: Pubkey,
    pub by: Pubkey,
}

#[event]
pub struct SettledT0Event {
    pub slot: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub fee: u64,
}

#[event]
pub struct SettledT1Event {
    pub slot: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub retained: u64,
}

#[event]
pub struct AuctionStartedEvent {
    pub slot: Pubkey,
    pub start_ts: i64,
}

#[event]
pub struct BidPlacedEvent {
    pub slot: Pubkey,
    pub bidder: Pubkey,
    pub amount: u64,
}

#[event]
pub struct OutbidRefundedEvent {
    pub slot: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
}

#[event]
pub struct AuctionExtendedEvent {
    pub slot: Pubkey,
    pub new_end_ts: i64,
}

#[event]
pub struct AuctionEndedEvent {
    pub slot: Pubkey,
    pub winner: Pubkey,
    pub winning_bid: u64,
}

#[event]
pub struct DisputeRaisedEvent {
    pub slot: Pubkey,
    pub by: Pubkey,
}

#[event]
pub struct DisputeResolvedEvent {
    pub slot: Pubkey,
    pub creator_amount: u64,
    pub buyer_amount: u64,
}

#[event]
pub struct CommitPlacedEvent {
    pub slot: Pubkey,
    pub bidder: Pubkey,
}

#[event]
pub struct RevealAcceptedEvent {
    pub slot: Pubkey,
    pub bidder: Pubkey,
    pub bid_amount: u64,
}

// ===================== Stable Accounts =====================

#[derive(Accounts)]
pub struct StableReserve<'info> {
    pub buyer: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(
        mut,
        seeds = [b"escrow", slot.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, constraint = buyer_token.owner == buyer.key() && buyer_token.mint == mint.key())]
    pub buyer_token: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct StableCancel<'info> {
    pub buyer: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(
        mut,
        seeds = [b"escrow", slot.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, constraint = buyer_token.owner == buyer.key() && buyer_token.mint == mint.key())]
    pub buyer_token: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct StableCheckin<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // buyer or creator authority
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(
        seeds = [b"escrow", slot.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct StableSettle<'info> {
    /// anyone can trigger based on time/state, no special auth
    #[account(mut)]
    pub authority: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(
        mut,
        seeds = [b"escrow", slot.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_vault: InterfaceAccount<'info, TokenAccount>,
    /// Creator payout ATA; will be created if missing
    /// NOTE: payout_wallet is stored on profile
    #[account(
        mut,
        seeds = [b"creator", slot.creator_authority.as_ref(), platform.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, CreatorProfile>,
    #[account(address = profile.payout_wallet)]
    /// CHECK: Address is constrained to `profile.payout_wallet` above.
    /// No further data access is performed on this account.
    pub profile_payout_wallet: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = profile_payout_wallet,
        associated_token::token_program = token_program
    )]
    pub creator_payout_ata: InterfaceAccount<'info, TokenAccount>,
    /// Platform vault (fees + retained policy)
    #[account(mut, address = platform.dispute_vault)]
    pub platform_vault: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

// ===================== Auction Accounts =====================

#[derive(Accounts)]
pub struct AuctionStart<'info> {
    pub creator: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(mut, seeds = [b"bidbook", slot.key().as_ref()], bump = bidbook.bump)]
    pub bidbook: Account<'info, BidBook>,
}

#[derive(Accounts)]
pub struct BidPlace<'info> {
    pub bidder: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(mut, seeds = [b"bidbook", slot.key().as_ref()], bump = bidbook.bump)]
    pub bidbook: Account<'info, BidBook>,
    #[account(mut, seeds = [b"escrow", slot.key().as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, constraint = bidder_token.owner == bidder.key() && bidder_token.mint == mint.key())]
    pub bidder_token: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct BidOutbidRefund<'info> {
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(mut, seeds = [b"bidbook", slot.key().as_ref()], bump = bidbook.bump)]
    pub bidbook: Account<'info, BidBook>,
    #[account(mut, seeds = [b"escrow", slot.key().as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_vault: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: just used for key check
    pub prev_bidder: UncheckedAccount<'info>,
    #[account(mut, constraint = prev_bidder_token.owner == prev_bidder.key() && prev_bidder_token.mint == mint.key())]
    pub prev_bidder_token: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct AuctionEnd<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(mut, seeds = [b"bidbook", slot.key().as_ref()], bump = bidbook.bump)]
    pub bidbook: Account<'info, BidBook>,
    #[account(mut, seeds = [b"escrow", slot.key().as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"creator", slot.creator_authority.as_ref(), platform.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, CreatorProfile>,
    #[account(address = profile.payout_wallet)]
    /// CHECK: Address is constrained to `profile.payout_wallet` above.
    /// No further data access is performed on this account.
    pub profile_payout_wallet: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = profile_payout_wallet,
        associated_token::token_program = token_program
    )]
    pub creator_payout_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, address = platform.dispute_vault)]
    pub platform_vault: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AuctionCheckin<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // winner or creator
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(seeds = [b"escrow", slot.key().as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct AuctionSettle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(mut, seeds = [b"bidbook", slot.key().as_ref()], bump = bidbook.bump)]
    pub bidbook: Account<'info, BidBook>,
    #[account(mut, seeds = [b"escrow", slot.key().as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"creator", slot.creator_authority.as_ref(), platform.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, CreatorProfile>,
    #[account(address = profile.payout_wallet)]
    /// CHECK: Address is constrained to `profile.payout_wallet` above.
    /// No further data access is performed on this account.
    pub profile_payout_wallet: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = profile_payout_wallet,
        associated_token::token_program = token_program
    )]
    pub creator_payout_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, address = platform.dispute_vault)]
    pub platform_vault: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RaiseDispute<'info> {
    pub raiser: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(seeds = [b"escrow", slot.key().as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(has_one = admin)]
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(mut, seeds = [b"escrow", slot.key().as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"creator", slot.creator_authority.as_ref(), platform.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, CreatorProfile>,
    #[account(address = profile.payout_wallet)]
    /// CHECK: Address is constrained to `profile.payout_wallet` above.
    /// No further data access is performed on this account.
    pub profile_payout_wallet: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = profile_payout_wallet,
        associated_token::token_program = token_program
    )]
    pub creator_payout_ata: InterfaceAccount<'info, TokenAccount>,
    /// Buyer token account to receive refund portion
    #[account(mut)]
    pub buyer_token: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}


