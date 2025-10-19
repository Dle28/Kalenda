"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";

export default function WalletStatus() {
  const { connected, publicKey } = useWallet();
  const base58 = publicKey?.toBase58();
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (!base58) return setAvatar(null);
        const res = await fetch(`/api/creator/profile?pubkey=${encodeURIComponent(base58)}`, { cache: 'no-store' });
        const json = await res.json();
        if (!active) return;
        setAvatar(json?.profile?.avatar || null);
      } catch {
        if (active) setAvatar(null);
      }
    }
    load();
    return () => { active = false };
  }, [base58]);

  const initials = useMemo(() => {
    if (!base58) return "";
    return `${base58.slice(0, 2)}`.toUpperCase();
  }, [base58]);

  if (!connected || !base58) return null;

  return (
    <Link href="/profile" aria-label="Open my profile" style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 8, textDecoration: 'none' }}>
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,.18)',
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(239,132,189,.35), rgba(59,130,246,.35))',
          color: '#0b0c10',
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="avatar" width={32} height={32} style={{ width: 32, height: 32, objectFit: 'cover' }} />
        ) : (
          <>{initials}</>
        )}
      </span>
    </Link>
  );
}
