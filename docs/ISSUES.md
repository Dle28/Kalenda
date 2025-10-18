# MICA-E.Dapp – Issues and Gaps

Last updated: 2025-10-18

Legend:
- P0 – Blocking/critical. Ship before public usage.
- P1 – Important. Next milestone.
- P2 – Nice to have/UX/polish.

This file tracks known issues, missing features, and refactors across the smart contract, client SDK, frontend, and tooling. Each item includes impact, files/areas involved, and acceptance criteria.

## 1) Smart Contract (Anchor program `timemarket`)

### P0 – Program ID inconsistencies
- Status: RESOLVED
- Impact: Clients/IDL mismatched with on-chain program; transactions will fail.
- Evidence (before): `declare_id!` in `programs/timemarket/src/lib.rs` differed from `Anchor.toml` and the built IDL address.
- Fix:
	- Unified Program ID to `Gz7jdgqsn3R8mBrthEx5thAFYdM369kHN7wMTY3PKhty` across:
		- `programs/timemarket/src/lib.rs` (declare_id!)
		- `Anchor.toml` ([programs.devnet] and provider cluster/wallet)
		- `target/idl/timemarket.json` and `target/types/timemarket.json` (address)
		- SDK: `packages/ts-sdk/src/index.ts` exports `PROGRAM_ID` and `idl/timemarket.json` wiring
	- Added TDD test: `tests/program-id-consistency.test.ts` to assert equality between Anchor.toml, Rust, IDL, and SDK.
- Acceptance: Single Program ID used consistently in source, config, and generated IDL. Tests: PASS.

### P0 – Sealed-bid auction lacks end/settle flow
- Status: RESOLVED
- Impact: Feature was incomplete; could not pick a winner or release funds for `Mode::SealedBid`.
- Evidence (before): Had `init_commit_store`, `bid_commit`, `bid_reveal`, but no end/settle instructions.
- Fix:
	- Implemented and exposed `sealed_auction_end` and `sealed_auction_settle` instruction handlers in `programs/timemarket/src/market.rs` and wired accounts in `lib.rs`.
	- `auction_checkin` now allows `Mode::SealedBid` in addition to `EnglishAuction`.
	- T0 payout: mirrors English auction base (40% to creator minus platform fee; fee routed to platform vault); escrow bound to the winner on end.
	- T1 payout: remaining escrow released at settle (MVP assumption: remainder equals T1 base; to be refined with fee-override work).
	- Added TDD tests asserting instruction exposure and check-in eligibility: `tests/sealed-bid-end-settle.test.ts`.
- Acceptance: Winner chosen from revealed bids after the reveal window; T0/T1 payouts mirror English auction; tests: PASS.

### P0 – CommitStore capacity check bug
- Status: RESOLVED
- Impact: Commit flow could break after account reload because `Vec` capacity is not serialized.
- Evidence (before): Code compared `store.count < store.entries.capacity()`.
- Fix:
	- Persisted `max_entries` in `CommitStore` (already present) and used it in checks.
	- Updated `bid_commit` check to `store.count < store.max_entries`.
	- Ensured `init_commit_store` sets `max_entries` and reserves vector capacity.
	- Added TDD: `tests/commit-store-capacity.test.ts` to assert persisted field and correct check.
- Files: `programs/timemarket/src/lib.rs` (struct already had `max_entries`), `programs/timemarket/src/market.rs` (updated require), tests.
- Acceptance: Capacity uses persisted `max_entries` field and tests PASS.

### P1 – Auto-bid not implemented
- Status: RESOLVED (MVP)
- Impact (before): `_max_auto_bid` ignored; users couldn’t set a max and have the program auto-counter in English auctions.
- Fix:
	- Added `AutoBidEntry` and `AutoBidStore` account with persisted `max_entries`, `count`, and `entries`.
	- New init instruction: `init_auto_bid_store(ctx, max_entries)` with PDA seeds `["autobid", slot]`.
	- Extended `BidPlace` accounts to include `auto_bid_store` and implemented registration/update when `_max_auto_bid` is provided.
	- Implemented a simple auto-bid loop in `bid_place`: after an explicit bid, iterate over auto-bidders to outbid up to their max using min-increment logic; updates `highest_bid`/`highest_bidder` and `pending_refund_*` accordingly.
	- Note: Synthetic auto-bids do not move tokens; escrow remains backed by explicit bidder deposits. Winner binding and payouts rely on highest_bid at end; clients should ensure sufficient funds by finalization time.
	- Added TDD: `tests/auto-bid.test.ts` to assert presence and core behavior via source parsing.
- Files: `programs/timemarket/src/lib.rs`, `programs/timemarket/src/market.rs`, `tests/auto-bid.test.ts`.
- Acceptance: Per-bidder max stored; automatic outbidding up to max with increment respected; tests PASS.

### P1 – “Buy now” logic unused
- Status: RESOLVED (MVP)
- Impact (before): Buyers could not exercise immediate purchase even with `buy_now` set.
- Fix:
	- Added `buy_now` instruction and `BuyNow` accounts. Allows a bidder to purchase instantly when `slot.mode == EnglishAuction` and slot is `Open` or `AuctionLive`.
	- On call, transfers `buy_now` price from bidder token to escrow vault, binds `escrow.buyer`, sets `bidbook.highest_bid`/`highest_bidder`, performs T0 payout (40% base, pro-rata fee), and sets slot state to `Locked`.
	- Added TDD: `tests/buy-now.test.ts` asserting instruction exposure, buyer binding, T0 payout presence, and `Locked` state.
- Files: `programs/timemarket/src/lib.rs`, `programs/timemarket/src/market.rs`, `tests/buy-now.test.ts`.
- Acceptance: Instant purchase path works and tests PASS.

### P1 – Creator ability to adjust auction close time
- Status: RESOLVED
- Impact (before): Creator could not adjust the bidding cutoff; anti-sniping extension existed but no manual control.
- Fix:
	- Added `auction_update_end(ctx, new_end_ts)` instruction.
	- Accounts: `AuctionUpdateEnd` with creator signer, platform, mint, slot.
	- Logic: EnglishAuction only. If `slot.state == Open`, the creator can set/update `auction_end_ts` to any future time (after `auction_start_ts` if set). If `AuctionLive`, only extension is allowed (new_end_ts must be greater than current end). Emits `AuctionExtendedEvent`.
	- TDD: `tests/auction-update-end.test.ts` asserts entrypoint, assignment, and event emission.
- Files: `programs/timemarket/src/lib.rs`, `programs/timemarket/src/market.rs`, tests.
- Acceptance: Creator can set/extend end time under constraints; tests PASS.

### P1 – `fee_bps_override` unused
- Status: RESOLVED
- Impact (before): Creator fee override wasn’t applied; platform default always used.
- Fix:
	- Added helper `effective_fee_bps(platform, profile)` to choose `profile.fee_bps_override` when present, otherwise platform default.
	- Updated Stable flow (T0/T1) and Auction flows (English T0/T1, Sealed-bid T0/T1, Buy-now T0) to use `effective_fee_bps`.
	- Added TDD: `tests/fee-override.test.ts` asserting helper presence and usage across paths.
- Files: `programs/timemarket/src/lib.rs`, `programs/timemarket/src/market.rs`, `programs/timemarket/src/escrow.rs`, tests.
- Acceptance: Creator override is honored wherever platform fee is applied; tests PASS.

### P1 – NFT minting not integrated
- Status: RESOLVED (MVP)
- Impact (before): No NFT minted to represent purchased/attended slots.
- Fix (MVP):
	- Added optional NFT minting via SPL token mint directly (token-2022/token interface), not full Metaplex metadata yet.
	- Stable flow: Mints 1 NFT to buyer at `stable_checkin` if `slot.nft_mint` is set.
	- English auction: Mints to winner at `auction_end` and `buy_now` (to configured recipient ATA as coded). Sealed-bid: mints at `sealed_auction_end`.
	- New PDA `nft_auth` (seed: `["nft_auth", slot]`) used as mint authority signer for `mint_to` CPI.
	- Account contexts extended for relevant instructions with `nft_mint`, recipient NFT ATA, `nft_auth`, and programs.
	- TDD: `tests/nft-minting.test.ts` asserts accounts and `mint_to` usage are present.
- Limitations / Next steps:
	- No Metaplex Token Metadata integration yet (URI, collection, creators). Recommend adding mpl-token-metadata CPI for full NFT semantics.
	- Recipient policy is simplified (e.g., auction end mints to an ATA tied to escrow or buyer depending on flow). Align with product decision and adjust.
	- Add burn/mark-used policy for cancellations or disputes as needed.
- Files: `programs/timemarket/src/lib.rs`, `programs/timemarket/src/escrow.rs`, `programs/timemarket/src/market.rs`, tests.
- Acceptance: NFT mint triggered at appropriate lifecycle points when configured; tests PASS.

### P1 – Multi-capacity slots unsupported
- Status: RESOLVED (MVP)
- Impact (before): `capacity` existed in params but code assumed single buyer/winner.
- Fix (MVP):
	- Added `capacity_total` and `capacity_sold` to `TimeSlot` with adjusted account size.
	- Mapped `CreateSlotParams.capacity` -> `slot.capacity_total`; initialized `capacity_sold=0`.
	- Stable flow: `stable_reserve` enforces `capacity_sold < capacity_total`; `stable_checkin` increments `capacity_sold` on success.
	- Auctions (English/Sealed) and `buy_now`: guarded with `capacity_total == 1` to explicitly disallow multi-winner auctions in MVP; added error `MultiCapacityUnsupported`.
	- New error codes: `CapacityExhausted`, `MultiCapacityUnsupported`.
	- TDD: `tests/multi-capacity.test.ts` asserts fields, guards, and stable flow changes.
- Limitations / Next steps:
	- True multi-winner auctions are not supported yet; requires redesign of bidbook/escrow per unit and settlement rules.
	- Consider decrementing `capacity_sold` on refund/cancellation if policy allows multiple reservations per slot window.
	- Frontend should surface remaining capacity and block stable_reserve when exhausted.
- Files: `programs/timemarket/src/lib.rs`, `programs/timemarket/src/market.rs`, `programs/timemarket/src/escrow.rs`, tests.
- Acceptance: Tests pass and capacity logic enforced at runtime.
- Files: `TimeSlot` state machine, escrow model, settlement logic.
- Acceptance: Support N reservations per slot (SFT or multiple NFTs), correct fund splits and check-in/settlement for multiple attendees.

### P1 – Refund queue for auctions (scalability)
- Status: RESOLVED (MVP)
- Impact (before): Only a single `pending_refund_amount`/`pending_refund_bidder` was tracked, forcing us to block new bids while a refund was pending, degrading UX and scalability.
- Fix (MVP):
	- Introduced `RefundQueue` account per slot with `entries: Vec<RefundEntry>` storing `{bidder, amount}`; maintained fields `max_entries`, `count`, `cursor` and `space_for()` helper.
	- Added `init_refund_queue` instruction to initialize the queue.
	- Wired `refund_queue` into `BidPlace`, `BidOutbidRefund`, and `AuctionEnd` account contexts.
	- `bid_place`: pushes previous-highest refund into queue instead of single pending fields; removed guard blocking bids.
	- `bid_outbid_refund`: processes the entry at `cursor`, transfers from escrow to prior bidder, then advances `cursor` and decrements `count`.
	- Removed `pending_refund_*` fields from `BidBook`.
	- TDD: `tests/refund-queue.test.ts` verifies types, accounts, and logic are present; other suites remain green.
- Limitations / Next steps:
	- Queue is append-only with simple cursor; no compaction. Consider periodic vacuuming or cycling when `cursor` reaches capacity.
	- No batching: one refund per call. A batched refund instruction could reduce tx overhead.
	- Ensure frontend/cron reliably calls `bid_outbid_refund` until the queue is drained.
- Files: `programs/timemarket/src/lib.rs`, `programs/timemarket/src/market.rs`, tests.
- Acceptance: Tests pass; auctions no longer block on single pending refund.
- Files: `market.rs` (bid bookkeeping); new data structure for multiple pending refunds.
- Acceptance: Multiple pending refunds tracked; new bids allowed; all outbid bidders can claim refunds independently; tests cover sequencing.

### P1 – Separate platform fee vault vs dispute vault
- Status: RESOLVED (MVP)
- Impact (before): Using `platform.dispute_vault` for both fees and retained amounts mixed concerns and complicated accounting.
- Fix:
	- Extended `Platform` with `fee_vault: Pubkey` and updated `LEN` accordingly.
	- `InitPlatform` now derives a `fee_authority` PDA (seed `["fee", platform]`) and creates a separate `fee_vault` ATA owned by this PDA.
	- Routed platform fees to `fee_vault` across Stable T0/T1, English `auction_end`/`auction_settle`, `buy_now`, and Sealed-bid `sealed_auction_end`/`sealed_auction_settle`.
	- Routed retained policy amounts (T1 withhold) to `dispute_vault` only.
	- Added TDD: `tests/fee-vault-separation.test.ts` asserting account contexts and transfer targets.
- Limitations / Next steps:
	- Migration path for existing deployments not covered here; requires a one-time admin flow to initialize `fee_vault` on-chain.
	- Consider making fee vault authority configurable or upgradable via governance.
- Acceptance: Fees go to dedicated `fee_vault`; retained amounts go to `dispute_vault`; tests PASS.

### P2 – Duplicate `stable_settle` logic
- Status: RESOLVED
- Impact (before): Maintenance risk; `stable_settle` logic lived in both `lib.rs` and `escrow.rs`.
- Fix: Removed duplicated inline implementation in `lib.rs` and delegated directly to `escrow::stable_settle(ctx)`. All settlement logic now resides in `escrow.rs`.
- Tests: Added `tests/duplicate-stable-settle.test.ts` to assert delegation and presence of settlement logic in `escrow.rs`.
- Acceptance: Single source of truth for stable settlement; tests PASS.

### P2 – Support for SOL payments (optional)
- Status: RESOLVED (MVP)
- Impact: Previously only SPL tokens supported (USDC recommended). Added native SOL path for Stable flow to broaden options.
- Fix:
	- Implemented native SOL Stable flow in `escrow.rs`: `stable_reserve_sol`, `stable_cancel_sol`, `stable_settle_sol` using lamport transfers and the same T0/T1, fee, and retained logic as SPL.
	- Added SOL Stable account contexts in `lib.rs` with `SystemAccount` payout recipients.
	- Added TDD: `tests/sol-stable-flow.test.ts` asserting entrypoints and lamports logic presence.
- Scope/Caveats:
	- SOL support is for Stable flow only (auctions still SPL in MVP).
	- No wSOL wrapping required; lamports are moved in/out of the escrow PDA account directly.
- Acceptance: Build passes with SOL path present; tests validate presence and structure of SOL flow logic.

### P2 – Close/cancel slot by creator/admin
- Status: RESOLVED (MVP)
- Impact (before): Không có instruction riêng để đóng slot (state → Closed) khi muốn hủy theo ý creator/admin ngoài luồng dispute.
- Fix (MVP):
	- Thêm hai instruction: `close_slot` (SPL) và `close_slot_sol` (SOL) trong `lib.rs`, triển khai logic trong `escrow.rs`.
	- Phân quyền: Chỉ creator authority của slot hoặc platform admin mới có quyền.
	- Ràng buộc trạng thái: Không được đóng khi `slot.frozen == true` (đang tranh chấp). Với trạng thái Reserved/Locked sẽ hoàn trả toàn bộ `escrow.amount_locked` cho buyer (SPL: transfer_checked về buyer_token; SOL: chuyển lamports về buyer) và đặt `slot.state = Refunded`. Trường hợp không có buyer hoặc không có tiền trong escrow, set `slot.state = Closed`.
	- TDD: `tests/close-slot.test.ts` kiểm tra sự hiện diện entrypoint, accounts, và logic chính (transfer + state).
- Scope/Caveats:
	- MVP thiên về khả năng hủy nhanh. Chính sách phí hay phạt hủy sớm có thể mở rộng thêm.
	- Với SPL, cần truyền đúng buyer token account tương ứng; bản nâng cấp có thể ràng buộc chặt chẽ hơn bằng constraint.
- Acceptance: Creator/admin có thể đóng/hủy slot phù hợp trạng thái; tiền được hoàn trả đúng nếu có; test PASS.

### Security sanity
- Current math uses `mul_bps_u64` with u128 intermediate; overflow checked.
- State transitions guarded; settlement is permissionless but time/state constrained (intended).
- Dispute admin is single-sig; consider multisig or role-based controls (P2).

## 2) Auction flow – safety fix (superseded by refund queue)

- Issue (historical): New bids could be placed while an outbid refund was still pending, risking overwrite of a single `pending_refund_amount` and locking funds.
- Interim change (applied previously): Added a guard in `bid_place` requiring `pending_refund_amount == 0` before accepting new bids.
- Drawback: This blocked rapid bidding until the previous bidder claimed the refund, degrading auction UX.
- Final fix (current, P1 – RESOLVED): Implemented a per-slot `RefundQueue` to enqueue all outbid refunds and process them independently via `bid_outbid_refund`. The old guard has been removed.
- References: See section “P1 – Refund queue for auctions (scalability)” above for design and TDD.
- Files touched: `programs/timemarket/src/market.rs` (bid_place, bid_outbid_refund, auction_end), `programs/timemarket/src/lib.rs` (accounts wiring).

## 3) Client SDK / IDL

### P0 – SDK IDL import incorrect
- Status: RESOLVED
- Impact: Web/clients could not load the program interface due to wrong import.
- Evidence (before): `packages/ts-sdk/src/idl/index.ts` (OK) but `packages/ts-sdk/idl/index.ts` imported `./my_program.json` which didn’t exist; missing `timemarket.json` in the package-level `idl/` folder.
- Fix:
	- Updated `packages/ts-sdk/idl/index.ts` to `import timemarketIdl from "./timemarket.json"; export { timemarketIdl }`.
	- Ensured IDL JSON exists in both `packages/ts-sdk/src/idl/timemarket.json` (placeholder synced at build) and `packages/ts-sdk/idl/timemarket.json` (package artifact).
	- Confirmed `PROGRAM_ID` is exported in `packages/ts-sdk/src/index.ts` and matches Anchor.toml/Rust/IDL.
- TDD: Added `tests/sdk-idl-import.test.ts` to assert paths, presence, and `PROGRAM_ID`.
- Acceptance: Correct IDL import/exports and `PROGRAM_ID` are present; tests PASS.

### P1 – IDL/Program ID sync + distribution
- Status: RESOLVED
- Impact: Clients need authoritative IDL and address with reliable package distribution.
- Fix:
	- Added `scripts/sync-idl.mjs` to sync `target/idl/timemarket.json` into `packages/ts-sdk/src/idl/` and `packages/ts-sdk/idl/` before build, and copy IDL into `packages/ts-sdk/dist/idl/` after build.
	- Wired `packages/ts-sdk/package.json` build script: `node ../../scripts/sync-idl.mjs copy-src && tsc -p . && node ../../scripts/sync-idl.mjs copy-dist`.
	- Package `exports` includes `./idl` and `./idl/*` and `files` publishes `dist` and `idl`.
- TDD: Added `tests/sdk-build-distribution.test.ts` to run filtered build for `@starter/ts-sdk` and assert:
	- `dist/src/index.js`, `dist/src/index.d.ts` exist
	- `dist/idl/index.js`, `dist/idl/index.d.ts`, and `dist/idl/timemarket.json` exist and `address` matches the program ID.
- Acceptance: `pnpm -s --filter @starter/ts-sdk run build` produces typed clients and ships IDL in `dist/idl`; test suite PASS.

### P2 – Provide higher-level client helpers
- Impact: Easier frontend integration and tests.
- Files: `packages/ts-sdk/src/index.ts`.
- Acceptance: Functions to derive PDAs, build transaction instructions, and parse events.

## 4) Frontend (apps/web)

### P1 – Core screens missing
- Status: RESOLVED (MVP)
- Impact (before): Users couldn’t navigate or try flows end-to-end.
- Implemented screens (apps/web):
	- Wallet: `WalletButton`, `WalletStatus`, providers wired in `app/layout.tsx` and `src/app/providers.tsx` (Phantom/Solflare).
	- Discovery: Home (`app/page.tsx`), Creators listing (`app/creators/page.tsx`), Creator profile with calendar and Reserve CTA (`app/creator/[pubkey]/page.tsx`).
	- Creator: Onboard (`app/creator/onboard/page.tsx`) with Anchor program client (mocked txn), Dashboard (`app/creator/dashboard/page.tsx`) with create-slot form and revenue panel.
	- Slot detail: `app/slot/[id]/page.tsx` supports Auction BidRoom and Fixed-price reserve panel; Payment summary box present.
	- Ticket & Check-in: `app/ticket/[id]/page.tsx` with check-in toggle; QR placeholder.
	- Support/Disputes: `app/support/complaints/page.tsx` to submit and track complaints (off-chain scaffold).
- TDD: Added `tests/web-core-screens.test.ts` asserting presence of providers and key screens/CTAs (Reserve, BidRoom, check-in, etc.).
- Notes:
	- MVP focuses on UI scaffolding and flow wiring; on-chain calls are stubbed/mocked where noted.
	- Next: Hook buttons to actual Anchor instructions on localnet/devnet and add e2e tests.
- Acceptance: Core screens and happy-path UI flows are in place; tests PASS.

### P2 – UX around outbid refunds
- Impact: Manual “claim refund” button flow confusing.
- Acceptance: Inline prompts, background polling, or batched claim.

## 5) Tooling & DevEx

### P1 – Tests (unit/integration) missing
- Impact: Regressions undetected, especially around settlement math and time windows.
- Files: `programs/timemarket/tests/*` (add), CI workflow.
- Acceptance: Tests cover Stable T0/T1, Auction anti-sniping, refunds, disputes; sealed-bid when implemented.

### P2 – CI improvements
- Impact: Ensure reproducible builds and IDL artifacts.
- Files: `.github/workflows/ci.yml`.
- Acceptance: CI builds program, runs tests, publishes IDL as artifact, optionally lints TS SDK.

## 6) Data/Model considerations

### P1 – Subject/Venue privacy policy
- Impact: On-chain stores hashes only; off-chain metadata pipeline needed for human-readable labels.
- Acceptance: Define and implement an off-chain metadata pattern; link from NFT metadata if applicable.

### P2 – Timezone handling validation
- Impact: `tz_offset_min` stored; ensure frontend presents times correctly for creator/buyer.
- Acceptance: Cross-timezone UI verified with tests or storybook scenarios.

---

## Quick roadmap (suggested)
1. P0s: Unify Program ID (done) + implement sealed-bid end/settle (done) + fix CommitStore capacity + fix SDK IDL export.
2. P1s: Auto-bid, buy-now, creator time updates, fee override, refund queue, multi-capacity support, NFT integration, tests, core frontend screens.
3. P2s: Refactors, SOL support, CI polish, UX improvements, role/multisig for disputes.

## References
- Program sources: `programs/timemarket/src/*`
- IDL: `target/idl/timemarket.json`
- SDK: `packages/ts-sdk`
- Config: `Anchor.toml`
