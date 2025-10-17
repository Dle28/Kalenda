"use client";
import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export default function WalletStatus() {
  const { connected, publicKey, connecting, disconnecting } = useWallet();
  const label = useMemo(() => {
    if (connecting) return "Đang kết nối...";
    if (disconnecting) return "Đang ngắt kết nối...";
    if (!connected || !publicKey) return "Chưa kết nối";
    const base58 = publicKey.toBase58();
    return `Đã kết nối: ${base58.slice(0, 4)}...${base58.slice(-4)}`;
  }, [connected, publicKey, connecting, disconnecting]);

  return <span className="muted" style={{ marginLeft: 8 }}>{label}</span>;
}

