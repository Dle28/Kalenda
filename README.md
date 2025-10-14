# TimeMarket — NFT Time Slots on Solana

TimeMarket turns calendar slots into transferable NFT tickets on Solana. Two sale modes are supported:

- StableNFT: fixed price, first-come-first-serve.
- BiddingNFT: English auction (auto‑bid ready), sealed‑bid (commit‑reveal skeleton).

Funds flow transparently through an escrow PDA. Payouts split into T0/T1 phases with platform fees applied pro‑rata.

This repo includes an Anchor program (`timemarket`) and a monorepo scaffold for apps/packages.

Status: MVP program scaffolded with Stable flow, English auction, dispute, and sealed‑bid commit/reveal skeleton.

## Quick Start

- Prereqs: Rust, Solana CLI, Anchor CLI, Node 18+, pnpm
- Install deps: `pnpm i`
- Local validator: `pnpm dev:chain` (or `anchor localnet`)
- Build: `anchor build`
- Deploy: `anchor deploy`

Program IDs:

- Set a real program ID for `timemarket`:
  - Generate: `solana-keygen new -o target/deploy/timemarket-keypair.json`
  - Update `programs/timemarket/src/lib.rs` `declare_id!("...")`
  - Update `Anchor.toml` under `[programs.localnet] timemarket = "..."`

## Repo Structure

- `programs/timemarket` — Anchor program
- `programs/my_program` — example counter (kept for scaffold/testing)
- `apps/*`, `packages/*` — frontends, SDKs (scaffold)

## Token Support

- USDC recommended; supports both SPL Token and Token‑2022 via `anchor_spl::token_interface`.
- Escrow vaults are ATAs owned by PDAs (no direct withdraw by users).

## PDAs

- `Platform` — seeds: `[b"platform"]`
- `CreatorProfile` — seeds: `[b"creator", authority, platform]`
- `TimeSlot` — seeds: `[b"slot", creator_profile, start_ts_le]`
- `Escrow` — seeds: `[b"escrow", slot]`
- `BidBook` — seeds: `[b"bidbook", slot]`
- `CommitStore` — seeds: `[b"commit", slot]`

## Core Accounts (selected fields)

- Platform: `admin`, `platform_fee_bps`, `mint`, `dispute_vault(ATA)`, `bump`
- CreatorProfile: `authority`, `payout_wallet`, `fee_bps_override?`, `platform`, `bump`
- TimeSlot: creator, window (`start_ts`/`end_ts`), `mode`, `state`, `capacity`, `nft_mint`, `price`, auction params, `frozen`, `buyer_checked_in`
- Escrow: `slot`, `token_acc`, `amount_locked`, `buyer?`, `bump`
- BidBook: `highest_bid`, `highest_bidder`, `pending_refund_*` for outbid refunds
- CommitStore: vector of `{ bidder, commitment_hash, revealed, bid_amount? }`

## Instruction Set

Platform & Creator

- `init_platform(admin, fee_bps, token_mint)` → creates Platform PDA and its `dispute_vault` ATA.
- `create_creator_profile(payout_wallet)` → one per `{authority, platform}`.

Slot Lifecycle

- `create_slot(params)` → Stable or Auction slot (optionally set `nft_mint`).
- `init_escrow(slot)` → creates Escrow PDA + vault ATA for the slot.

StableNFT

- `stable_reserve(slot, amount)` → buyer transfers USDC to escrow; state: Open → Reserved.
- `stable_cancel(slot)` → before T0, refund 100% (minus gas); state: Reserved → Open.
- `stable_checkin(slot)` → buyer or creator marks attended; state: Reserved/Locked → Completed.
- `stable_settle(slot)` →
  - T0 (≥ start_ts, Reserved): pay 50% minus pro‑rata platform fee; state → Locked.
  - T1 (Completed): pay 50%×98% minus pro‑rata platform fee; retain 2% remainder to platform; state → Settled.

English Auction

- `init_bid_book(slot)` → create BidBook.
- `auction_start(slot)` → creator opens auction at/after `auction_start_ts`; state: Open → AuctionLive.
- `bid_place(slot, bid_amount, max_auto_bid?)` → enforces `min_increment_bps`, transfers full bid to escrow, marks pending refund for previous highest; anti‑sniping auto‑extends.
- `bid_outbid_refund(slot)` → previous highest claims refund from escrow.
- `auction_end(slot)` → after `auction_end_ts` and no pending refunds: bind winner; pay T0 = 40% minus pro‑rata platform fee; state → Locked.
- `auction_checkin(slot)` → winner or creator marks attended; state → Completed.
- `auction_settle(slot)` → T1 on 60%: pays 60%×98% minus pro‑rata platform fee; retain 2%; state → Settled.

Sealed‑Bid (skeleton)

- `init_commit_store(slot, max_entries)`
- `bid_commit(slot, commitment_hash)` where `hash = sha256(bid_amount || salt || bidder_pubkey)`.
- `bid_reveal(slot, bid_amount, salt)` → verifies hash, records revealed bid.
- Winner selection, escrow funding and settlement for sealed‑bid to be added next.

Dispute

- `raise_dispute(slot, reason_code)` → buyer/creator freezes slot (`frozen=true`) to block settlement.
- `resolve_dispute(slot, payout_split_bps)` → admin splits remaining escrow between creator/buyer; unfreezes and closes.

## Payout Math (MVP)

- Platform fee `= amount * platform_fee_bps / 10000`, applied pro‑rata at T0 and T1.
- Stable: T0=50%, T1=50%×98% (2% retained to platform).
- Auction: T0=40%, T1=60%×98% (2% retained to platform).

Constants (compile‑time for MVP):

- `STABLE_T0_BPS=5000`, `AUCTION_T0_BPS=4000`, `FINAL_RELEASE_BPS=9800` in `programs/timemarket/src/lib.rs`.

## Events (for indexers)

- `SlotOpened`(implicit via create), `ReservedEvent`, `RefundedEvent`, `CheckinEvent`
- `SettledT0Event`, `SettledT1Event`
- `AuctionStartedEvent`, `BidPlacedEvent`, `OutbidRefundedEvent`, `AuctionExtendedEvent`, `AuctionEndedEvent`
- `CommitPlacedEvent`, `RevealAcceptedEvent`
- `DisputeRaisedEvent`, `DisputeResolvedEvent`

## Example Flows

Stable (devnet/localnet, pseudo‑client):

1) `init_platform` with USDC mint
2) `create_creator_profile`
3) `create_slot` (mode=Stable, price)
4) `init_escrow`
5) Buyer `stable_reserve(slot, price)`
6) After `start_ts` → `stable_settle` (T0)
7) `stable_checkin` → `stable_settle` (T1)

English Auction:

1) Steps 1–3 as above (mode=EnglishAuction, set start/end/min_increment)
2) `init_escrow` + `init_bid_book`
3) `auction_start`
4) Bidders call `bid_place`; outbid users call `bid_outbid_refund`
5) After end: `auction_end` (T0)
6) `auction_checkin` → `auction_settle` (T1)

## Build, Test, Deploy

- Localnet: `pnpm dev:chain`
- Build program: `anchor build`
- Deploy program: `anchor deploy`
- Program mapping: edit `Anchor.toml` under `[programs.localnet]` or `[programs.devnet]`.

## Security Notes

- All vaults are ATAs owned by PDAs; only program‑signed CPIs can move funds.
- Validates mode/state transitions, timestamps, min increments, and disallows re‑init.
- Dispute sets `frozen=true` to block settlement until resolution.

## Roadmap (near‑term)

- Mint/attach NFT tickets (Metaplex) on reserve/win; optional compressed NFTs.
- Sealed‑bid winner selection + settlement; auto‑bid execution loop.
- Circuit‑breaker for payouts; admin multisig; configurable T0/T1 bps.
- Minimal TS client for localnet e2e testing and event indexing.
