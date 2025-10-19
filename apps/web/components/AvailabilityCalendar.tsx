"use client";
import React, { useMemo } from 'react';

type SlotView = {
  id: string;
  start: string; // ISO
  end: string;   // ISO
  mode: 'Stable' | 'EnglishAuction';
  price?: number;
  startPrice?: number;
};

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AvailabilityCalendar({ slots, days = 14 }: { slots: SlotView[]; days?: number }) {
  const now = new Date();
  const daysArr = useMemo(() => {
    return Array.from({ length: Math.max(1, days) }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, [days]);

  const byDay = useMemo(() => {
    const map = new Map<string, SlotView[]>();
    for (const s of slots || []) {
      const ds = new Date(s.start);
      ds.setHours(0, 0, 0, 0);
      const key = ds.toISOString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    for (const [k, list] of map) list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return map;
  }, [slots]);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="calv">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 className="section-title" style={{ margin: 0 }}>Calendar</h3>
        <span className="muted" style={{ fontSize: 12 }}>Timezone: {tz}</span>
      </div>
      <div className="calv-grid">
        {daysArr.map((d) => {
          const key = d.toISOString();
          const list = byDay.get(key) || [];
          const weekday = d.toLocaleDateString([], { weekday: 'short' });
          const datelabel = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
          return (
            <div key={key} className={`calv-day ${list.length ? '' : 'calv-empty'}`}>
              <div className="calv-head">
                <span className="muted">{weekday}</span>
                <b>{datelabel}</b>
              </div>
              <div className="calv-body">
                {list.length === 0 ? (
                  <span className="muted" style={{ fontSize: 12 }}>Unavailable</span>
                ) : (
                  list.map((s) => {
                    const st = new Date(s.start);
                    const en = new Date(s.end);
                    const label = s.mode === 'EnglishAuction'
                      ? `Auction from $${(s.startPrice ?? 0).toFixed(2)}`
                      : `Fixed $${(s.price ?? 0).toFixed(2)}`;
                    return (
                      <div key={s.id} className={`calv-slot ${s.mode === 'EnglishAuction' ? 'auction' : 'stable'}`} title={`${st.toLocaleString()} - ${en.toLocaleTimeString()}`}>
                        <span className="calv-time">{fmtTime(st)}–{fmtTime(en)}</span>
                        <span className="calv-label">{label}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        .calv-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
        @media (max-width: 960px) { .calv-grid { grid-template-columns: repeat(2, 1fr) } }
        .calv-day { border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 10px; background: rgba(255,255,255,.02); min-height: 110px; display:flex; flex-direction:column; gap:6px }
        .calv-day.calv-empty { opacity: .75 }
        .calv-head { display:flex; align-items:center; justify-content:space-between }
        .calv-body { display:flex; flex-direction:column; gap:6px }
        .calv-slot { display:flex; align-items:center; justify-content:space-between; gap:8px; padding: 6px 8px; border-radius: 10px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04) }
        .calv-slot.stable { border-color: rgba(59,130,246,.28); background: rgba(59,130,246,.10) }
        .calv-slot.auction { border-color: rgba(239,132,189,.28); background: rgba(239,132,189,.10) }
        .calv-time { font-weight: 600; font-size: 12px }
        .calv-label { font-size: 12px; color: #cbd5e1 }
      `}</style>
    </div>
  );
}

