"use client";
import Link from "next/link";
import { slots, creators } from '@/lib/mock';
import styles from '@/app/home.module.css';

// Fix hydration: use consistent timezone
function fmt(d: Date) { 
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC'
  }).format(d); 
}

export default function EventsStrip() {
  const now = Date.now();
  const upcoming = slots
    .filter((s)=> new Date(s.start).getTime() > now)
    .sort((a,b)=> new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0,3);
  if (!upcoming.length) return null;
  return (
    <section className={styles.events}>
      <div className="container">
        <div className={styles.eventsGrid}>
          {upcoming.map((s)=>{
            const c = (creators as any).find((x:any)=> x.pubkey===s.creator);
            return (
              <Link key={s.id} href={`/slot/${encodeURIComponent(s.id)}`} className={styles.eventCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c?.avatar || 'https://placehold.co/160'} alt={c?.name||'creator'} width={56} height={56} />
                <div className={styles.eventBody}>
                  <b className="one-line">{c?.name || 'Creator'}</b>
                  <span className="muted">{fmt(new Date(s.start))}</span>
                  <span className={styles.badgeMode}>{s.mode==='Stable' ? 'Fixed' : 'Auction'}</span>
                </div>
                <span className={styles.eventCta}>Reserve</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

