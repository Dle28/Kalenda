# Anchor + Solana SBF build environment
# - Anchor CLI 0.31.1 via avm
# - Solana CLI 1.18.x (pin 1.18.16)
# - Rust stable toolchain

FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        pkg-config \
        libssl-dev \
        build-essential \
        python3 \
        xz-utils \
        llvm clang \
    && rm -rf /var/lib/apt/lists/*

# Install Rust (stable)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal \
    && . /root/.cargo/env \
    && rustup default stable \
    && rustup component add rustfmt clippy

# Install Solana CLI 1.18.16 (adjust if needed)
RUN sh -c "$(curl -sSfL https://release.solana.com/v1.18.16/install)" \
    && ln -s /root/.local/share/solana/install/active_release/bin/solana /usr/local/bin/solana \
    && solana --version

# Install Anchor via avm and select 0.31.1
RUN . /root/.cargo/env \
    && cargo install --git https://github.com/coral-xyz/anchor avm --locked \
    && /root/.cargo/bin/avm install 0.31.1 \
    && /root/.cargo/bin/avm use 0.31.1 \
    && anchor --version

# Ensure all tools are on PATH at runtime
ENV PATH="/root/.cargo/bin:/root/.local/share/solana/install/active_release/bin:/root/.avm/bin:${PATH}"

WORKDIR /work

# Default to bash; commands provided by `docker compose run`
CMD ["bash"]

