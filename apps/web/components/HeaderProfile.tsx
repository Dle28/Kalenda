"use client";
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';

export default function HeaderProfile() {
  const { publicKey } = useWallet();
  const pubkey = publicKey?.toBase58();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Link href="/profile" className="btn btn-outline" style={{ padding: '6px 12px' }}>
        My Profile
      </Link>
    </div>
  );
}

