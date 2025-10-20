"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';

type SlotView = {
  id: string;
  start: string; // ISO
  end: string;   // ISO
  mode: 'Stable' | 'EnglishAuction';
  price?: number;
  startPrice?: number;
};

// Limit selectable intervals to 30 minutes and 1 hour
const INTERVALS = [30, 60]; // minutes

function startOfWeek(d: Date) {
  const day = d.getDay(); // 0-6, Sun=0
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

function addMinutes(d: Date, min: number) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() + min);
  return x;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function WeekCalendar({ slots, defaultInterval = 60, compact = false, creatorPubkey }: { slots: SlotView[]; defaultInterval?: number; compact?: boolean; creatorPubkey?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [interval, setInterval] = useState<number>(INTERVALS.includes(defaultInterval) ? defaultInterval : 60);
  const wallet = useWallet();
  const router = useRouter();
  const tz = mounted ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addMinutes(weekStart, i * 24 * 60)), [weekStart]);
  const rows = useMemo(() => 1440 / interval, [interval]);

  const slotsInWeek = useMemo(() => {
    const start = weekStart.getTime();
    const end = addMinutes(weekStart, 7 * 24 * 60).getTime();
    return (slots || []).filter((s) => new Date(s.end).getTime() > start && new Date(s.start).getTime() < end);
  }, [slots, weekStart]);

  function classify(cellStart: Date, cellEnd: Date) {
    const overlapping = slotsInWeek.filter((s) => {
      const ss = new Date(s.start).getTime();
      const ee = new Date(s.end).getTime();
      return ss < cellEnd.getTime() && ee > cellStart.getTime();
    });
    if (!overlapping.length) return { cls: 'unavail', text: 'Unavailable' };
    // Prefer auction if any auction slot overlaps
    const auction = overlapping.filter((s) => s.mode === 'EnglishAuction');
    if (auction.length) {
      const min = Math.min(...auction.map((s) => Number(s.startPrice || 0)));
      return { cls: 'auction', text: `Auction $${min.toFixed(2)}` };
    }
    const stable = overlapping.filter((s) => s.mode === 'Stable');
    if (stable.length) {
      const min = Math.min(...stable.map((s) => Number(s.price || 0)));
      return { cls: 'fixed', text: `$${min.toFixed(2)}` };
    }
    return { cls: 'unavail', text: 'Unavailable' };
  }

  if (!mounted) {
    return (
      <div className="weekcal">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="skeleton" style={{ width: 220, height: 28 }} />
          <div className="skeleton" style={{ width: 200, height: 20 }} />
        </div>
        <div className="skeleton" style={{ width: '100%', height: 260, borderRadius: 12 }} />
      </div>
    );
  }

  return (
    <div className="weekcal">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setWeekStart(addMinutes(weekStart, -7 * 24 * 60))}>{'<'}</button>
          <b>
            {days[0].toLocaleDateString([], { month: 'short', day: 'numeric' })}
            {' – '}
            {days[6].toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </b>
          <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setWeekStart(addMinutes(weekStart, 7 * 24 * 60))}>{'>'}</button>
        </div>
        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          <span className="muted" style={{ fontSize: 12 }} suppressHydrationWarning>Timezone: {tz}</span>
          <label className="row" style={{ gap: 6, alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 12 }}>Interval</span>
            <select value={interval} onChange={(e) => setInterval(Number(e.target.value))}>
              {INTERVALS.map((m) => (
                <option key={m} value={m}>{m >= 60 ? `${Math.round(m / 60)}h` : `${m}m`}</option>
              ))}
            </select>
          </label>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <span className="dot fixed" /> <span className="muted" style={{ fontSize: 12 }}>Fixed</span>
            <span className="dot auction" /> <span className="muted" style={{ fontSize: 12 }}>Auction</span>
            <span className="dot unavail" /> <span className="muted" style={{ fontSize: 12 }}>Unavailable</span>
          </div>
        </div>
      </div>
      <div className="wk-grid">
        <div className="wk-head">{/* time column empty */}</div>
        {days.map((d, i) => (
          <div key={i} className="wk-head day">
            <span className="muted">{d.toLocaleDateString([], { weekday: 'short' })}</span>
            <b>{d.toLocaleDateString([], { month: 'short', day: 'numeric' })}</b>
          </div>
        ))}
        {Array.from({ length: rows }).map((_, r) => {
          const rowStart = addMinutes(weekStart, r * interval);
          const label = r % Math.max(1, 60 / interval) === 0 ? fmtTime(rowStart) : '';
          return (
            <React.Fragment key={`r-${r}`}>
              <div className="wk-time">{label}</div>
              {days.map((d, c) => {
                const cellStart = addMinutes(d, r * interval);
                const cellEnd = addMinutes(cellStart, interval);
                const { cls, text } = classify(cellStart, cellEnd);
                const list = slotsInWeek.filter((s) => {
                  const ss = new Date(s.start).getTime();
                  const ee = new Date(s.end).getTime();
                  return ss < cellEnd.getTime() && ee > cellStart.getTime();
                }).sort((a,b)=> new Date(a.start).getTime() - new Date(b.start).getTime());
                const first = list[0];
                const onClick = () => {
                  if (!first) return;
                  const isOwner = !!wallet.publicKey && wallet.publicKey.toBase58() === creatorPubkey;
                  const url = isOwner ? `/slot/manage/${encodeURIComponent(first.id)}` : `/slot/${encodeURIComponent(first.id)}`;
                  router.push(url);
                };
                return (
                  <div
                    key={`c-${r}-${c}`}
                    className={`wk-cell ${cls}`}
                    title={`${fmtTime(cellStart)}–${fmtTime(cellEnd)} ${text}`}
                    onClick={onClick}
                    style={{ cursor: first ? 'pointer' : 'default' }}
                  >
                    {interval >= 60 && cls !== 'unavail' ? <span className="wk-tag">{text}</span> : null}
                    {interval < 60 && cls !== 'unavail' ? <span className="wk-dot" /> : null}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
      <style>{`
        .weekcal { }
        .wk-grid { display: grid; grid-template-columns: ${compact ? 58 : 70}px repeat(7, 1fr); gap: 10px; align-items: stretch }
        .wk-head { height: ${compact ? 36 : 44}px }
        .wk-head.day { display:flex; align-items:center; justify-content:space-between; border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:6px 8px; background: rgba(255,255,255,.04) }
        .wk-time { height: ${compact ? 26 : 34}px; font-size: ${compact ? 12 : 14}px; color: #94a3b8; text-align: right; padding-right: 6px; display:flex; align-items:center; justify-content:flex-end }
        .wk-cell { height: ${compact ? 26 : 34}px; border-radius: 8px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.02); position: relative; overflow:hidden }
        .wk-cell.unavail { opacity: .5 }
        .wk-cell.fixed { background: rgba(59,130,246,.14); border-color: rgba(59,130,246,.35) }
        .wk-cell.auction { background: rgba(239,132,189,.18); border-color: rgba(239,132,189,.4) }
        .wk-tag { font-size: ${compact ? 12 : 13}px; color: #e5e7eb; padding: 0 6px; white-space: nowrap }
        .wk-dot { width: ${compact ? 8 : 10}px; height: ${compact ? 8 : 10}px; border-radius: 999px; background: currentColor; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) }
        .wk-cell.fixed .wk-dot { color: #60a5fa }
        .wk-cell.auction .wk-dot { color: #f472b6 }
        /* Ripple effect on calendar cells (stronger) */
        .wk-cell::before { content:""; position:absolute; left:50%; top:50%; width:30px; height:30px; border-radius:999px; background: radial-gradient(circle, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 60%); transform: translate(-50%, -50%) scale(.2); opacity: 0; transition: transform .5s ease, opacity .5s ease; pointer-events:none }
        .wk-cell:hover::before { opacity: .38; transform: translate(-50%, -50%) scale(7); }
        .wk-cell:active::before { opacity: .45; transform: translate(-50%, -50%) scale(8); }
        .dot { width:10px; height:10px; border-radius:999px; display:inline-block }
        .dot.fixed { background:#60a5fa }
        .dot.auction { background:#f472b6 }
        .dot.unavail { background:#64748b }
        @media (prefers-reduced-motion: reduce) {
          .wk-cell::before { transition: none; }
        }
        @media (max-width: 960px) {
          .wk-grid { grid-template-columns: ${compact ? 46 : 52}px repeat(7, 1fr) }
          .wk-time { font-size: ${compact ? 11 : 12}px }
          .wk-cell { height: ${compact ? 22 : 26}px }
        }
      `}</style>
    </div>
  );
}
