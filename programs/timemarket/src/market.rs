use anchor_lang::prelude::*;
use anchor_spl::token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::*;

pub fn init_platform(ctx: Context<InitPlatform>, platform_fee_bps: u16) -> Result<()> {
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

pub fn create_time_slot(ctx: Context<CreateTimeSlot>, params: CreateSlotParams) -> Result<()> {
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
                to: creator_payout.clone(),
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

