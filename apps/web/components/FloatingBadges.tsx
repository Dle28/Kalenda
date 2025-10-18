"use client";
import { useEffect, useMemo, useState } from 'react';

type Badge = { id: number; side: 'left' | 'right'; top: number; value: number };

export default function FloatingBadges({ count = 2 }: { count?: number }) {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const arr: Badge[] = Array.from({ length: count * 2 }).map((_, i) => ({
      id: i + 1,
      side: i % 2 === 0 ? 'left' : 'right',
      top: 15 + (i * (60 / (count * 2))),
      value: 20 + Math.round(Math.random() * 60),
    }));
    setBadges(arr);
  }, [count]);

  const nodes = useMemo(() => badges.map((b) => (
    <div
      key={b.id}
      className={`float-badge ${b.side}`}
      style={{ top: `${b.top}%` }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2l7 10-7 10-7-10 7-10z" fill="currentColor"/>
      </svg>
      <span>{b.value}%</span>
    </div>
  )), [badges]);

  return <>{nodes}</>;
}

