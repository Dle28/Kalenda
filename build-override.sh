#!/bin/bash
# Override Rust for Anchor build

# Export system Rust
export RUSTC_WRAPPER=""
export RUSTUP_TOOLCHAIN=stable

# Symlink system Rust to Solana SDK location
SOLANA_SDK_RUST="/tmp/solana-release/bin/sdk/sbf/dependencies/platform-tools/rust"
if [ -d "$SOLANA_SDK_RUST" ]; then
  mv "$SOLANA_SDK_RUST" "${SOLANA_SDK_RUST}.bak" 2>/dev/null || true
  mkdir -p "$SOLANA_SDK_RUST"
  ln -sf $(which rustc | xargs dirname | xargs dirname)/* "$SOLANA_SDK_RUST/"
fi

# Build
export PATH="/tmp/solana-release/bin:$PATH"
anchor build

