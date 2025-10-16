use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::*;

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

fn t0_ts(slot: &TimeSlot) -> i64 {
    match slot.mode {
        Mode::Stable => slot.start_ts,
        Mode::EnglishAuction | Mode::SealedBid => slot.auction_end_ts.unwrap_or(slot.start_ts),
    }
}

