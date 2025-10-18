"use client";
import dynamic from "next/dynamic";

// Avoid SSR to prevent hydration mismatches from UI icons/labels
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function WalletButton() {
  return <WalletMultiButton />;
}

