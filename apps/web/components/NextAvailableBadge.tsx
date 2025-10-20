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
        setLabel(isSameDay ? `Available today ${next.s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : `Next ${next.s.toLocaleDateString()} ${next.s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } catch {}
    };
    load();
  }, [creatorPubkey]);
  if (!label) return null;
  return <span className="chip" title="Next availability">{label}</span>;
}

