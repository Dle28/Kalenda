"use client";
import Link from 'next/link';
import Countdown from './Countdown';
import type { Slot } from '@/lib/mock';

export default function SlotCard({ slot, fallbackPrice }: { slot: Slot; fallbackPrice?: number }) {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  const isAuction = slot.mode === 'EnglishAuction';
  const price = isAuction ? (slot.startPrice ?? 0) : (slot.price ?? fallbackPrice ?? 0);
  const dateLabel = `${start.toLocaleDateString()} @ ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const durMin = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));

  return (
    <div className={`day ${isAuction ? 'slot-auction' : ''}`}>
      <div className="stack" style={{ gap: 6 }}>
        <b>{dateLabel}</b>
        <span className="muted">{durMin} min • {isAuction ? 'Auction' : 'Fixed price'}</span>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="badge">{isAuction ? `Start ${price} USDC` : `${price} USDC`}</span>
          <Link href={`/slot/${encodeURIComponent(slot.id)}`} className={isAuction ? 'btn btn-outline' : 'btn btn-secondary'} style={{ padding: '6px 10px' }}>
            {isAuction ? 'Join auction' : 'Book now'}
          </Link>
        </div>
        {isAuction && (
          <span className="muted" title={`Ends at ${end.toLocaleTimeString()}`}>
            <Countdown to={end} />
          </span>
        )}
      </div>
    </div>
  );
}
