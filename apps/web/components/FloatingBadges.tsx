"use client";
import { useEffect, useMemo, useState } from 'react';

type Badge = { id: number; side: 'left' | 'right'; top: number; value: number };

// Minimal, modern floating clocks to replace bubbly percent badges.
export default function FloatingBadges({ count = 2, values }: { count?: number; values?: number[] }) {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    // If explicit values provided, use them (keeps visual order). Otherwise generate deterministic set of 2*count values.
    const vals = values && values.length > 0 ? values.slice() : Array.from({ length: count * 2 }).map((_, i) => 20 + Math.round(((i + 1) / (count * 2)) * 80));
    const len = vals.length;
    const arr: Badge[] = vals.map((v, i) => ({
      id: i + 1,
      side: i % 2 === 0 ? 'left' : 'right',
      top: 12 + (i * (64 / Math.max(1, len))),
      value: v,
    }));
    setBadges(arr);
  }, [count, values]);

  // circumference for the clock progress ring (r = 18)
  const C = 2 * Math.PI * 18;

  const nodes = useMemo(() => badges.map((b) => {
    const pct = Math.max(0, Math.min(100, b.value));
    const offset = +(C * (1 - pct / 100)).toFixed(2);
    return (
      <div
        key={b.id}
        className={`float-badge float-clock ${b.side}`}
        style={{ top: `${b.top}%` }}
        aria-hidden={false}
        title={`${pct}%`}
      >
        <svg className="clock" width="56" height="56" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`${pct} percent`}>
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="10" floodOpacity="0.35" floodColor="#000"/>
            </filter>
          </defs>
          <g filter="url(#shadow)">
            <circle className="clock-bg" cx="24" cy="24" r="18" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <circle className="clock-track" cx="24" cy="24" r="18" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
            <circle
              className="clock-ring"
              cx="24"
              cy="24"
              r="18"
              fill="transparent"
              stroke="rgba(239,132,189,0.95)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.2,.9,.2,1)' }}
            />
            <g className="hand-group" style={{ transform: `rotate(${(pct / 100) * 360}deg)`, transformOrigin: '24px 24px', transition: 'transform 900ms cubic-bezier(.2,.9,.2,1)' }}>
              <line x1="24" y1="24" x2="24" y2="12" stroke="rgba(239,132,189,0.95)" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="24" cy="24" r="2" fill="rgba(239,132,189,0.95)" />
            </g>
          </g>
        </svg>
        <span className="clock-label">{pct}%</span>
      </div>
    );
  }), [badges]);

  return <>{nodes}</>;
}
