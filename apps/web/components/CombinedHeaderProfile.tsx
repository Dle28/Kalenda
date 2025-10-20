"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export default function CombinedHeaderProfile() {
  const { publicKey, connected } = useWallet();
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
    if (!base58) return "MP"; // My Profile
    return `${base58.slice(0, 2)}`.toUpperCase();
  }, [base58]);

  return (
    <Link href="/profile" className="btn btn-outline" style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,.18)',
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(239,132,189,.35), rgba(59,130,246,.35))',
          color: '#0b0c10',
          fontWeight: 700,
          fontSize: 11,
        }}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="avatar" width={26} height={26} style={{ width: 26, height: 26, objectFit: 'cover' }} />
        ) : (
          <>{initials}</>
        )}
      </span>
      <span>{connected ? 'My Profile' : 'Profile'}</span>
    </Link>
  );
}

