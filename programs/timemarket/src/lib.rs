use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{transfer_checked, mint_to, Mint, TokenAccount, TokenInterface, TransferChecked, MintTo};

// Group logic into focused modules for readability
mod market;
mod escrow;
mod tipping;

declare_id!("Gz7jdgqsn3R8mBrthEx5thAFYdM369kHN7wMTY3PKhty");

pub const BPS_DENOM: u64 = 10_000;
pub const STABLE_T0_BPS: u64 = 5_000; // 50%
pub const AUCTION_T0_BPS: u64 = 4_000; // 40%
pub const FINAL_RELEASE_BPS: u64 = 9_800; // 98%

// Data

#[account]
pub struct Platform {
    pub admin: Pubkey,
    pub platform_fee_bps: u16,
    pub mint: Pubkey,
    pub fee_vault: Pubkey,
    pub dispute_vault: Pubkey,
    pub bump: u8,
}

impl Platform {
    pub const LEN: usize = 32 + 2 + 32 + 32 + 32 + 1;
}

#[account]
pub struct CreatorProfile {
    pub authority: Pubkey,
    pub payout_wallet: Pubkey,
    pub fee_bps_override: Option<u16>,
    pub platform: Pubkey,
    pub total_tips_received: u64,
    pub tip_count: u32,
    pub bump: u8,
}

impl CreatorProfile {
    pub const LEN: usize = 32 + 32 + 1 + 2 + 32 + 8 + 4 + 1; // Option<u16> ~ 1 tag + 2 value
}

// Fee policy helper: use creator override when present, otherwise platform default
pub fn effective_fee_bps(platform: &Platform, profile: &CreatorProfile) -> u16 {
    profile.fee_bps_override.unwrap_or(platform.platform_fee_bps)
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
    // Multi-capacity (MVP): total units and units sold across repeated runs
    pub capacity_total: u16,
    pub capacity_sold: u16,
    pub nft_mint: Pubkey,
    pub price: u64,
    pub min_increment_bps: u16,
    pub buy_now: Option<u64>,
    pub auction_start_ts: Option<i64>,
    pub auction_end_ts: Option<i64>,
    pub anti_sniping_sec: Option<u32>,
    pub total_tips_received: u64,
    pub bump: u8,
}

impl TimeSlot {
    pub const LEN: usize = 32 + 32 + 32 + 32 + 8 + 8 + 2 + 32 + 32 + 1 + 1 + 1 + 2 + 2 + 32 + 8 + 2 + (1 + 8) + (1 + 8) + (1 + 8) + (1 + 4) + 8 + 1;
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
    pub bump: u8,
}

impl BidBook {
    pub const LEN: usize = 32 + 8 + 32 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CommitEntry {
    pub bidder: Pubkey,
    pub commitment_hash: [u8; 32],
    pub revealed: bool,
    pub bid_amount: Option<u64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RefundEntry {
    pub bidder: Pubkey,
    pub amount: u64,
}

impl RefundEntry {
    pub const LEN: usize = 32 + 8;
}

#[account]
pub struct RefundQueue {
    pub slot: Pubkey,
    pub max_entries: u16,
    pub count: u16,
    pub cursor: u16,
    pub bump: u8,
    pub entries: Vec<RefundEntry>,
}

impl RefundQueue {
    pub fn space_for(max_entries: u16) -> usize {
        let base = 8 + 32 + 2 + 2 + 2 + 1 + 4;
        base + (RefundEntry::LEN * max_entries as usize)
    }
}

impl CommitEntry {
    pub const LEN: usize = 32 + 32 + 1 + (1 + 8);
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AutoBidEntry {
    pub bidder: Pubkey,
    pub max_bid: u64,
}

impl AutoBidEntry {
    pub const LEN: usize = 32 + 8;
}

#[account]
pub struct AutoBidStore {
    pub slot: Pubkey,
    pub max_entries: u16,
    pub count: u16,
    pub bump: u8,
    pub entries: Vec<AutoBidEntry>,
}

impl AutoBidStore {
    pub fn space_for(max_entries: u16) -> usize {
        let base = 8 + 32 + 2 + 2 + 1 + 4; // disc + fields + vec prefix
        base + (AutoBidEntry::LEN * max_entries as usize)
    }
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

// ========== Account Contexts reintroduced ==========

#[derive(Accounts)]
pub struct InitPlatform<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    /// Platform PDA account
    #[account(
        init,
        payer = admin,
        space = 8 + Platform::LEN,
        seeds = [b"platform", admin.key().as_ref()],
        bump
    )]
    pub platform: Account<'info, Platform>,
    /// CHECK: PDA used as authority for fee_vault ATA
    #[account(seeds = [b"fee", platform.key().as_ref()], bump)]
    pub fee_authority: UncheckedAccount<'info>,
    /// The SPL mint used for this platform
    pub mint: InterfaceAccount<'info, Mint>,
    /// Fee vault token account owned by platform (key stored on Platform)
    #[account(mut)]
    pub fee_vault: InterfaceAccount<'info, TokenAccount>,
    /// Dispute vault token account owned by platform (key stored on Platform)
    #[account(mut)]
    pub dispute_vault: InterfaceAccount<'info, TokenAccount>,
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

#[derive(Accounts)]
pub struct InitCreatorProfile<'info> {
    pub authority: Signer<'info>,
    pub platform: Account<'info, Platform>,
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
    #[account(mut, has_one = authority)]
    pub profile: Account<'info, CreatorProfile>,
}

#[derive(Accounts)]
#[instruction(params: CreateSlotParams)]
pub struct CreateTimeSlot<'info> {
    pub authority: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        seeds = [b"creator", authority.key().as_ref(), platform.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, CreatorProfile>,
    #[account(
        init,
        payer = authority,
        space = 8 + TimeSlot::LEN,
        // deterministic seed: profile + start_ts
        seeds = [b"slot", profile.key().as_ref(), &params.start_ts.to_le_bytes()],
        bump
    )]
    pub slot: Account<'info, TimeSlot>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitBidBook<'info> {
    pub authority: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
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
    pub authority: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
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
pub struct InitEscrow<'info> {
    pub admin: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(
        init,
        payer = admin,
        space = 8 + Escrow::LEN,
        seeds = [b"escrow", slot.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_vault: InterfaceAccount<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(max_entries: u16)]
pub struct InitRefundQueue<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(
        init,
        payer = authority,
        space = RefundQueue::space_for(max_entries),
        seeds = [b"refund", slot.key().as_ref()],
        bump
    )]
    pub refund_queue: Account<'info, RefundQueue>,
    pub system_program: Program<'info, System>,
}

// moved above for macro compatibility

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
    #[msg("Slot capacity exhausted")] 
    CapacityExhausted,
    #[msg("Multi-capacity unsupported for auctions")] 
    MultiCapacityUnsupported,
    #[msg("Invalid amount")]
    InvalidAmount,
}

// ===================== CPI helpers =====================

pub fn mul_bps_u64(amount: u64, bps: u64) -> Result<u64> {
    let v = (amount as u128)
        .checked_mul(bps as u128)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(BPS_DENOM as u128)
        .ok_or(ErrorCode::Overflow)?;
    Ok(v as u64)
}

pub fn t0_ts(slot: &TimeSlot) -> i64 {
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
    // Optional NFT minting if slot.nft_mint != default
    #[account(mut)]
    pub nft_mint: InterfaceAccount<'info, Mint>,
    /// Buyer will receive the NFT upon check-in
    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = nft_mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program
    )]
    pub buyer_nft_ata: InterfaceAccount<'info, TokenAccount>,
    /// PDA authority to mint NFTs for this slot
    /// CHECK: PDA derived, used only as signing authority
    #[account(seeds = [b"nft_auth", slot.key().as_ref()], bump)]
    pub nft_auth: UncheckedAccount<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
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
    /// Fee vault (platform fees)
    #[account(mut, address = platform.fee_vault)]
    pub fee_vault: InterfaceAccount<'info, TokenAccount>,
    /// Dispute vault (retained policy holds)
    #[account(mut, address = platform.dispute_vault)]
    pub dispute_vault: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

// ===================== Stable SOL Accounts (MVP) =====================

#[derive(Accounts)]
pub struct StableReserveSol<'info> {
    pub buyer: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(
        mut,
        seeds = [b"escrow", slot.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StableCancelSol<'info> {
    pub buyer: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(
        mut,
        seeds = [b"escrow", slot.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StableSettleSol<'info> {
    /// anyone can trigger based on time/state
    pub authority: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(
        mut,
        seeds = [b"escrow", slot.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        seeds = [b"creator", slot.creator_authority.as_ref(), platform.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, CreatorProfile>,
    #[account(mut, address = profile.payout_wallet)]
    pub creator_payout: SystemAccount<'info>,
    /// SOL fee receiver (platform)
    #[account(mut)]
    pub fee_receiver: SystemAccount<'info>,
    /// SOL retained/withhold receiver (dispute)
    #[account(mut)]
    pub dispute_receiver: SystemAccount<'info>,
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
#[instruction(max_entries: u16)]
pub struct InitAutoBidStore<'info> {
    pub authority: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(
        init,
        payer = authority,
        space = AutoBidStore::space_for(max_entries),
        seeds = [b"autobid", slot.key().as_ref()],
        bump
    )]
    pub auto_bid_store: Account<'info, AutoBidStore>,
    pub system_program: Program<'info, System>,
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
    #[account(mut, seeds = [b"refund", slot.key().as_ref()], bump = refund_queue.bump)]
    pub refund_queue: Account<'info, RefundQueue>,
    #[account(mut, seeds = [b"autobid", slot.key().as_ref()], bump = auto_bid_store.bump)]
    pub auto_bid_store: Account<'info, AutoBidStore>,
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
    #[account(mut, seeds = [b"refund", slot.key().as_ref()], bump = refund_queue.bump)]
    pub refund_queue: Account<'info, RefundQueue>,
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
    /// Fee vault (platform fees)
    #[account(mut, address = platform.fee_vault)]
    pub fee_vault: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    // NFT minting
    #[account(mut)]
    pub nft_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = nft_mint,
        associated_token::authority = escrow, // winner receives later transfer if desired (MVP to creator? choose buyer at settle?)
        associated_token::token_program = token_program
    )]
    pub winner_nft_ata: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: PDA authority to mint NFTs for this slot
    #[account(seeds = [b"nft_auth", slot.key().as_ref()], bump)]
    pub nft_auth: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct BuyNow<'info> {
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
    #[account(
        mut,
        seeds = [b"creator", slot.creator_authority.as_ref(), platform.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, CreatorProfile>,
    #[account(address = profile.payout_wallet)]
    /// CHECK: constrained by key match
    pub profile_payout_wallet: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = bidder,
        associated_token::mint = mint,
        associated_token::authority = profile_payout_wallet,
        associated_token::token_program = token_program
    )]
    pub creator_payout_ata: InterfaceAccount<'info, TokenAccount>,
    /// Fee vault (platform fees)
    #[account(mut, address = platform.fee_vault)]
    pub fee_vault: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    // NFT minting
    #[account(mut)]
    pub nft_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init_if_needed,
        payer = bidder,
        associated_token::mint = nft_mint,
        associated_token::authority = bidder,
        associated_token::token_program = token_program
    )]
    pub buyer_nft_ata: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: PDA authority to mint NFTs for this slot
    #[account(seeds = [b"nft_auth", slot.key().as_ref()], bump)]
    pub nft_auth: UncheckedAccount<'info>,
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
pub struct AuctionUpdateEnd<'info> {
    pub creator: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut, has_one = creator_authority @ ErrorCode::Unauthorized)]
    pub slot: Account<'info, TimeSlot>,
}

// Sealed-bid: end
#[derive(Accounts)]
pub struct SealedAuctionEnd<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(mut, seeds = [b"escrow", slot.key().as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, seeds = [b"commit", slot.key().as_ref()], bump = commit_store.bump)]
    pub commit_store: Account<'info, CommitStore>,
    #[account(
        mut,
        seeds = [b"creator", slot.creator_authority.as_ref(), platform.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, CreatorProfile>,
    #[account(address = profile.payout_wallet)]
    /// CHECK: constrained by address
    pub profile_payout_wallet: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = profile_payout_wallet,
        associated_token::token_program = token_program
    )]
    pub creator_payout_ata: InterfaceAccount<'info, TokenAccount>,
    /// Fee vault (platform fees)
    #[account(mut, address = platform.fee_vault)]
    pub fee_vault: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    // NFT minting
    #[account(mut)]
    pub nft_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = nft_mint,
        associated_token::authority = escrow,
        associated_token::token_program = token_program
    )]
    pub winner_nft_ata: InterfaceAccount<'info, TokenAccount>,
    /// CHECK
    #[account(seeds = [b"nft_auth", slot.key().as_ref()], bump)]
    pub nft_auth: UncheckedAccount<'info>,
}

// Sealed-bid: settle (T1)
#[derive(Accounts)]
pub struct SealedAuctionSettle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
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
    /// CHECK: constrained by address
    pub profile_payout_wallet: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = profile_payout_wallet,
        associated_token::token_program = token_program
    )]
    pub creator_payout_ata: InterfaceAccount<'info, TokenAccount>,
    /// Fee vault (platform fees)
    #[account(mut, address = platform.fee_vault)]
    pub fee_vault: InterfaceAccount<'info, TokenAccount>,
    /// Dispute vault (retained policy holds)
    #[account(mut, address = platform.dispute_vault)]
    pub dispute_vault: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
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
    /// Fee vault (platform fees)
    #[account(mut, address = platform.fee_vault)]
    pub fee_vault: InterfaceAccount<'info, TokenAccount>,
    /// Dispute vault (retained policy holds)
    #[account(mut, address = platform.dispute_vault)]
    pub dispute_vault: InterfaceAccount<'info, TokenAccount>,
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

// ===================== Close/Cancel Slot Accounts (P2) =====================
#[derive(Accounts)]
pub struct CloseSlot<'info> {
    #[account(mut)]
    pub authority: Signer<'info>, // creator authority or platform admin
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(mut, seeds = [b"escrow", slot.key().as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_vault: InterfaceAccount<'info, TokenAccount>,
    /// Buyer token account to receive refund if any
    #[account(mut, constraint = buyer_token.mint == mint.key())]
    pub buyer_token: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct CloseSlotSol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>, // creator authority or platform admin
    pub platform: Account<'info, Platform>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(mut, seeds = [b"escrow", slot.key().as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    /// Buyer system account to receive lamports refund (if any)
    #[account(mut)]
    pub buyer: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

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

    pub fn create_time_slot(ctx: Context<CreateTimeSlot>, params: CreateSlotParams) -> Result<()> {
        market::create_time_slot(ctx, params)
    }

    pub fn init_bid_book(ctx: Context<InitBidBook>) -> Result<()> {
        market::init_bid_book(ctx)
    }

    pub fn init_refund_queue(ctx: Context<InitRefundQueue>, max_entries: u16) -> Result<()> {
        market::init_refund_queue(ctx, max_entries)
    }

    pub fn init_commit_store(ctx: Context<InitCommitStore>, max_entries: u16) -> Result<()> {
        market::init_commit_store(ctx, max_entries)
    }

    pub fn init_auto_bid_store(ctx: Context<InitAutoBidStore>, max_entries: u16) -> Result<()> {
        market::init_auto_bid_store(ctx, max_entries)
    }

    pub fn bid_commit(ctx: Context<BidCommit>, commitment_hash: [u8; 32]) -> Result<()> {
        market::bid_commit(ctx, commitment_hash)
    }

    pub fn bid_reveal(ctx: Context<BidReveal>, bid_amount: u64, salt: [u8; 32]) -> Result<()> {
        market::bid_reveal(ctx, bid_amount, salt)
    }

    pub fn auction_start(ctx: Context<AuctionStart>) -> Result<()> {
        market::auction_start(ctx)
    }

    pub fn buy_now(ctx: Context<BuyNow>) -> Result<()> {
        market::buy_now(ctx)
    }

    pub fn auction_update_end(ctx: Context<AuctionUpdateEnd>, new_end_ts: i64) -> Result<()> {
        market::auction_update_end(ctx, new_end_ts)
    }

    pub fn bid_place(ctx: Context<BidPlace>, bid_amount: u64, max_auto_bid: Option<u64>) -> Result<()> {
        market::bid_place(ctx, bid_amount, max_auto_bid)
    }

    pub fn bid_outbid_refund(ctx: Context<BidOutbidRefund>) -> Result<()> {
        market::bid_outbid_refund(ctx)
    }

    pub fn auction_end(ctx: Context<AuctionEnd>) -> Result<()> {
        market::auction_end(ctx)
    }

    pub fn auction_checkin(ctx: Context<AuctionCheckin>) -> Result<()> {
        market::auction_checkin(ctx)
    }

    pub fn sealed_auction_end(ctx: Context<SealedAuctionEnd>) -> Result<()> {
        market::sealed_auction_end(ctx)
    }

    pub fn sealed_auction_settle(ctx: Context<SealedAuctionSettle>) -> Result<()> {
        market::sealed_auction_settle(ctx)
    }

    pub fn auction_settle(ctx: Context<AuctionSettle>) -> Result<()> {
        market::auction_settle(ctx)
    }

    pub fn raise_dispute(ctx: Context<RaiseDispute>, reason_code: u16) -> Result<()> {
        market::raise_dispute(ctx, reason_code)
    }

    pub fn resolve_dispute(ctx: Context<ResolveDispute>, payout_split_bps_to_creator: u16) -> Result<()> {
        market::resolve_dispute(ctx, payout_split_bps_to_creator)
    }

    // Escrow + Stable flows (SPL)
    pub fn init_escrow(ctx: Context<InitEscrow>) -> Result<()> {
        escrow::init_escrow(ctx)
    }

    pub fn stable_reserve(ctx: Context<StableReserve>, amount: u64) -> Result<()> {
        escrow::stable_reserve(ctx, amount)
    }

    pub fn stable_cancel(ctx: Context<StableCancel>) -> Result<()> {
        escrow::stable_cancel(ctx)
    }

    pub fn stable_checkin(ctx: Context<StableCheckin>) -> Result<()> {
        escrow::stable_checkin(ctx)
    }

    pub fn stable_settle(ctx: Context<StableSettle>) -> Result<()> {
        escrow::stable_settle(ctx)
    }

    // Stable SOL variants (MVP)
    pub fn stable_reserve_sol(ctx: Context<StableReserveSol>) -> Result<()> {
        escrow::stable_reserve_sol(ctx)
    }

    pub fn stable_cancel_sol(ctx: Context<StableCancelSol>) -> Result<()> {
        escrow::stable_cancel_sol(ctx)
    }

    pub fn stable_settle_sol(ctx: Context<StableSettleSol>) -> Result<()> {
        escrow::stable_settle_sol(ctx)
    }

    // Close/Cancel slot by creator/admin (P2)
    pub fn close_slot(ctx: Context<CloseSlot>) -> Result<()> {
        escrow::close_slot(ctx)
    }

    pub fn close_slot_sol(ctx: Context<CloseSlotSol>) -> Result<()> {
        escrow::close_slot_sol(ctx)
    }

    // Tipping system
    pub fn tip_creator_spl(ctx: Context<TipCreatorSpl>, amount: u64, message_hash: Option<[u8; 32]>) -> Result<()> {
        tipping::tip_creator_spl(ctx, amount, message_hash)
    }

    pub fn tip_creator_sol(ctx: Context<TipCreatorSol>, amount: u64, message_hash: Option<[u8; 32]>) -> Result<()> {
        tipping::tip_creator_sol(ctx, amount, message_hash)
    }

    pub fn tip_for_session_spl(ctx: Context<TipForSessionSpl>, amount: u64, message_hash: Option<[u8; 32]>) -> Result<()> {
        tipping::tip_for_session_spl(ctx, amount, message_hash)
    }
}

// ===================== Tipping Context Accounts =====================

#[derive(Accounts)]
pub struct TipCreatorSpl<'info> {
    #[account(mut)]
    pub tipper: Signer<'info>,
    #[account(
        mut,
        seeds = [b"creator", creator_profile.authority.as_ref(), platform.key().as_ref()],
        bump = creator_profile.bump
    )]
    pub creator_profile: Account<'info, CreatorProfile>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub tipper_token: InterfaceAccount<'info, TokenAccount>,
    #[account(address = creator_profile.payout_wallet)]
    /// CHECK: Address is constrained to `creator_profile.payout_wallet` above.
    pub profile_payout_wallet: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = tipper,
        associated_token::mint = mint,
        associated_token::authority = profile_payout_wallet,
        associated_token::token_program = token_program
    )]
    pub creator_payout_ata: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TipCreatorSol<'info> {
    #[account(mut)]
    pub tipper: Signer<'info>,
    #[account(
        mut,
        seeds = [b"creator", creator_profile.authority.as_ref(), platform.key().as_ref()],
        bump = creator_profile.bump
    )]
    pub creator_profile: Account<'info, CreatorProfile>,
    pub platform: Account<'info, Platform>,
    #[account(mut, address = creator_profile.payout_wallet)]
    /// CHECK: Address is constrained to `creator_profile.payout_wallet` above.
    pub creator_payout: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TipForSessionSpl<'info> {
    #[account(mut)]
    pub tipper: Signer<'info>,
    #[account(mut)]
    pub slot: Account<'info, TimeSlot>,
    #[account(
        mut,
        seeds = [b"creator", creator_profile.authority.as_ref(), platform.key().as_ref()],
        bump = creator_profile.bump,
        constraint = slot.creator_profile == creator_profile.key()
    )]
    pub creator_profile: Account<'info, CreatorProfile>,
    pub platform: Account<'info, Platform>,
    #[account(constraint = mint.key() == platform.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub tipper_token: InterfaceAccount<'info, TokenAccount>,
    #[account(address = creator_profile.payout_wallet)]
    /// CHECK: Address is constrained to `creator_profile.payout_wallet` above.
    pub profile_payout_wallet: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = tipper,
        associated_token::mint = mint,
        associated_token::authority = profile_payout_wallet,
        associated_token::token_program = token_program
    )]
    pub creator_payout_ata: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

// ===================== Tipping Events =====================

#[event]
pub struct TipEvent {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub message_hash: Option<[u8; 32]>,
    pub timestamp: i64,
}

#[event]
pub struct SessionTipEvent {
    pub slot: Pubkey,
    pub from: Pubkey,
    pub amount: u64,
}


