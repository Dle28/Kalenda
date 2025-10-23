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
  const rowH = compact ? 40 : 50; 
  const rowGap = compact ? 10 : 8;
  const timeColW = compact ? 100 : 70;
  const minuteUnit = useMemo(() => (rowH + rowGap) / interval, [rowH, rowGap, interval]);

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

  const slotsByDay = useMemo(() => days.map((day) => {
    const start = new Date(day);
    const end = addMinutes(start, 24 * 60);
    return slotsInWeek
      .filter((s) => new Date(s.end) > start && new Date(s.start) < end)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }), [days, slotsInWeek]);

  const availabilityByDay = useMemo(() => days.map((day) => {
    const start = new Date(day);
    const end = addMinutes(start, 24 * 60);
    return availInWeek
      .filter((a) => new Date(a.end) > start && new Date(a.start) < end)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }), [days, availInWeek]);

  type CellMeta = { cls: 'unavail' | 'fixed' | 'auction' | 'avail'; text: string; slot: SlotView | null };

  const cellMatrix = useMemo(() => {
    const initial: CellMeta[][] = Array.from({ length: rows }, () => Array.from({ length: 7 }, () => ({ cls: 'unavail', text: 'Unavailable', slot: null })));
    const cellDurationMs = interval * 60000;

    slotsByDay.forEach((daySlots, dayIndex) => {
      const dayStart = new Date(days[dayIndex]).getTime();
      const dayEnd = dayStart + 24 * 60 * 60000;

      daySlots.forEach((slot) => {
        const slotStartMs = Math.max(new Date(slot.start).getTime(), dayStart);
        const slotEndMs = Math.min(new Date(slot.end).getTime(), dayEnd);
        if (slotEndMs <= slotStartMs) return;

        let startRow = Math.floor((slotStartMs - dayStart) / cellDurationMs);
        let endRow = Math.ceil((slotEndMs - dayStart) / cellDurationMs);
        if (endRow <= 0 || startRow >= rows) return;
        startRow = Math.max(0, startRow);
        endRow = Math.min(rows, endRow);

        const priceValue = slot.mode === 'EnglishAuction' ? Number(slot.startPrice ?? slot.price ?? 0) : Number(slot.price ?? slot.startPrice ?? 0);
        const priceLabel = slot.mode === 'EnglishAuction' ? `Auction $${priceValue.toFixed(2)}` : `$${priceValue.toFixed(2)}`;

        for (let r = startRow; r < endRow; r++) {
          const current = initial[r][dayIndex];
          const replace = !current.slot
            || (current.slot.mode !== 'EnglishAuction' && slot.mode === 'EnglishAuction')
            || (current.slot.mode === slot.mode && priceValue < Number(current.slot.startPrice ?? current.slot.price ?? Number.POSITIVE_INFINITY));

          if (replace) {
            initial[r][dayIndex] = { cls: slot.mode === 'EnglishAuction' ? 'auction' : 'fixed', text: priceLabel, slot };
          }
        }
      });
    });

    availabilityByDay.forEach((dayAvail, dayIndex) => {
      const dayStart = new Date(days[dayIndex]).getTime();
      const dayEnd = dayStart + 24 * 60 * 60000;

      dayAvail.forEach((block) => {
        const blockStartMs = Math.max(new Date(block.start).getTime(), dayStart);
        const blockEndMs = Math.min(new Date(block.end).getTime(), dayEnd);
        if (blockEndMs <= blockStartMs) return;

        let startRow = Math.floor((blockStartMs - dayStart) / cellDurationMs);
        let endRow = Math.ceil((blockEndMs - dayStart) / cellDurationMs);
        if (endRow <= 0 || startRow >= rows) return;
        startRow = Math.max(0, startRow);
        endRow = Math.min(rows, endRow);

        for (let r = startRow; r < endRow; r++) {
          const current = initial[r][dayIndex];
          if (!current.slot) {
            initial[r][dayIndex] = { cls: 'avail', text: 'Available', slot: null };
          }
        }
      });
    });

    return initial;
  }, [rows, interval, slotsByDay, availabilityByDay, days]);

  const rowIndices = useMemo(() => Array.from({ length: rows }, (_, i) => i), [rows]);
  const timeLabels = useMemo(() =>
    rowIndices.map((r) => {
      const base = addMinutes(weekStart, r * interval);
      return r % Math.max(1, 60 / interval) === 0 ? fmtTime(base) : '';
    }),
  [rowIndices, weekStart, interval]);

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
          <button className="nav-pill" aria-label="Previous week" onClick={() => setWeekStart(addMinutes(weekStart, -7 * 24 * 60))}>
            <span aria-hidden>‹</span>
          </button>
          <div className="row" style={{ gap: 6, alignItems: 'baseline' }}>
            <b style={{ fontSize: compact ? 16 : 18 }}>
            {days[0].toLocaleDateString([], { month: 'short', day: 'numeric' })}
            {' – '}
            {days[6].toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </b>
            <span className="muted" style={{ fontSize: 12 }}>({days[0].toLocaleDateString([], { weekday: 'short' })} - {days[6].toLocaleDateString([], { weekday: 'short' })})</span>
          </div>
          <button className="nav-pill" aria-label="Next week" onClick={() => setWeekStart(addMinutes(weekStart, 7 * 24 * 60))}>
            <span aria-hidden>›</span>
          </button>
        </div>
        <div className="row" style={{ gap: 12, alignItems: 'center' }}>
          <span className="muted" style={{ fontSize: 12 }} suppressHydrationWarning>Timezone: {tz}</span>
          <label className="row" style={{ gap: 6, alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 12 }}>Interval</span>
            <select value={interval} onChange={(e) => setInterval(Number(e.target.value))}>
              {INTERVALS.map((m) => (
                <option key={m} value={m}>{m >= 60 ? `${Math.round(m / 60)}h` : `${m}m`}</option>
              ))}
            </select>
          </label>
          <div className="row" style={{ gap: 14, alignItems: 'center' }}>
            <span className="legend"><span className="dot fixed" />Fixed</span>
            <span className="legend"><span className="dot auction" />Auction</span>
            <span className="legend"><span className="dot avail" />Free</span>
            <span className="legend"><span className="dot unavail" />Unavailable</span>
          </div>
        </div>
      </div>
      <div className="wk-grid" style={{ ['--wk-timew' as any]: `${timeColW}px`, ['--wk-row-h' as any]: `${rowH}px`, ['--wk-row-gap' as any]: `${rowGap}px` }}>
        <div className="wk-head-row">
          <div className="wk-head wk-time-header">Time</div>
          {days.map((d, i) => (
            <div key={i} className="wk-head day">
              <span className="muted" style={{ fontSize: 12 }}>{d.toLocaleDateString([], { weekday: 'short' })}</span>
              <b style={{ fontSize: 16 }}>{d.toLocaleDateString([], { month: 'short', day: 'numeric' })}</b>
            </div>
          ))}
        </div>

        <div className="wk-body">
          <div className="wk-time-column">
            {rowIndices.map((r) => (
              <div key={`time-${r}`} className="wk-time">{timeLabels[r]}</div>
            ))}
          </div>

          <div className="wk-days-columns">
            {days.map((day, dayIndex) => {
              const dayStart = new Date(day);
              const dayEnd = addMinutes(dayStart, 24 * 60);
              const unit = minuteUnit;
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
                const height = Math.max(16, minutesSpan * unit - rowGap);
                return (
                  <div key={`${cls}-${s.toISOString()}-${e.toISOString()}`} className={`wk-band ${cls}`} style={{ top, height }} title={`${fmtTime(s)}–${fmtTime(e)} ${label}`} onClick={onClick}>
                    <span className="wk-band-label">{label}</span>
                  </div>
                );
              };

              const slotBands: React.ReactNode[] = [];
              const daySlots = slotsByDay[dayIndex];
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
              const dayAvail = availabilityByDay[dayIndex];
              for (const a of dayAvail) {
                const clipped = clipToDay(new Date(a.start), new Date(a.end));
                if (!clipped) continue;
                const onClick = () => setReqOpen({ rangeStart: clipped.s, rangeEnd: clipped.e, start: clipped.s.toISOString().slice(0, 16), durationMin: 30 });
                const label = `Available • ${fmtTime(clipped.s)}–${fmtTime(clipped.e)}`;
                availBands.push(mkBand(clipped.s, clipped.e, 'avail', label, onClick));
              }

              return (
                <div key={`day-${dayIndex}`} className="wk-day-column">
                  <div className="wk-column-cells">
                    {rowIndices.map((r) => {
                      const cellStart = addMinutes(day, r * interval);
                      const cellEnd = addMinutes(cellStart, interval);
                      const meta = cellMatrix[r][dayIndex];
                      const first = meta.slot;
                      const onClick = () => {
                        if (!first) return;
                        const isOwner = !!wallet.publicKey && wallet.publicKey.toBase58() === creatorPubkey;
                        const url = isOwner ? `/slot/manage/${encodeURIComponent(first.id)}` : `/slot/${encodeURIComponent(first.id)}`;
                        router.push(url);
                      };
                      return (
                        <div
                          key={`cell-${dayIndex}-${r}`}
                          className={`wk-cell ${meta.cls}`}
                          title={`${fmtTime(cellStart)}–${fmtTime(cellEnd)} ${meta.text}`}
                          onClick={onClick}
                          style={{ cursor: first ? 'pointer' : 'default' }}
                        >
                          {interval >= 60 && meta.cls !== 'unavail' ? <span className="wk-tag">{meta.text}</span> : null}
                          {interval < 60 && meta.cls !== 'unavail' ? <span className="wk-dot" /> : null}
                        </div>
                      );
                    })}
                  </div>
                  <div className="wk-day-overlays">
                    {availBands}
                    {slotBands}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
                  } catch (err) {
                    console.error('Failed to send request:', err);
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
  .weekcal { display: grid; gap: 14px; max-width: 100%; overflow: visible; }
  .wk-grid { display: flex; flex-direction: column; gap: 12px; position: relative; padding: 12px; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; background: rgba(15,23,42,.48); box-shadow: inset 0 0 0 1px rgba(255,255,255,.04); max-width: 100%; overflow: hidden; box-sizing: border-box; }
  .wk-head-row { display: grid; grid-template-columns: var(--wk-timew) repeat(7, minmax(0, 1fr)); column-gap: 12px; align-items: stretch; }
  .wk-head { height: ${headerH}px }
  .wk-head.wk-time-header { display:flex; align-items:center; justify-content:flex-end; padding-right: 8px; font-size: ${compact ? 11 : 12}px; color: #64748b; font-weight: 500; }
  .wk-head.day { display:flex; flex-direction:column; align-items:flex-start; justify-content:center; border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:8px 10px; background: radial-gradient(120% 120% at 100% 0%, rgba(96,165,250,.18), transparent 60%), rgba(255,255,255,.02); min-width: 0; }
  .wk-body { display:flex; gap: 12px; }
  .wk-time-column { width: var(--wk-timew); display:flex; flex-direction:column; gap: var(--wk-row-gap); align-items:flex-end; padding-right: 8px; flex-shrink: 0; }
  .wk-time { height: var(--wk-row-h); font-size: ${compact ? 12 : 13}px; color: #94a3b8; display:flex; align-items:center; justify-content:flex-end; min-width: var(--wk-timew); }
  .wk-days-columns { display:grid; grid-template-columns: repeat(7, minmax(0, 1fr)); column-gap: 12px; flex: 1; }
  .wk-day-column { position: relative; min-width: 0; }
  .wk-column-cells { display:flex; flex-direction:column; gap: var(--wk-row-gap); min-width: 0; }
  .wk-cell { height: var(--wk-row-h); border-radius: 10px; border: 1px solid rgba(148,163,184,.18); background: rgba(15,23,42,.66); position: relative; overflow:hidden; transition: transform .2s ease, box-shadow .2s ease; min-width: 0; }
        .wk-cell.unavail { opacity: .5 }
  .wk-cell.fixed { background: linear-gradient(135deg, rgba(59,130,246,.24), rgba(37,99,235,.28)); border-color: rgba(59,130,246,.4) }
  .wk-cell.auction { background: linear-gradient(135deg, rgba(236,72,153,.24), rgba(244,114,182,.28)); border-color: rgba(236,72,153,.4) }
  .wk-cell.avail { background: linear-gradient(135deg, rgba(16,185,129,.18), rgba(45,212,191,.24)); border-color: rgba(34,197,94,.38) }
  .wk-cell:hover { transform: translateY(-2px); box-shadow: 0 16px 32px rgba(15,23,42,.38) }
  .wk-tag { font-size: ${compact ? 12 : 13}px; color: #f8fafc; padding: 0 6px; white-space: nowrap }
        .wk-dot { width: ${compact ? 8 : 10}px; height: ${compact ? 8 : 10}px; border-radius: 999px; background: currentColor; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) }
        .wk-cell.fixed .wk-dot { color: #60a5fa }
        .wk-cell.auction .wk-dot { color: #f472b6 }
  .wk-cell.avail .wk-dot { color: #34d399 }
        /* Ripple effect on calendar cells (stronger) */
        .wk-cell::before { content:""; position:absolute; left:50%; top:50%; width:30px; height:30px; border-radius:999px; background: radial-gradient(circle, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 60%); transform: translate(-50%, -50%) scale(.2); opacity: 0; transition: transform .5s ease, opacity .5s ease; pointer-events:none }
        .wk-cell:hover::before { opacity: .38; transform: translate(-50%, -50%) scale(7); }
        .wk-cell:active::before { opacity: .45; transform: translate(-50%, -50%) scale(8); }
  .legend { display:flex; align-items:center; gap:6px; font-size:12px; color:#cbd5f5; background:rgba(15,23,42,.6); border:1px solid rgba(148,163,184,.24); padding:4px 8px; border-radius:999px }
  .dot { width:10px; height:10px; border-radius:999px; display:inline-block }
        .dot.fixed { background:#60a5fa }
        .dot.auction { background:#f472b6 }
        .dot.avail { background:#34d399 }
        .dot.unavail { background:#64748b }
    /* Overlay bands */
  .wk-day-overlays { position:absolute; inset:0; pointer-events:none; }
  .wk-band { position: absolute; left: 6px; right: 6px; box-sizing: border-box; border-radius: 12px; border: 1px solid; display: flex; align-items: center; padding: 4px 10px; cursor: pointer; box-shadow: 0 6px 18px rgba(15,23,42,.24); pointer-events: auto; min-height: 24px; backdrop-filter: blur(6px) }
  .wk-band.fixed { background: rgba(96,165,250,.24); border-color: rgba(59,130,246,.55); color: #f8fafc }
  .wk-band.auction { background: rgba(244,114,182,.28); border-color: rgba(236,72,153,.54); color: #fff7fb }
  .wk-band.avail { background: rgba(45,212,191,.22); border-color: rgba(34,197,94,.5); color: #ecfdf5 }
  .wk-band:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(15,23,42,.32) }
  .wk-band-label { font-size: ${compact ? 11 : 12}px; text-shadow: 0 1px 0 rgba(15,23,42,.36); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; pointer-events: none }
        @media (prefers-reduced-motion: reduce) {
          .wk-cell::before { transition: none; }
        }
        .nav-pill { display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:999px; background:rgba(148,163,184,.16); border:1px solid rgba(148,163,184,.28); color:#e2e8f0; font-size:16px; cursor:pointer; transition: background .2s ease, transform .2s ease }
        .nav-pill:hover { background:rgba(148,163,184,.28); transform: translateY(-1px) }
        .nav-pill:active { transform: translateY(0) }
        @media (max-width: 960px) {
          .wk-grid { padding: 10px; }
          .wk-head-row { column-gap: 8px; grid-template-columns: ${compact ? 52 : 60}px repeat(7, minmax(0, 1fr)); }
          .wk-body { gap: 8px; }
          .wk-days-columns { column-gap: 8px; }
          .wk-time { font-size: ${compact ? 11 : 12}px }
          .wk-cell { height: ${compact ? 32 : 36}px }
          .legend { font-size:11px }
        }
      `}</style>
    </div>
  );
}
