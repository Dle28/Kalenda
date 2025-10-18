use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{transfer_checked, mint_to, Mint, TokenAccount, TokenInterface, TransferChecked, MintTo};

use crate::*;
use crate::ErrorCode; // disambiguate from anchor_lang::error::ErrorCode

pub fn init_escrow(ctx: Context<InitEscrow>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    escrow.slot = ctx.accounts.slot.key();
    escrow.token_acc = ctx.accounts.escrow_vault.key();
    escrow.amount_locked = 0;
    escrow.buyer = None;
    escrow.bump = ctx.bumps.escrow;
    Ok(())
}

pub fn stable_reserve(ctx: Context<StableReserve>, amount: u64) -> Result<()> {
    let slot = &mut ctx.accounts.slot;
    require!(slot.mode == Mode::Stable, ErrorCode::WrongMode);
    require!(slot.state == SlotState::Open, ErrorCode::InvalidState);
    require!(amount == slot.price, ErrorCode::InvalidPrice);
    // Capacity check: ensure remaining capacity
    require!(slot.capacity_sold < slot.capacity_total, ErrorCode::CapacityExhausted);
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
    require!(!slot.frozen, ErrorCode::Frozen);
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
    require!(!slot.frozen, ErrorCode::Frozen);
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
    // Increment capacity sold on successful check-in
    if slot.capacity_sold < slot.capacity_total {
        slot.capacity_sold = slot.capacity_sold.saturating_add(1);
    }
    // Mint NFT to buyer upon check-in if configured
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
    let fee_vault = ctx.accounts.fee_vault.to_account_info();
    let dispute_vault = ctx.accounts.dispute_vault.to_account_info();
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

    let eff_bps = effective_fee_bps(platform, &ctx.accounts.profile);
    let total_fee = mul_bps_u64(slot.price, eff_bps as u64)?;
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
            let eff_bps = effective_fee_bps(platform, &ctx.accounts.profile);
            let t1_fee = mul_bps_u64(t1_base, eff_bps as u64)?;
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
                            from: escrow_vault.clone(),
                            mint: mint.clone(),
                            to: dispute_vault.clone(),
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

// ===================== SOL Stable flow (MVP) =====================

pub fn stable_reserve_sol(ctx: Context<StableReserveSol>) -> Result<()> {
    let slot = &mut ctx.accounts.slot;
    require!(slot.mode == Mode::Stable, ErrorCode::WrongMode);
    require!(slot.state == SlotState::Open, ErrorCode::InvalidState);
    // Capacity check
    require!(slot.capacity_sold < slot.capacity_total, ErrorCode::CapacityExhausted);

    // Transfer lamports from buyer to escrow PDA data account
    let price = slot.price; // lamports for SOL path
    let ix = system_program::Transfer {
        from: ctx.accounts.buyer.to_account_info(),
        to: ctx.accounts.escrow.to_account_info(),
    };
    system_program::transfer(
        CpiContext::new(ctx.accounts.system_program.to_account_info(), ix),
        price,
    )?;

    let escrow = &mut ctx.accounts.escrow;
    escrow.amount_locked = escrow
        .amount_locked
        .checked_add(price)
        .ok_or(ErrorCode::Overflow)?;
    escrow.buyer = Some(ctx.accounts.buyer.key());
    slot.state = SlotState::Reserved;
    emit!(ReservedEvent { slot: slot.key(), buyer: ctx.accounts.buyer.key(), amount: price });
    Ok(())
}

pub fn stable_cancel_sol(ctx: Context<StableCancelSol>) -> Result<()> {
    let slot = &mut ctx.accounts.slot;
    require!(slot.mode == Mode::Stable, ErrorCode::WrongMode);
    require!(slot.state == SlotState::Reserved, ErrorCode::InvalidState);

    // Before T0 only
    let now = Clock::get()?.unix_timestamp;
    let t0 = t0_ts(slot);
    require!(now < t0, ErrorCode::TooLate);

    // Get buyer before mutably borrowing escrow
    let buyer = ctx.accounts.escrow.buyer.ok_or(ErrorCode::NotReserved)?;
    require_keys_eq!(buyer, ctx.accounts.buyer.key(), ErrorCode::UnauthorizedBuyer);
    let amount = ctx.accounts.escrow.amount_locked;
    require!(amount > 0, ErrorCode::NothingToRefund);

    // Move lamports back from escrow to buyer
    {
        let escrow_info = ctx.accounts.escrow.to_account_info();
        let buyer_info = ctx.accounts.buyer.to_account_info();
        let mut escrow_lamports = escrow_info.try_borrow_mut_lamports()?;
        let mut buyer_lamports = buyer_info.try_borrow_mut_lamports()?;
        // Explicit intermediate arithmetic to prevent underflow/overflow and avoid borrow mixups
        let new_escrow = (*escrow_lamports)
            .checked_sub(amount)
            .ok_or(ErrorCode::Overflow)?;
        let new_buyer = (*buyer_lamports)
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;
    **escrow_lamports = new_escrow;
    **buyer_lamports = new_buyer;
    }

    let escrow = &mut ctx.accounts.escrow;
    escrow.amount_locked = 0;
    escrow.buyer = None;
    slot.state = SlotState::Open;
    emit!(RefundedEvent { slot: slot.key(), to: ctx.accounts.buyer.key(), amount });
    Ok(())
}

pub fn stable_settle_sol(ctx: Context<StableSettleSol>) -> Result<()> {
    let slot_key = ctx.accounts.slot.key();
    let platform = &ctx.accounts.platform;
    let slot = &mut ctx.accounts.slot;
    // Work with values first to avoid conflicting borrows
    let escrow_locked = ctx.accounts.escrow.amount_locked;
    require!(slot.mode == Mode::Stable, ErrorCode::WrongMode);
    require!(!slot.frozen, ErrorCode::Frozen);
    require!(escrow_locked == slot.price, ErrorCode::InvalidEscrowBalance);

    let eff_bps = effective_fee_bps(platform, &ctx.accounts.profile);
    let total_fee = mul_bps_u64(slot.price, eff_bps as u64)?;
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

            // Move lamports: escrow -> creator and fee
            {
                let escrow_info = ctx.accounts.escrow.to_account_info();
                let creator_info = ctx.accounts.creator_payout.to_account_info();
                let fee_info = ctx.accounts.fee_receiver.to_account_info();
                let mut from = escrow_info.try_borrow_mut_lamports()?;
                let mut to_creator = creator_info.try_borrow_mut_lamports()?;
                let mut to_fee = fee_info.try_borrow_mut_lamports()?;
                let new_from = (*from)
                    .checked_sub(t0_creator + t0_fee)
                    .ok_or(ErrorCode::Overflow)?;
                let new_creator = (*to_creator)
                    .checked_add(t0_creator)
                    .ok_or(ErrorCode::Overflow)?;
                let new_fee = (*to_fee)
                    .checked_add(t0_fee)
                    .ok_or(ErrorCode::Overflow)?;
                **from = new_from;
                **to_creator = new_creator;
                **to_fee = new_fee;
            }

            // Update remaining escrow (T1 base still in escrow)
            let new_locked = escrow_locked
                .checked_sub(t0_creator + t0_fee)
                .ok_or(ErrorCode::Overflow)?;
            let escrow = &mut ctx.accounts.escrow;
            escrow.amount_locked = new_locked;
            slot.state = SlotState::Locked;
            emit!(SettledT0Event { slot: slot_key, to: ctx.accounts.creator_payout.key(), amount: t0_creator, fee: t0_fee });
            Ok(())
        }
        SlotState::Completed => {
            // T1 release (98% of remainder)
            let t1_release = mul_bps_u64(t1_base, FINAL_RELEASE_BPS)?; // amount destined for creator before platform fee
            let t1_withhold = t1_base.checked_sub(t1_release).ok_or(ErrorCode::Overflow)?; // retained per policy
            let t1_fee = mul_bps_u64(t1_base, eff_bps as u64)?;
            let t1_creator = t1_release.checked_sub(t1_fee).ok_or(ErrorCode::Overflow)?;

            // payouts from escrow lamports
            {
                let escrow_info = ctx.accounts.escrow.to_account_info();
                let creator_info = ctx.accounts.creator_payout.to_account_info();
                let fee_info = ctx.accounts.fee_receiver.to_account_info();
                let dispute_info = ctx.accounts.dispute_receiver.to_account_info();
                let mut from = escrow_info.try_borrow_mut_lamports()?;
                let mut to_creator = creator_info.try_borrow_mut_lamports()?;
                let mut to_fee = fee_info.try_borrow_mut_lamports()?;
                let mut to_dispute = dispute_info.try_borrow_mut_lamports()?;
                let new_from = (*from)
                    .checked_sub(t1_creator + t1_fee + t1_withhold)
                    .ok_or(ErrorCode::Overflow)?;
                let new_creator = (*to_creator).checked_add(t1_creator).ok_or(ErrorCode::Overflow)?;
                let new_fee = (*to_fee).checked_add(t1_fee).ok_or(ErrorCode::Overflow)?;
                let new_dispute = if t1_withhold > 0 {
                    (*to_dispute).checked_add(t1_withhold).ok_or(ErrorCode::Overflow)?
                } else {
                    **to_dispute
                };
                **from = new_from;
                **to_creator = new_creator;
                **to_fee = new_fee;
                **to_dispute = new_dispute;
            }

            // Update escrow and state
            let total_out = t1_creator
                .checked_add(t1_fee).ok_or(ErrorCode::Overflow)?
                .checked_add(t1_withhold).ok_or(ErrorCode::Overflow)?;
            require!(escrow_locked >= total_out, ErrorCode::InvalidEscrowBalance);
            let new_locked = escrow_locked.checked_sub(total_out).ok_or(ErrorCode::Overflow)?;
            let escrow = &mut ctx.accounts.escrow;
            escrow.amount_locked = new_locked;
            slot.state = SlotState::Settled;
            emit!(SettledT1Event { slot: slot_key, to: ctx.accounts.creator_payout.key(), amount: t1_creator, fee: t1_fee, retained: t1_withhold });
            Ok(())
        }
        _ => err!(ErrorCode::InvalidState),
    }
}

fn t0_ts(slot: &TimeSlot) -> i64 {
    match slot.mode {
        Mode::Stable => slot.start_ts,
        Mode::EnglishAuction | Mode::SealedBid => slot.auction_end_ts.unwrap_or(slot.start_ts),
    }
}

// ===================== Close/Cancel slot by creator/admin (P2) =====================
// SPL path
pub fn close_slot(ctx: Context<CloseSlot>) -> Result<()> {
    let slot = &mut ctx.accounts.slot;
    // Permission: platform admin or creator authority
    let is_admin = ctx.accounts.platform.admin == ctx.accounts.authority.key();
    let is_creator = slot.creator_authority == ctx.accounts.authority.key();
    require!(is_admin || is_creator, ErrorCode::Unauthorized);
    // Allowed states: Open (no buyer), Reserved/Locked (refund buyer), Completed/Settled should be handled by normal settle; forbid when frozen
    require!(!slot.frozen, ErrorCode::Frozen);

    // If reserved/locked, refund buyer full remaining escrow and mark Refunded; otherwise just Close
    let escrow = &mut ctx.accounts.escrow;
    let has_buyer = escrow.buyer.is_some();
    if has_buyer && escrow.amount_locked > 0 {
        let buyer_key = escrow.buyer.unwrap();
        require!(ctx.accounts.buyer_token.owner == buyer_key, ErrorCode::UnauthorizedBuyer);
        // Refund entire remaining amount to provided buyer token
        let decimals = ctx.accounts.mint.decimals;
        let slot_key = slot.key();
        let escrow_bump = escrow.bump;
        let token_program = ctx.accounts.token_program.to_account_info();
        let escrow_vault = ctx.accounts.escrow_vault.to_account_info();
        // Optimistically accept buyer_token provided by caller; in production, constrain owner/mint via accounts for safety
        let buyer_token = ctx.accounts.buyer_token.to_account_info();
        let escrow_info = ctx.accounts.escrow.to_account_info();
        let bump_seed = [escrow_bump];
        let seeds: &[&[u8]] = &[b"escrow", slot_key.as_ref(), &bump_seed];
        let signer: &[&[&[u8]]] = &[seeds];
        let amt = escrow.amount_locked;
        transfer_checked(
            CpiContext::new_with_signer(
                token_program,
                TransferChecked {
                    from: escrow_vault,
                    mint: ctx.accounts.mint.to_account_info(),
                    to: buyer_token,
                    authority: escrow_info,
                },
                signer,
            ),
            amt,
            decimals,
        )?;
        escrow.amount_locked = 0;
        escrow.buyer = None;
        slot.state = SlotState::Refunded;
    } else {
        // No funds/buyer — close directly
        slot.state = SlotState::Closed;
    }
    Ok(())
}

// SOL path
pub fn close_slot_sol(ctx: Context<CloseSlotSol>) -> Result<()> {
    let slot = &mut ctx.accounts.slot;
    let is_admin = ctx.accounts.platform.admin == ctx.accounts.authority.key();
    let is_creator = slot.creator_authority == ctx.accounts.authority.key();
    require!(is_admin || is_creator, ErrorCode::Unauthorized);
    require!(!slot.frozen, ErrorCode::Frozen);

    let escrow_locked = ctx.accounts.escrow.amount_locked;
    if ctx.accounts.escrow.buyer.is_some() && escrow_locked > 0 {
        // Return remaining lamports to buyer system account
        let escrow_info = ctx.accounts.escrow.to_account_info();
        let buyer_info = ctx.accounts.buyer.to_account_info();
        let mut from = escrow_info.try_borrow_mut_lamports()?;
        let mut to = buyer_info.try_borrow_mut_lamports()?;
        let new_from = (*from).checked_sub(escrow_locked).ok_or(ErrorCode::Overflow)?;
        let new_to = (*to).checked_add(escrow_locked).ok_or(ErrorCode::Overflow)?;
        **from = new_from;
        **to = new_to;
        let escrow = &mut ctx.accounts.escrow;
        escrow.amount_locked = 0;
        escrow.buyer = None;
        slot.state = SlotState::Refunded;
    } else {
        slot.state = SlotState::Closed;
    }
    Ok(())
}

