use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::*;

/// Tip a creator with SPL tokens (direct payment, no escrow, no platform fee)
pub fn tip_creator_spl(ctx: Context<TipCreatorSpl>, amount: u64, message_hash: Option<[u8; 32]>) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);
    
    let profile = &mut ctx.accounts.creator_profile;
    let decimals = ctx.accounts.mint.decimals;
    
    // Direct transfer from tipper to creator's payout wallet
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.tipper_token.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.creator_payout_ata.to_account_info(),
        authority: ctx.accounts.tipper.to_account_info(),
    };
    
    transfer_checked(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
        amount,
        decimals,
    )?;
    
    // Update creator stats
    profile.total_tips_received = profile.total_tips_received.checked_add(amount).ok_or(ErrorCode::Overflow)?;
    profile.tip_count = profile.tip_count.checked_add(1).ok_or(ErrorCode::Overflow)?;
    
    emit!(TipEvent {
        from: ctx.accounts.tipper.key(),
        to: profile.authority,
        amount,
        message_hash,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}

/// Tip a creator with native SOL (direct payment)
pub fn tip_creator_sol(ctx: Context<TipCreatorSol>, amount: u64, message_hash: Option<[u8; 32]>) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);
    
    let profile = &mut ctx.accounts.creator_profile;
    
    // Transfer SOL from tipper to creator's payout wallet
    let ix = system_program::Transfer {
        from: ctx.accounts.tipper.to_account_info(),
        to: ctx.accounts.creator_payout.to_account_info(),
    };
    
    system_program::transfer(
        CpiContext::new(ctx.accounts.system_program.to_account_info(), ix),
        amount,
    )?;
    
    // Update creator stats
    profile.total_tips_received = profile.total_tips_received.checked_add(amount).ok_or(ErrorCode::Overflow)?;
    profile.tip_count = profile.tip_count.checked_add(1).ok_or(ErrorCode::Overflow)?;
    
    emit!(TipEvent {
        from: ctx.accounts.tipper.key(),
        to: profile.authority,
        amount,
        message_hash,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}

/// Tip for a specific session (optional slot reference)
pub fn tip_for_session_spl(ctx: Context<TipForSessionSpl>, amount: u64, message_hash: Option<[u8; 32]>) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);
    
    let profile = &mut ctx.accounts.creator_profile;
    let slot = &mut ctx.accounts.slot;
    let decimals = ctx.accounts.mint.decimals;
    
    // Verify slot belongs to this creator
    require_keys_eq!(slot.creator_profile, profile.key(), ErrorCode::Unauthorized);
    
    // Direct transfer from tipper to creator's payout wallet
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.tipper_token.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.creator_payout_ata.to_account_info(),
        authority: ctx.accounts.tipper.to_account_info(),
    };
    
    transfer_checked(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
        amount,
        decimals,
    )?;
    
    // Update creator stats
    profile.total_tips_received = profile.total_tips_received.checked_add(amount).ok_or(ErrorCode::Overflow)?;
    profile.tip_count = profile.tip_count.checked_add(1).ok_or(ErrorCode::Overflow)?;
    
    // Update slot stats
    slot.total_tips_received = slot.total_tips_received.checked_add(amount).ok_or(ErrorCode::Overflow)?;
    
    emit!(TipEvent {
        from: ctx.accounts.tipper.key(),
        to: profile.authority,
        amount,
        message_hash,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    emit!(SessionTipEvent {
        slot: slot.key(),
        from: ctx.accounts.tipper.key(),
        amount,
    });
    
    Ok(())
}
