"use client";
import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MyProfilePage() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const pubkey = publicKey?.toBase58();

  useEffect(() => {
    if (pubkey) router.replace(`/creator/${encodeURIComponent(pubkey)}`);
  }, [pubkey, router]);

  return (
    <section className="container page-enter" style={{ maxWidth: 720 }}>
      <h1 className="title" style={{ fontSize: 28, margin: '8px 0 12px' }}>My Profile</h1>
      {!pubkey ? (
        <p className="muted">Connect your wallet to view your public profile.</p>
      ) : (
        <p className="muted">Redirecting to your public profile…</p>
      )}
      <div style={{ marginTop: 12 }}>
        <Link href="/creators" className="btn btn-outline" style={{ padding: '6px 12px' }}>Explore creators</Link>
      </div>
    </section>
  );
}
