# TimeMarket: NFT Time Slots on Solana

TimeMarket turns calendar availability into tradable NFTs on Solana. Creators configure time slots, buyers reserve or bid on them, and settlement routes funds through PDA-owned escrow vaults. This monorepo holds the Anchor program (`programs/timemarket`), a reference counter program (`programs/my_program`), and scaffolding for future apps/packages.

## Stack Versions

| Component      | Version / Range | Notes |
|----------------|-----------------|-------|
| Anchor CLI     | 0.31.1          | Install via `avm`; see setup below |
| Anchor crates  | 0.31.1          | `anchor-lang` and `anchor-spl` |
| Solana CLI     | 1.18.x          | Tested with 1.18.16+ |
| Rust toolchain | stable (1.75+)  | Managed with `rustup` |
| Node / pnpm    | Node 18+, pnpm 9 | For app builds (`corepack` recommended) |

Keep these in sync to avoid linker or IDL build issues.

## Repository Layout

- `Anchor.toml` – shared configuration and script aliases.
- `programs/timemarket` – main Anchor program for slot creation, auctions, settlement, and disputes.
- `programs/my_program` – lightweight example program kept for scaffolding/tests.
- `apps/` & `packages/` – client placeholders (only `apps/actions` contains runtime code today).

## Prerequisites

### 1. Rust toolchain
```bash
rustup default stable
rustup component add rustfmt clippy
```

### 2. Anchor CLI 0.31.1
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.31.1
avm use 0.31.1
anchor --version      # expect anchor-cli 0.31.1
```

### 3. Solana CLI 1.18.x
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.16/install)"
solana --version
solana config set --url localhost
```
Replace `v1.18.16` with a newer 1.18.x tag when available.

### 4. Node.js & pnpm
```bash
corepack enable
corepack prepare pnpm@9 --activate
pnpm --version
```

## Install Workspace Dependencies

```bash
pnpm install
```

Rust dependencies download on demand during `anchor build` or `cargo check`.

## Configure Program IDs

Anchor expects a keypair and matching IDs for each program.

1. Generate a keypair for `timemarket` (localnet example):
   ```bash
   solana-keygen new -o target/deploy/timemarket-keypair.json
   ```

2. Update IDs in code and config:
   - Edit `programs/timemarket/src/lib.rs` and set `declare_id!("<pubkey>")`.
   - Update `Anchor.toml`:
     ```toml
     [programs.localnet]
     timemarket = "<pubkey>"
     ```

3. For devnet or mainnet deployments add a dedicated section:
   ```toml
   [programs.devnet]
   timemarket = "<devnet-program-id>"
   ```

Run `anchor keys list` to confirm Anchor sees the expected public keys.

## Local Development

1. Start a validator:
   ```bash
   pnpm dev:chain
   # or
   anchor localnet
   ```

2. Build the programs:
   ```bash
   anchor build
   ```

3. Check the code locally (optional but fast feedback):
   ```bash
   cd programs/timemarket
   cargo check
   cargo test
   ```

4. Deploy to localnet:
   ```bash
   anchor deploy
   ```

5. Generate the IDL for clients:
   ```bash
   anchor idl build
   ```

## Deploying to Devnet (or Mainnet)

1. Point the Solana CLI at your target cluster and fund the wallet:
   ```bash
   solana config set --url devnet
   solana airdrop 2     # devnet only
   ```

2. Update `Anchor.toml` provider settings:
   ```toml
   [provider]
   cluster = "Devnet"
   wallet = "~/.config/solana/id.json"
   ```

3. Ensure the devnet program ID and keypair exist (see “Configure Program IDs”).

4. Build and deploy:
   ```bash
   anchor build
   anchor deploy
   ```

5. (Optional) Publish the IDL so clients can fetch it from the registry:
   ```bash
   anchor idl build
   anchor idl deploy <program-id> target/idl/timemarket.json
   ```

The same pattern works for mainnet-beta; replace the cluster, ensure the wallet is funded, and guard your keypairs.

## Useful Scripts

- `pnpm dev:chain` – launches `anchor localnet` with live logging.
- `pnpm build` / `pnpm lint` – frontend tooling (see individual `package.json`).
- `anchor test` – spins up a validator, builds, deploys, and runs Rust integration tests.

## Program Highlights

- **Slot lifecycle** – creators initialize a platform, register profiles, and create slots (`Mode::Stable`, `Mode::EnglishAuction`, `Mode::SealedBid`).
- **Escrow handling** – funds flow into PDA-owned ATAs; payouts occur in T0/T1 phases with configurable fee splits.
- **Dispute resolution** – `raise_dispute` freezes settlement; admins settle via `resolve_dispute` with custom split basis points.
- **Events** – extensive `emit!` coverage for indexers (reservation, settlement, bids, disputes).

For exact account constraints and math see `programs/timemarket/src/lib.rs`.

## Troubleshooting

- **`Safety checks failed` on build** – every `UncheckedAccount` must include a `/// CHECK:` comment explaining why unchecked access is safe (see `ResolveDispute`).
- **IDL build failures around `token_interface`** – the code uses `anchor_spl::token` after the 0.31.1 upgrade; ensure your workspace matches the versions listed above.
- **Linker errors (especially on Windows)** – install LLVM/clang and add `bpfel-unknown-unknown` via `rustup target add bpfel-unknown-unknown`.
- **Lost validator state** – delete `.anchor` and restart `pnpm dev:chain` if the local validator enters a bad state.

## References

- Anchor docs: <https://www.anchor-lang.com/docs>
- Solana CLI guide: <https://docs.solana.com/cli>
- SPL Token program: <https://spl.solana.com/token>

Feel free to open issues or reach out if you run into deployment bumps. Happy building!
