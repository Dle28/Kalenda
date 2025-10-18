use anchor_lang::prelude::*;
use anchor_spl::token_interface::{transfer_checked, mint_to, Mint, TokenAccount, TokenInterface, TransferChecked, MintTo};

use crate::*;
use crate::ErrorCode;
// Qualify error enum to avoid conflicts with anchor_lang::error::ErrorCode


pub fn init_platform(ctx: Context<InitPlatform>, platform_fee_bps: u16) -> Result<()> {
    require!(platform_fee_bps <= 10_000, crate::ErrorCode::InvalidBps);

    let platform = &mut ctx.accounts.platform;
    platform.admin = ctx.accounts.admin.key();
    platform.platform_fee_bps = platform_fee_bps;
    platform.mint = ctx.accounts.mint.key();
    platform.fee_vault = ctx.accounts.fee_vault.key();
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
        require!(bps <= 10_000, crate::ErrorCode::InvalidBps);
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
        require!(bps <= 10_000, crate::ErrorCode::InvalidBps);
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
            // Auctions only support single-winner in MVP
            require!(params.capacity == 1, ErrorCode::MultiCapacityUnsupported);
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
    slot.capacity_total = params.capacity;
    slot.capacity_sold = 0;
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
    bidbook.bump = ctx.bumps.bidbook;
    Ok(())
}

pub fn init_refund_queue(ctx: Context<InitRefundQueue>, max_entries: u16) -> Result<()> {
    require!(max_entries > 0, ErrorCode::InvalidCapacity);
    let q = &mut ctx.accounts.refund_queue;
    q.slot = ctx.accounts.slot.key();
    q.max_entries = max_entries;
    q.count = 0;
    q.cursor = 0;
    q.entries = Vec::with_capacity(max_entries as usize);
    q.bump = ctx.bumps.refund_queue;
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

pub fn init_auto_bid_store(ctx: Context<InitAutoBidStore>, max_entries: u16) -> Result<()> {
    require!(max_entries > 0, ErrorCode::InvalidCapacity);
    let store = &mut ctx.accounts.auto_bid_store;
    store.slot = ctx.accounts.slot.key();
    store.max_entries = max_entries;
    store.count = 0;
    store.entries = Vec::with_capacity(max_entries as usize);
    store.bump = ctx.bumps.auto_bid_store;
    Ok(())
}

pub fn bid_commit(ctx: Context<BidCommit>, commitment_hash: [u8; 32]) -> Result<()> {
    let slot = &ctx.accounts.slot;
    require!(slot.mode == Mode::SealedBid, ErrorCode::WrongMode);
    let store = &mut ctx.accounts.commit_store;
    // Use persisted max_entries instead of Vec capacity (capacity is not serialized across txns)
    require!(store.count < store.max_entries, ErrorCode::InvalidCapacity);
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
    require!(!slot.frozen, ErrorCode::Frozen);
    require!(slot.mode == Mode::EnglishAuction, ErrorCode::WrongMode);
    require!(slot.capacity_total == 1, ErrorCode::MultiCapacityUnsupported);
    require!(slot.state == SlotState::Open, ErrorCode::InvalidState);
    require_keys_eq!(slot.creator_authority, ctx.accounts.creator.key(), ErrorCode::Unauthorized);
    let now = Clock::get()?.unix_timestamp;
    let start = slot.auction_start_ts.ok_or(ErrorCode::MissingAuctionWindow)?;
    require!(now >= start, ErrorCode::TooEarly);
    slot.state = SlotState::AuctionLive;
    emit!(AuctionStartedEvent { slot: slot.key(), start_ts: now });
    Ok(())
}

pub fn buy_now(ctx: Context<BuyNow>) -> Result<()> {
    let slot = &mut ctx.accounts.slot;
    require!(!slot.frozen, ErrorCode::Frozen);
    let book = &mut ctx.accounts.bidbook;
    require!(slot.mode == Mode::EnglishAuction, ErrorCode::WrongMode);
    require!(slot.capacity_total == 1, ErrorCode::MultiCapacityUnsupported);
    require!(slot.state == SlotState::Open || slot.state == SlotState::AuctionLive, ErrorCode::InvalidState);
    // ensure buy_now price is set
    let price = slot.buy_now.ok_or(ErrorCode::InvalidPrice)?;
    // transfer bidder -> escrow vault
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
        price,
        decimals,
    )?;

    // bind escrow to buyer and set highest
    let escrow = &mut ctx.accounts.escrow;
    escrow.amount_locked = escrow
        .amount_locked
        .checked_add(price)
        .ok_or(ErrorCode::Overflow)?;
    escrow.buyer = Some(ctx.accounts.bidder.key());
    book.highest_bid = price;
    book.highest_bidder = ctx.accounts.bidder.key();

    // Payout T0 immediately like auction_end
    let slot_key = slot.key();
    let escrow_bump = escrow.bump;
    let token_program = ctx.accounts.token_program.to_account_info();
    let escrow_vault = ctx.accounts.escrow_vault.to_account_info();
    let creator_payout = ctx.accounts.creator_payout_ata.to_account_info();
    let fee_vault = ctx.accounts.fee_vault.to_account_info();
    let mint = ctx.accounts.mint.to_account_info();
    let escrow_info = ctx.accounts.escrow.to_account_info();
    let bump_seed = [escrow_bump];
    let seeds: &[&[u8]] = &[b"escrow", slot_key.as_ref(), &bump_seed];
    let signer: &[&[&[u8]]] = &[seeds];

    let eff_bps = effective_fee_bps(&ctx.accounts.platform, &ctx.accounts.profile);
    let total_fee = mul_bps_u64(price, eff_bps as u64)?;
    let t0_base = mul_bps_u64(price, AUCTION_T0_BPS)?;
    let t0_fee = mul_bps_u64(total_fee, AUCTION_T0_BPS)?;
    let t0_creator = t0_base.checked_sub(t0_fee).ok_or(ErrorCode::Overflow)?;
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
    transfer_checked(
        CpiContext::new_with_signer(
            token_program,
            TransferChecked {
                from: escrow_vault,
                mint,
                to: fee_vault,
                authority: escrow_info,
            },
            signer,
        ),
        t0_fee,
        decimals,
    )?;
    escrow.amount_locked = escrow.amount_locked.checked_sub(t0_creator + t0_fee).ok_or(ErrorCode::Overflow)?;
    slot.state = SlotState::Locked;
    // Mint NFT to buyer if configured
    if slot.nft_mint != Pubkey::default() && ctx.accounts.nft_mint.key() == slot.nft_mint {
        let slot_key = slot.key();
        let (_pda, bump) = Pubkey::find_program_address(&[b"nft_auth", slot_key.as_ref()], &crate::ID);
        let seeds: &[&[u8]] = &[b"nft_auth", slot_key.as_ref(), &[bump]];
        let signer: &[&[&[u8]]] = &[seeds];
        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.nft_mint.to_account_info(),
                    to: ctx.accounts.buyer_nft_ata.to_account_info(),
                    authority: ctx.accounts.nft_auth.to_account_info(),
                },
                signer,
            ),
            1,
        )?;
    }
    emit!(AuctionEndedEvent { slot: slot_key, winner: book.highest_bidder, winning_bid: book.highest_bid });
    Ok(())
}

pub fn auction_update_end(ctx: Context<AuctionUpdateEnd>, new_end_ts: i64) -> Result<()> {
    let slot = &mut ctx.accounts.slot;
    require!(!slot.frozen, ErrorCode::Frozen);
    require!(slot.mode == Mode::EnglishAuction, ErrorCode::WrongMode);
    // Only the creator can update; enforced by has_one + explicit check
    require_keys_eq!(slot.creator_authority, ctx.accounts.creator.key(), ErrorCode::Unauthorized);
    // Validity: new_end_ts must be in the future relative to now and after start if provided
    let now = Clock::get()?.unix_timestamp;
    require!(new_end_ts > now, ErrorCode::InvalidTimes);
    if let Some(start) = slot.auction_start_ts {
        require!(new_end_ts > start, ErrorCode::InvalidTimes);
    }
    match slot.state {
        SlotState::Open => {
            // Allow setting or updating end before auction starts
            slot.auction_end_ts = Some(new_end_ts);
        }
        SlotState::AuctionLive => {
            // When live, only allow extension, not shortening
            let prev = slot.auction_end_ts.ok_or(ErrorCode::MissingAuctionWindow)?;
            require!(new_end_ts > prev, ErrorCode::TooEarly);
            slot.auction_end_ts = Some(new_end_ts);
        }
        _ => return err!(ErrorCode::InvalidState),
    }
    emit!(AuctionExtendedEvent { slot: slot.key(), new_end_ts });
    Ok(())
}

pub fn bid_place(ctx: Context<BidPlace>, bid_amount: u64, _max_auto_bid: Option<u64>) -> Result<()> {
    let slot = &mut ctx.accounts.slot;
    require!(!slot.frozen, ErrorCode::Frozen);
    let book = &mut ctx.accounts.bidbook;
    require!(slot.mode == Mode::EnglishAuction, ErrorCode::WrongMode);
    require!(slot.capacity_total == 1, ErrorCode::MultiCapacityUnsupported);
    require!(slot.state == SlotState::AuctionLive, ErrorCode::InvalidState);
    require!(ctx.accounts.bidder.key() != slot.creator_authority, ErrorCode::Unauthorized);
    // Refunds are handled via queue; no need to block new bids.

    // Enforce min increment
    let min_required = if book.highest_bid == 0 {
        slot.price // treat as starting price
    } else {
        let inc = core::cmp::max(1u64, mul_bps_u64(book.highest_bid, slot.min_increment_bps as u64)?);
        book.highest_bid.checked_add(inc).ok_or(ErrorCode::Overflow)?
    };
    require!(bid_amount >= min_required, ErrorCode::BidTooLow);

    // Register/Update auto-bid max for this bidder if provided
    if let Some(max) = _max_auto_bid {
        let store = &mut ctx.accounts.auto_bid_store;
        // ensure capacity
        if store
            .entries
            .iter()
            .find(|e| e.bidder == ctx.accounts.bidder.key())
            .is_none()
        {
            require!(store.count < store.max_entries, ErrorCode::InvalidCapacity);
            store.entries.push(AutoBidEntry { bidder: ctx.accounts.bidder.key(), max_bid: max });
            store.count = store.count.saturating_add(1);
        } else {
            // update existing
            for e in store.entries.iter_mut() {
                if e.bidder == ctx.accounts.bidder.key() {
                    e.max_bid = max;
                }
            }
        }
    }

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

    // Enqueue refund for previous highest (if any)
    if book.highest_bid > 0 {
        let q = &mut ctx.accounts.refund_queue;
        require!(q.count < q.max_entries, ErrorCode::InvalidCapacity);
        q.entries.push(RefundEntry { bidder: book.highest_bidder, amount: book.highest_bid });
        q.count = q.count.saturating_add(1);
    }

    // Anti-sniping: extend if within window
    let now = Clock::get()?.unix_timestamp;
    if let (Some(end), Some(ext)) = (slot.auction_end_ts, slot.anti_sniping_sec) {
        if end - now <= ext as i64 {
            slot.auction_end_ts = Some(end + ext as i64);
            emit!(AuctionExtendedEvent { slot: slot.key(), new_end_ts: end + ext as i64 });
        }
    }

    // Update highest with current bid
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

    // After placing this bid, see if any other auto-bidder can outbid up to their max
    // Simple loop: find competitor with highest max that exceeds next min, place a synthetic outbid
    let store = &mut ctx.accounts.auto_bid_store;
    let mut next_min = {
        if book.highest_bid == 0 { slot.price } else { let inc = core::cmp::max(1u64, mul_bps_u64(book.highest_bid, slot.min_increment_bps as u64)?); book.highest_bid.checked_add(inc).ok_or(ErrorCode::Overflow)? }
    };
    loop {
        // pick best competitor (not current highest)
        let mut competitor: Option<(Pubkey, u64)> = None;
        for e in store.entries.iter() {
            if e.bidder != book.highest_bidder && e.max_bid >= next_min {
                if let Some((_, cm)) = competitor {
                    if e.max_bid > cm { competitor = Some((e.bidder, e.max_bid)); }
                } else {
                    competitor = Some((e.bidder, e.max_bid));
                }
            }
        }
        let Some((comp_bidder, comp_max)) = competitor else { break };
        // compute their actual counter bid = min(comp_max, next_min)
        let counter = next_min.min(comp_max);
        // mark refund for previous highest
        if book.highest_bid > 0 {
            let q = &mut ctx.accounts.refund_queue;
            require!(q.count < q.max_entries, ErrorCode::InvalidCapacity);
            q.entries.push(RefundEntry { bidder: book.highest_bidder, amount: book.highest_bid });
            q.count = q.count.saturating_add(1);
        }
        // update highest to competitor
        book.highest_bid = counter;
        book.highest_bidder = comp_bidder;
        book.last_bid_ts = now;
        // recompute next_min
        next_min = {
            let inc = core::cmp::max(1u64, mul_bps_u64(book.highest_bid, slot.min_increment_bps as u64)?);
            book.highest_bid.checked_add(inc).ok_or(ErrorCode::Overflow)?
        };
        // stop if no one else can auto-outbid further
        // Note: we don't move tokens for synthetic bids; bidders must pre-fund via explicit bids.
        // Escrow amount_locked continues to reflect deposited funds by explicit bids only.
        // This keeps on-chain state consistent while simulating bidding outcome for winner binding at end.
        if store.entries.iter().all(|e| e.bidder == book.highest_bidder || e.max_bid < next_min) {
            break;
        }
    }
    Ok(())
}

pub fn bid_outbid_refund(ctx: Context<BidOutbidRefund>) -> Result<()> {
    let slot = &ctx.accounts.slot;
    require!(!slot.frozen, ErrorCode::Frozen);
    let q = &mut ctx.accounts.refund_queue;
    require!(q.count > 0, ErrorCode::NothingToRefund);
    let idx = q.cursor as usize;
    let entry = q.entries.get(idx).cloned().ok_or(ErrorCode::NothingToRefund)?;
    require_keys_eq!(entry.bidder, ctx.accounts.prev_bidder.key(), ErrorCode::Unauthorized);
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
    let amt = entry.amount;
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
    // Advance queue
    q.cursor = q.cursor.saturating_add(1);
    q.count = q.count.saturating_sub(1);
    Ok(())
}

pub fn auction_end(ctx: Context<AuctionEnd>) -> Result<()> {
    let decimals = ctx.accounts.mint.decimals;
    let slot_key = ctx.accounts.slot.key();
    let escrow_bump = ctx.accounts.escrow.bump;
    let token_program = ctx.accounts.token_program.to_account_info();
    let escrow_vault = ctx.accounts.escrow_vault.to_account_info();
    let creator_payout = ctx.accounts.creator_payout_ata.to_account_info();
    let fee_vault = ctx.accounts.fee_vault.to_account_info();
    let mint = ctx.accounts.mint.to_account_info();
    let escrow_info = ctx.accounts.escrow.to_account_info();
    let bump_seed = [escrow_bump];
    let seeds: &[&[u8]] = &[b"escrow", slot_key.as_ref(), &bump_seed];
    let signer: &[&[&[u8]]] = &[seeds];

    let slot = &mut ctx.accounts.slot;
    require!(!slot.frozen, ErrorCode::Frozen);
    let book = &mut ctx.accounts.bidbook;
    require!(slot.mode == Mode::EnglishAuction, ErrorCode::WrongMode);
    require!(slot.capacity_total == 1, ErrorCode::MultiCapacityUnsupported);
    require!(slot.state == SlotState::AuctionLive, ErrorCode::InvalidState);
    // Allow auction end even if refund queue has entries; settlement relies on highest bid escrow amount only.
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
    let eff_bps = effective_fee_bps(&ctx.accounts.platform, &ctx.accounts.profile);
    let total_fee = mul_bps_u64(book.highest_bid, eff_bps as u64)?;
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
                to: fee_vault,
                authority: escrow_info,
            },
            signer,
        ),
        t0_fee,
        decimals,
    )?;
    escrow.amount_locked = escrow.amount_locked.checked_sub(t0_creator + t0_fee).ok_or(ErrorCode::Overflow)?;
    slot.state = SlotState::Locked;
    // Mint NFT to winner (to escrow authority ATA for MVP) if configured
    if slot.nft_mint != Pubkey::default() && ctx.accounts.nft_mint.key() == slot.nft_mint {
        let slot_key = slot.key();
        let (_pda, bump) = Pubkey::find_program_address(&[b"nft_auth", slot_key.as_ref()], &crate::ID);
        let seeds: &[&[u8]] = &[b"nft_auth", slot_key.as_ref(), &[bump]];
        let signer: &[&[&[u8]]] = &[seeds];
        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.nft_mint.to_account_info(),
                    to: ctx.accounts.winner_nft_ata.to_account_info(),
                    authority: ctx.accounts.nft_auth.to_account_info(),
                },
                signer,
            ),
            1,
        )?;
    }
    emit!(AuctionEndedEvent { slot: slot_key, winner: book.highest_bidder, winning_bid: book.highest_bid });
    Ok(())
}

pub fn auction_checkin(ctx: Context<AuctionCheckin>) -> Result<()> {
    let slot = &mut ctx.accounts.slot;
    require!(!slot.frozen, ErrorCode::Frozen);
    require!(matches!(slot.mode, Mode::EnglishAuction | Mode::SealedBid), ErrorCode::WrongMode);
    if slot.mode != Mode::Stable { require!(slot.capacity_total == 1, ErrorCode::MultiCapacityUnsupported); }
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

pub fn sealed_auction_end(ctx: Context<SealedAuctionEnd>) -> Result<()> {
    let decimals = ctx.accounts.mint.decimals;
    let slot_key = ctx.accounts.slot.key();
    let escrow_bump = ctx.accounts.escrow.bump;
    let token_program = ctx.accounts.token_program.to_account_info();
    let escrow_vault = ctx.accounts.escrow_vault.to_account_info();
    let fee_vault = ctx.accounts.fee_vault.to_account_info();
    let creator_payout = ctx.accounts.creator_payout_ata.to_account_info();
    let mint = ctx.accounts.mint.to_account_info();
    let escrow_info = ctx.accounts.escrow.to_account_info();
    let bump_seed = [escrow_bump];
    let seeds: &[&[u8]] = &[b"escrow", slot_key.as_ref(), &bump_seed];
    let signer: &[&[&[u8]]] = &[seeds];

    let slot = &mut ctx.accounts.slot;
    require!(!slot.frozen, ErrorCode::Frozen);
    require!(slot.mode == Mode::SealedBid, ErrorCode::WrongMode);
    require!(slot.capacity_total == 1, ErrorCode::MultiCapacityUnsupported);
    require!(slot.state == SlotState::Open || slot.state == SlotState::AuctionLive, ErrorCode::InvalidState);
    let now = Clock::get()?.unix_timestamp;
    let end = slot.auction_end_ts.ok_or(ErrorCode::MissingAuctionWindow)?;
    require!(now >= end, ErrorCode::TooEarly);

    // Determine highest revealed bid
    let store = &ctx.accounts.commit_store;
    let mut highest: Option<(Pubkey, u64)> = None;
    for e in store.entries.iter() {
        if e.revealed {
            if let Some(b) = e.bid_amount {
                highest = match highest {
                    None => Some((e.bidder, b)),
                    Some((_, hb)) if b > hb => Some((e.bidder, b)),
                    other => other,
                };
            }
        }
    }
    require!(highest.is_some(), ErrorCode::NoBids);
    let (winner, winning_bid) = highest.unwrap();

    // Escrow must already hold buyer funds; in sealed-bid MVP we assume bids were prepaid via a separate flow.
    // Bind escrow to winner and enforce balance equals winning_bid.
    let escrow = &mut ctx.accounts.escrow;
    escrow.buyer = Some(winner);
    require!(escrow.amount_locked == winning_bid, ErrorCode::InvalidEscrowBalance);

    // T0 payout (same as English auction: 40% base), fee pro-rata
    let eff_bps = super::effective_fee_bps(&ctx.accounts.platform, &ctx.accounts.profile);
    let total_fee = super::mul_bps_u64(winning_bid, eff_bps as u64)?;
    let t0_base = super::mul_bps_u64(winning_bid, super::AUCTION_T0_BPS)?;
    let t0_fee = super::mul_bps_u64(total_fee, super::AUCTION_T0_BPS)?;
    let t0_creator = t0_base.checked_sub(t0_fee).ok_or(ErrorCode::Overflow)?;

    // transfer from escrow to creator and platform
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
    transfer_checked(
        CpiContext::new_with_signer(
            token_program.clone(),
            TransferChecked {
                from: escrow_vault.clone(),
                mint: mint.clone(),
                to: fee_vault.clone(),
                authority: escrow_info.clone(),
            },
            signer,
        ),
        t0_fee,
        decimals,
    )?;
    escrow.amount_locked = escrow.amount_locked.checked_sub(t0_creator + t0_fee).ok_or(ErrorCode::Overflow)?;
    slot.state = SlotState::Locked;
    // Mint NFT to winner (to escrow authority ATA for MVP) if configured
    if slot.nft_mint != Pubkey::default() && ctx.accounts.nft_mint.key() == slot.nft_mint {
        let slot_key = slot.key();
        let (_pda, bump) = Pubkey::find_program_address(&[b"nft_auth", slot_key.as_ref()], &crate::ID);
        let seeds: &[&[u8]] = &[b"nft_auth", slot_key.as_ref(), &[bump]];
        let signer: &[&[&[u8]]] = &[seeds];
        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.nft_mint.to_account_info(),
                    to: ctx.accounts.winner_nft_ata.to_account_info(),
                    authority: ctx.accounts.nft_auth.to_account_info(),
                },
                signer,
            ),
            1,
        )?;
    }
    emit!(AuctionEndedEvent { slot: slot_key, winner, winning_bid });
    Ok(())
}

pub fn sealed_auction_settle(ctx: Context<SealedAuctionSettle>) -> Result<()> {
    let decimals = ctx.accounts.mint.decimals;
    let slot_key = ctx.accounts.slot.key();
    let escrow_bump = ctx.accounts.escrow.bump;
    let token_program = ctx.accounts.token_program.to_account_info();
    let escrow_vault = ctx.accounts.escrow_vault.to_account_info();
    let fee_vault = ctx.accounts.fee_vault.to_account_info();
    let creator_payout = ctx.accounts.creator_payout_ata.to_account_info();
    let mint = ctx.accounts.mint.to_account_info();
    let escrow_info = ctx.accounts.escrow.to_account_info();
    let bump_seed = [escrow_bump];
    let seeds: &[&[u8]] = &[b"escrow", slot_key.as_ref(), &bump_seed];
    let signer: &[&[&[u8]]] = &[seeds];

    let platform = &ctx.accounts.platform;
    let slot = &mut ctx.accounts.slot;
    let escrow = &mut ctx.accounts.escrow;
    require!(slot.mode == Mode::SealedBid, ErrorCode::WrongMode);
    require!(slot.capacity_total == 1, ErrorCode::MultiCapacityUnsupported);
    require!(!slot.frozen, ErrorCode::Frozen);
    require!(slot.state == SlotState::Completed, ErrorCode::InvalidState);

    // Remaining base after T0 is (winning_bid - T0_base)
    let total_paid = escrow
        .amount_locked
        .checked_add(super::mul_bps_u64(
            escrow.amount_locked.saturating_mul(super::BPS_DENOM - super::FINAL_RELEASE_BPS) / (super::BPS_DENOM - super::AUCTION_T0_BPS),
            0,
        )?)
        .unwrap_or(escrow.amount_locked); // safe fallback (not used)

    // For sealed-bid, mirror English auction T1 logic: compute from implied winning bid = escrow_remaining + t0_base
    // We need winning_bid; reconstruct as t0_base + t1_base where t1_base = escrow.amount_locked / (1)
    // Simpler: store not available here; as MVP we assume escrow.amount_locked is t1_base.
    let t1_base = escrow.amount_locked;
    let t1_release = super::mul_bps_u64(t1_base, super::FINAL_RELEASE_BPS)?;
    let t1_withhold = t1_base.checked_sub(t1_release).ok_or(ErrorCode::Overflow)?;
    let eff_bps = super::effective_fee_bps(platform, &ctx.accounts.profile);
    let t1_fee = super::mul_bps_u64(t1_base, eff_bps as u64)?;
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
                to: fee_vault.clone(),
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
                    from: escrow_vault,
                    mint: mint.clone(),
                    to: ctx.accounts.dispute_vault.to_account_info().clone(),
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
pub fn auction_settle(ctx: Context<AuctionSettle>) -> Result<()> {
    let decimals = ctx.accounts.mint.decimals;
    let slot_key = ctx.accounts.slot.key();
    let escrow_bump = ctx.accounts.escrow.bump;
    let token_program = ctx.accounts.token_program.to_account_info();
    let escrow_vault = ctx.accounts.escrow_vault.to_account_info();
    let mint = ctx.accounts.mint.to_account_info();
    let creator_payout = ctx.accounts.creator_payout_ata.to_account_info();
    let fee_vault = ctx.accounts.fee_vault.to_account_info();
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
                to: fee_vault.clone(),
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
                    to: ctx.accounts.dispute_vault.to_account_info().clone(),
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

