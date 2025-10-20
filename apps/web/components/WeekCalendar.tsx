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

type AvailabilityView = {
  id?: string;
  start: string; // ISO
  end: string;   // ISO
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

export default function WeekCalendar({ slots, avail = [], defaultInterval = 60, compact = false, creatorPubkey }: { slots: SlotView[]; avail?: AvailabilityView[]; defaultInterval?: number; compact?: boolean; creatorPubkey?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [interval, setInterval] = useState<number>(INTERVALS.includes(defaultInterval) ? defaultInterval : 60);
  const wallet = useWallet();
  const router = useRouter();
  const tz = mounted ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';
  const [reqOpen, setReqOpen] = useState<null | { rangeStart: Date; rangeEnd: Date; start: string; durationMin: number }>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addMinutes(weekStart, i * 24 * 60)), [weekStart]);
  const rows = useMemo(() => 1440 / interval, [interval]);
  const headerH = compact ? 36 : 44;
  const rowH = compact ? 26 : 34;
  const rowGap = 2; // smaller gap to make bands more continuous visually
  const timeColW = compact ? 58 : 70;

  const slotsInWeek = useMemo(() => {
    const start = weekStart.getTime();
    const end = addMinutes(weekStart, 7 * 24 * 60).getTime();
    return (slots || []).filter((s) => new Date(s.end).getTime() > start && new Date(s.start).getTime() < end);
  }, [slots, weekStart]);

  const availInWeek = useMemo(() => {
    const start = weekStart.getTime();
    const end = addMinutes(weekStart, 7 * 24 * 60).getTime();
    return (avail || []).filter((s) => new Date(s.end).getTime() > start && new Date(s.start).getTime() < end);
  }, [avail, weekStart]);

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
            <span className="dot avail" /> <span className="muted" style={{ fontSize: 12 }}>Free time</span>
            <span className="dot unavail" /> <span className="muted" style={{ fontSize: 12 }}>Unavailable</span>
          </div>
        </div>
      </div>
      <div className="wk-grid" style={{ ['--wk-timew' as any]: `${timeColW}px`, ['--wk-row-h' as any]: `${rowH}px`, ['--wk-row-gap' as any]: `${rowGap}px` }}>
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

        {/* Overlay continuous bands per day: free time + slots */}
        {days.map((day, i) => {
          const dayStart = new Date(day);
          const dayEnd = addMinutes(dayStart, 24 * 60);
          const unit = (rowH + rowGap) / interval; // px per minute
          const clipToDay = (start: Date, end: Date) => {
            const s = new Date(Math.max(start.getTime(), dayStart.getTime()));
            const e = new Date(Math.min(end.getTime(), dayEnd.getTime()));
            if (e <= s) return null as null | { s: Date; e: Date };
            return { s, e };
          };
          const mkBand = (s: Date, e: Date, cls: 'fixed' | 'auction' | 'avail', label: string, onClick?: () => void) => {
            const minutesFromStart = (s.getTime() - dayStart.getTime()) / 60000;
            const minutesSpan = (e.getTime() - s.getTime()) / 60000;
            const top = minutesFromStart * unit;
            const height = Math.max(14, minutesSpan * unit - rowGap);
            return (
              <div key={`${cls}-${s.toISOString()}-${e.toISOString()}`} className={`wk-band ${cls}`} style={{ top, height }} title={`${fmtTime(s)}–${fmtTime(e)} ${label}`} onClick={onClick}>
                <span className="wk-band-label">{label}</span>
              </div>
            );
          };
          const slotBands: React.ReactNode[] = [];
          const daySlots = slotsInWeek.filter((x) => new Date(x.end) > dayStart && new Date(x.start) < dayEnd);
          for (const s of daySlots) {
            const clipped = clipToDay(new Date(s.start), new Date(s.end));
            if (!clipped) continue;
            const priceLabel = s.mode === 'EnglishAuction' ? `Auction $${Number(s.startPrice || 0).toFixed(2)}` : `$${Number(s.price || 0).toFixed(2)}`;
            const label = `${priceLabel} • ${fmtTime(clipped.s)}–${fmtTime(clipped.e)}`;
            const cls = s.mode === 'EnglishAuction' ? 'auction' : 'fixed';
            const firstId = s.id;
            const onClick = () => {
              const isOwner = !!wallet.publicKey && wallet.publicKey.toBase58() === creatorPubkey;
              const url = isOwner ? `/slot/manage/${encodeURIComponent(firstId)}` : `/slot/${encodeURIComponent(firstId)}`;
              router.push(url);
            };
            slotBands.push(mkBand(clipped.s, clipped.e, cls as any, label, onClick));
          }
          const availBands: React.ReactNode[] = [];
          const dayAvail = availInWeek.filter((x) => new Date(x.end) > dayStart && new Date(x.start) < dayEnd);
          for (const a of dayAvail) {
            const clipped = clipToDay(new Date(a.start), new Date(a.end));
            if (!clipped) continue;
            const onClick = () => setReqOpen({ rangeStart: clipped.s, rangeEnd: clipped.e, start: clipped.s.toISOString().slice(0,16), durationMin: 30 });
            const label = `Available • ${fmtTime(clipped.s)}–${fmtTime(clipped.e)}`;
            availBands.push(mkBand(clipped.s, clipped.e, 'avail', label, onClick));
          }
          return (
            <div key={`over-${i}`} className="wk-over-col" style={{ gridColumn: i + 2, gridRow: '2 / -1' }}>
              {/* Free time behind slots */}
              {availBands}
              {slotBands}
            </div>
          );
        })}
      </div>
      {reqOpen && (
        <div className="modal" onClick={() => setReqOpen(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <b>Request a time</b>
              <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setReqOpen(null)}>Close</button>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              <span className="muted">Within {fmtTime(reqOpen.rangeStart)}–{fmtTime(reqOpen.rangeEnd)}</span>
              <label className="stack">
                <span className="muted">Start</span>
                <input type="datetime-local" value={reqOpen.start} onChange={(e) => setReqOpen({ ...reqOpen, start: e.target.value })} />
              </label>
              <label className="stack">
                <span className="muted">Duration (min)</span>
                <select value={reqOpen.durationMin} onChange={(e) => setReqOpen({ ...reqOpen, durationMin: Number(e.target.value) })}>
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={45}>45</option>
                  <option value={60}>60</option>
                </select>
              </label>
              <button className="btn btn-secondary" style={{ padding: '8px 12px' }}
                onClick={async () => {
                  try {
                    const s = new Date(reqOpen.start);
                    const e = new Date(s);
                    e.setMinutes(e.getMinutes() + reqOpen.durationMin);
                    if (e > reqOpen.rangeEnd) {
                      alert('Selected time exceeds available range.');
                      return;
                    }
                    await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creator: creatorPubkey, start: s.toISOString(), end: e.toISOString(), from: wallet.publicKey?.toBase58?.() }) });
                    alert('Request sent!');
                    setReqOpen(null);
                  } catch (e) {
                    alert('Failed to send request');
                  }
                }}>
                Send request
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .weekcal { }
        .wk-grid { display: grid; grid-template-columns: var(--wk-timew) repeat(7, 1fr); column-gap: 10px; row-gap: var(--wk-row-gap); align-items: stretch; grid-auto-rows: var(--wk-row-h); position: relative }
        .wk-head { height: ${headerH}px }
        .wk-head.day { display:flex; align-items:center; justify-content:space-between; border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:6px 8px; background: rgba(255,255,255,.04) }
        .wk-time { height: ${rowH}px; font-size: ${compact ? 12 : 14}px; color: #94a3b8; text-align: right; padding-right: 6px; display:flex; align-items:center; justify-content:flex-end }
        .wk-cell { height: ${rowH}px; border-radius: 6px; border: 1px solid rgba(255,255,255,.06); background: rgba(255,255,255,.02); position: relative; overflow:hidden }
        .wk-cell.unavail { opacity: .5 }
        .wk-cell.fixed { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.28) }
        .wk-cell.auction { background: rgba(239,132,189,.14); border-color: rgba(239,132,189,.32) }
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
        .dot.avail { background:#34d399 }
        .dot.unavail { background:#64748b }
        /* Overlay bands */
        .wk-over-col { position: relative; z-index: 3; pointer-events: none }
        .wk-band { position: absolute; left: 6px; width: calc(100% - 12px); box-sizing: border-box; border-radius: 10px; border: 1px solid; display: flex; align-items: center; padding: 2px 8px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.18); pointer-events: auto; min-height: 20px }
        .wk-band.fixed { background: rgba(59,130,246,.22); border-color: rgba(59,130,246,.45); color: #e8f0ff }
        .wk-band.auction { background: rgba(239,132,189,.26); border-color: rgba(239,132,189,.48); color: #fff0fb }
        .wk-band.avail { background: rgba(52,211,153,.18); border-color: rgba(52,211,153,.48); color: #eafff7 }
        .wk-band-label { font-size: ${compact ? 11 : 12}px; text-shadow: 0 1px 0 rgba(0,0,0,.2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; pointer-events: none }
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
