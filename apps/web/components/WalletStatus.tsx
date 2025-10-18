"use client";
import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export default function WalletStatus() {
  const { connected, publicKey, connecting, disconnecting } = useWallet();
  const label = useMemo(() => {
    if (connecting) return "Connecting...";
    if (disconnecting) return "Disconnecting...";
    if (!connected || !publicKey) return "Not connected";
    const base58 = publicKey.toBase58();
    return `Connected: ${base58.slice(0, 4)}...${base58.slice(-4)}`;
  }, [connected, publicKey, connecting, disconnecting]);

  return <span className="muted" style={{ marginLeft: 8 }}>{label}</span>;
}

