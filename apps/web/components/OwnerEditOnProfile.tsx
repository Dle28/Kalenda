"use client";
import { useWallet } from '@solana/wallet-adapter-react';
import ProfileSettings from './ProfileSettings';

export default function OwnerEditOnProfile({ pubkey }: { pubkey: string }) {
  const { publicKey } = useWallet();
  const isOwner = !!publicKey && publicKey.toBase58() === pubkey;
  if (!isOwner) return null;
  return (
    <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 3 }}>
      <ProfileSettings buttonLabel="Edit profile" onSaved={() => setTimeout(() => window.location.reload(), 300)} />
    </div>
  );
}
