"use client";
import { useEffect, useState } from 'react';

export default function TimezoneSelector({ value, onChange }:{ value?: string; onChange: (tz: string) => void }) {
  const [tzs, setTzs] = useState<string[]>([]);
  useEffect(() => {
    try {
      // a small curated list instead of the full IANA set
      setTzs([
        'UTC',
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        'Asia/Ho_Chi_Minh',
        'Asia/Bangkok',
        'Asia/Singapore',
        'Asia/Tokyo',
        'Europe/Berlin',
        'America/New_York',
      ].filter((v, i, a) => !!v && a.indexOf(v) === i));
    } catch {}
  }, []);
  return (
    <div className="tz">
      <label className="muted" style={{fontSize:12, display:'block', marginBottom:4}}>Múi giờ</label>
      <select value={value} onChange={(e)=>onChange(e.target.value)} style={{padding:8, borderRadius:8, background:'rgba(255,255,255,.05)', color:'white', border:'1px solid rgba(255,255,255,.1)'}}>
        {tzs.map(t => (<option key={t} value={t}>{t}</option>))}
      </select>
    </div>
  );
}


