use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked};

// Group logic into focused modules for readability
mod market;
mod escrow;

declare_id!("Gz7jdgqsn3R8mBrthEx5thAFYdM369kHN7wMTY3PKhty");

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
        market::init_platform(ctx, platform_fee_bps)
    }

    pub fn init_creator_profile(
        ctx: Context<InitCreatorProfile>,
        payout_wallet: Pubkey,
        fee_bps_override: Option<u16>,
    ) -> Result<()> {
        market::init_creator_profile(ctx, payout_wallet, fee_bps_override)
    }

    pub fn update_creator_profile(
        ctx: Context<UpdateCreatorProfile>,
        new_payout_wallet: Option<Pubkey>,
        new_fee_bps_override: Option<Option<u16>>,
    ) -> Result<()> {
        market::update_creator_profile(ctx, new_payout_wallet, new_fee_bps_override)
    }

    pub fn create_time_slot(
        ctx: Context<CreateTimeSlot>,
        params: CreateSlotParams,
    ) -> Result<()> {
        market::create_time_slot(ctx, params)
    }

    pub fn init_escrow(ctx: Context<InitEscrow>) -> Result<()> { escrow::init_escrow(ctx) }

    pub fn init_bid_book(ctx: Context<InitBidBook>) -> Result<()> { market::init_bid_book(ctx) }

    pub fn init_commit_store(ctx: Context<InitCommitStore>, max_entries: u16) -> Result<()> { market::init_commit_store(ctx, max_entries) }

    pub fn bid_commit(ctx: Context<BidCommit>, commitment_hash: [u8; 32]) -> Result<()> { market::bid_commit(ctx, commitment_hash) }

    pub fn bid_reveal(ctx: Context<BidReveal>, bid_amount: u64, salt: [u8; 32]) -> Result<()> { market::bid_reveal(ctx, bid_amount, salt) }

    // ===================== English Auction (MVP) =====================
    pub fn auction_start(ctx: Context<AuctionStart>) -> Result<()> { market::auction_start(ctx) }

    pub fn bid_place(ctx: Context<BidPlace>, bid_amount: u64, _max_auto_bid: Option<u64>) -> Result<()> { market::bid_place(ctx, bid_amount, _max_auto_bid) }

    pub fn bid_outbid_refund(ctx: Context<BidOutbidRefund>) -> Result<()> { market::bid_outbid_refund(ctx) }

    pub fn auction_end(ctx: Context<AuctionEnd>) -> Result<()> { market::auction_end(ctx) }

    pub fn auction_checkin(ctx: Context<AuctionCheckin>) -> Result<()> { market::auction_checkin(ctx) }

    pub fn auction_settle(ctx: Context<AuctionSettle>) -> Result<()> { market::auction_settle(ctx) }

    // ===================== StableNFT flow =====================
    pub fn stable_reserve(ctx: Context<StableReserve>, amount: u64) -> Result<()> { escrow::stable_reserve(ctx, amount) }

    pub fn stable_cancel(ctx: Context<StableCancel>) -> Result<()> { escrow::stable_cancel(ctx) }

    pub fn stable_checkin(ctx: Context<StableCheckin>) -> Result<()> { escrow::stable_checkin(ctx) }

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
    pub fn raise_dispute(ctx: Context<RaiseDispute>, _reason_code: u16) -> Result<()> { market::raise_dispute(ctx, _reason_code) }

    pub fn resolve_dispute(ctx: Context<ResolveDispute>, payout_split_bps_to_creator: u16) -> Result<()> { market::resolve_dispute(ctx, payout_split_bps_to_creator) }
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


