"use client";
import Link from 'next/link';
import Countdown from './Countdown';

export default function SlotCard(props: {
  id: string;
  mode: 'Stable' | 'EnglishAuction';
  start: Date;
  end: Date;
  price?: number;
  startPrice?: number;
}) {
  const { id, mode, start, end, price, startPrice } = props;
  const durMin = Math.round((end.getTime() - start.getTime()) / 60000);
  return (
    <div className={`slot ${mode === 'EnglishAuction' ? 'slot-auction' : ''}`}>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div className="stack">
          <b>{new Intl.DateTimeFormat('en-GB',{ year:'numeric', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'UTC' }).format(start)}</b>
          <span className="muted">{durMin} min</span>
        </div>
        {mode === 'Stable' ? (
          <div className="stack" style={{alignItems:'flex-end'}}>
            <span><b>{price} USDC</b></span>
            <Link href={`/slot/${encodeURIComponent(id)}`} className="btn">Book now</Link>
          </div>
        ) : (
          <div className="stack" style={{alignItems:'flex-end'}}>
            <span className="muted">Starting price</span>
            <span><b>{startPrice} USDC</b></span>
            <Countdown to={new Date(start.getTime() + 2 * 60 * 60 * 1000)} />
            <Link href={`/slot/${encodeURIComponent(id)}`} className="btn btn-secondary">Join auction</Link>
          </div>
        )}
      </div>
    </div>
  );
}

