"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function CalendarInfographic() {
  const [inView, setInView] = useState(false);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const { publicKey } = useWallet();
  const [data, setData] = useState<{ free: number[]; fixed: number[]; auction: number[] }>(() => ({ free: Array(7).fill(0), fixed: Array(7).fill(0), auction: Array(7).fill(0) }));

  function startOfWeek(d: Date) {
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday
    const m = new Date(d);
    m.setDate(d.getDate() + diff);
    m.setHours(0, 0, 0, 0);
    return m;
  }
  function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

  useEffect(() => {
    const t = setTimeout(() => setInView(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Load real creator data when wallet connected; otherwise zeros
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicKey) { setData({ free: Array(7).fill(0), fixed: Array(7).fill(0), auction: Array(7).fill(0) }); return; }
      const k = publicKey.toBase58();
      try {
        const [aRes, sRes] = await Promise.all([
          fetch(`/api/availability?creator=${encodeURIComponent(k)}`, { cache: 'no-store' }).then(r => r.json()).catch(() => ({ availability: [] })),
          fetch(`/api/slots?creator=${encodeURIComponent(k)}`, { cache: 'no-store' }).then(r => r.json()).catch(() => ({ slots: [] })),
        ]);
        const availability: { start: string; end: string }[] = aRes.availability || [];
        const slots: { start: string; end: string; mode: 'Stable'|'EnglishAuction' }[] = sRes.slots || [];
        const week0 = startOfWeek(new Date());
        const days: { s: Date; e: Date }[] = Array.from({ length: 7 }, (_, i) => {
          const s = new Date(week0); s.setDate(s.getDate() + i);
          const e = new Date(s); e.setDate(s.getDate() + 1);
          return { s, e };
        });
        const mins = (ms: number) => Math.round(ms / 60000);
        const overlaps = (s1: Date, e1: Date, s2: Date, e2: Date) => Math.max(0, Math.min(e1.getTime(), e2.getTime()) - Math.max(s1.getTime(), s2.getTime()));
        const free: number[] = Array(7).fill(0);
        const fixed: number[] = Array(7).fill(0);
        const auction: number[] = Array(7).fill(0);
        for (let i = 0; i < 7; i++) {
          const { s, e } = days[i];
          for (const a of availability) {
            const ov = overlaps(s, e, new Date(a.start), new Date(a.end));
            if (ov > 0) free[i] += mins(ov);
          }
          for (const sl of slots) {
            const ov = overlaps(s, e, new Date(sl.start), new Date(sl.end));
            if (ov > 0) {
              if (sl.mode === 'EnglishAuction') auction[i] += mins(ov); else fixed[i] += mins(ov);
            }
          }
          // net free cannot be negative if slots exceed availability
          free[i] = Math.max(0, free[i] - (fixed[i] + auction[i]));
        }
        if (!cancelled) setData({ free, fixed, auction });
      } catch { if (!cancelled) setData({ free: Array(7).fill(0), fixed: Array(7).fill(0), auction: Array(7).fill(0) }); }
    }
    load();
    return () => { cancelled = true; };
  }, [publicKey]);

  const percents = useMemo(() => {
    const freeP: number[] = [], fixedP: number[] = [], auctionP: number[] = [];
    for (let i = 0; i < 7; i++) {
      const f = data.free[i] || 0, fx = data.fixed[i] || 0, au = data.auction[i] || 0;
      const total = f + fx + au;
      if (total <= 0) { freeP[i] = 0; fixedP[i] = 0; auctionP[i] = 0; continue; }
      freeP[i] = clamp01(f / total) * 100;
      fixedP[i] = clamp01(fx / total) * 100;
      auctionP[i] = clamp01(au / total) * 100;
    }
    return { freeP, fixedP, auctionP };
  }, [data]);

  return (
    <div className={`infocal ${inView ? 'in' : ''}`} aria-hidden>
      <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          <div className="ico">🗓️</div>
          <div className="stack" style={{ gap: 2 }}>
            <b>Smart calendar</b>
            <span className="muted">Live availability snapshot</span>
          </div>
        </div>
        <div className="row" style={{ gap: 10, alignItems: 'center', opacity: .9 }}>
          <span className="dot fixed" /> <span className="muted" style={{ fontSize: 12 }}>Fixed</span>
          <span className="dot auction" /> <span className="muted" style={{ fontSize: 12 }}>Auction</span>
          <span className="dot avail" /> <span className="muted" style={{ fontSize: 12 }}>Intro Call</span>
        </div>
      </div>
      <div className="grid">
        {dayNames.map((d, i) => (
          <div key={d} className="card">
            <div className="head"><span className="muted" style={{ fontSize: 12 }}>{d}</span></div>
            <div className="track">
              <div className="seg free" style={{ width: `${percents.freeP[i]}%` }} />
              <div className="seg fixed" style={{ width: `${percents.fixedP[i]}%`, left: `${percents.freeP[i]}%` }} />
              <div className="seg auction" style={{ width: `${percents.auctionP[i]}%`, left: `${percents.freeP[i] + percents.fixedP[i]}%` }} />
              <div className="shine" />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .infocal { border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04); border-radius: 16px; padding: 10px 12px; transform: translateY(8px); opacity: 0; transition: transform .5s ease, opacity .5s ease }
        .infocal.in { transform: translateY(0); opacity: 1 }
        .ico { width: 34px; height: 34px; border-radius: 12px; display: inline-flex; align-items:center; justify-content:center; background: rgba(239,132,189,.16); border: 1px solid rgba(239,132,189,.35) }
        .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px }
        .card { border: 1px solid rgba(255,255,255,.10); background:
          radial-gradient(140% 140% at 100% 0%, rgba(59,130,246,.12), transparent 55%),
          rgba(0,0,0,.22);
          border-radius: 12px; padding: 8px; display: grid; gap: 6px; position: relative; overflow: hidden }
        .head { display:flex; align-items:center; justify-content:space-between }
        .track { position: relative; height: 16px; border-radius: 999px; background: rgba(255,255,255,.06); overflow: hidden; box-shadow: inset 0 0 0 1px rgba(255,255,255,.06) }
        .seg { position:absolute; top:3px; height:10px; border-radius:999px }
        .seg.free { left:4px; background: linear-gradient(90deg, rgba(52,211,153,.6), rgba(59,130,246,.5)); box-shadow: 0 4px 16px rgba(59,130,246,.25) }
        .seg.fixed { background: rgba(59,130,246,.65) }
        .seg.auction { background: rgba(239,132,189,.7) }
        .shine { position:absolute; left:-40%; top:0; bottom:0; width: 40%; background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.18), rgba(255,255,255,0)); transform: skewX(-18deg); animation: slide 6s ease-in-out infinite }
        @keyframes slide { 0% { left: -40% } 55% { left: 110% } 100% { left: 110% } }
        .dot { width:10px; height:10px; border-radius:999px; display:inline-block }
        .dot.fixed { background:#60a5fa }
        .dot.auction { background:#f472b6 }
        .dot.avail { background:#34d399 }
        @media (max-width: 960px) { .grid { grid-template-columns: repeat(3, 1fr) } }
        @media (prefers-reduced-motion: reduce) { .shine { animation: none } .infocal { transition: none } }
      `}</style>
    </div>
  );
}

