"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from '@/app/home.module.css';

type C = { pubkey: string; name: string; avatar?: string; pricePerSlot?: number; rating?: number; bio?: string };

export default function Spotlight({ list, intervalMs = 7000 }: { list: C[]; intervalMs?: number }) {
  const pool = useMemo(() => (list || []).slice(0, 6), [list]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (pool.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % pool.length), intervalMs);
    return () => clearInterval(t);
  }, [pool.length, intervalMs]);
  const c = pool[idx];
  if (!c) return null;
  return (
    <Link href={`/creator/${encodeURIComponent(c.pubkey)}`} className={styles.spotlight} data-reveal data-float="0.03">
      <div className={styles.spotMedia} style={{ backgroundImage: `url(${c.avatar || 'https://placehold.co/640x640'})` }} />
      <div className={styles.spotOverlay}>
        <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
          <b>{c.name}</b>
          {typeof c.pricePerSlot === 'number' && <span>${c.pricePerSlot.toFixed(2)} <span className="muted">/ min</span></span>}
        </div>
        {c.bio && <div className="muted one-line">{c.bio}</div>}
      </div>
    </Link>
  );
}

