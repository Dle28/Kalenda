"use client";
import { useEffect, useState } from 'react';

export default function NextAvailableBadge({ creatorPubkey }: { creatorPubkey: string }) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/availability?creator=${encodeURIComponent(creatorPubkey)}`, { cache: 'no-store' });
        const json = await res.json();
        const list: { start: string; end: string }[] = json.availability || [];
        const now = Date.now();
        const next = list
          .map((x) => ({ s: new Date(x.start), e: new Date(x.end) }))
          .filter((x) => x.e.getTime() > now)
          .sort((a, b) => a.s.getTime() - b.s.getTime())[0];
        if (!next) return setLabel(null);
        const today = new Date();
        const isSameDay = next.s.toDateString() === today.toDateString();
        
        // Fix hydration: use consistent timezone
        const timeStr = new Intl.DateTimeFormat('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true,
          timeZone: 'UTC'
        }).format(next.s);
        
        const dateStr = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC'
        }).format(next.s);
        
        setLabel(isSameDay ? `Available today ${timeStr}` : `Next ${dateStr} ${timeStr}`);
      } catch {}
    };
    load();
  }, [creatorPubkey]);
  if (!label) return null;
  return <span className="chip" title="Next availability">{label}</span>;
}


