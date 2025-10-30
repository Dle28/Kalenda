'use client';
import { useState } from 'react';
import BidRoom from '@/components/BidRoom';
import PaymentBox from '@/components/PaymentBox';
import TicketPanel from '@/components/TicketPanel';
import Countdown from '@/components/Countdown';
import FakeReserveButton from '@/components/FakeReserveButton';
import { useSlot } from '../../../lib/hooks';

export default function SlotPage({ params }: { params: { id: string } }) {
  const decodedId = decodeURIComponent(params.id);
  const s = useSlot(decodedId);
  const [currentBid, setCurrentBid] = useState<number | null>(null);
  
  const durMin = s ? Math.round((new Date(s.end).getTime() - new Date(s.start).getTime()) / 60000) : 0;
  
  if (!s)
    return (
      <section className="slot-wrap">
        <div className="container">
          <div className="card">Slot not found.</div>
        </div>
      </section>
    );
    
  const start = new Date(s.start);
  const end = new Date(s.end);
  const label = `${start.toLocaleString()} - ${end.toLocaleTimeString()} (${durMin} min)`;
  const basePrice = s.mode === 'EnglishAuction' ? s.startPrice ?? 0 : s.price ?? 0;
  const displayPrice = currentBid ?? basePrice;

  return (
    <section className="slot-wrap">
      <div className="container two-col">
        <div className="panel">
          <h1 className="title" style={{ fontSize: 28 }}>Slot</h1>
          <span className="muted">Creator: {s.creator.slice(0, 6)}...{s.creator.slice(-4)}</span>
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b>{s.mode === 'EnglishAuction' ? 'Auction' : 'Fixed price'}</b>
              <span className="badge">{durMin} min</span>
            </div>
            <div className="stack" style={{ gap: 6 }}>
              <span className="muted">{label}</span>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">{s.mode === 'EnglishAuction' ? 'Starting price' : 'Price'}</span>
                <b>{basePrice} SOL</b>
              </div>
              {s.mode === 'EnglishAuction' && currentBid && (
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="muted">Current bid</span>
                  <b style={{ color: 'var(--primary)' }}>{currentBid.toFixed(3)} SOL</b>
                </div>
              )}
              {s.mode === 'EnglishAuction' && (
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="muted">Ends in</span>
                  <b><Countdown to={end} /></b>
                </div>
              )}
            </div>
          </div>

          {s.mode === 'EnglishAuction' ? (
            <BidRoom 
              startPrice={s.startPrice ?? 0} 
              bidStep={0.01} 
              currency="SOL"
              enableDemoBidding={false}
              onBidChange={setCurrentBid}
            />
          ) : (
            <div className="card" style={{ display: 'grid', gap: 10 }}>
              <b>Reserve</b>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">Total minutes</span>
                <span>{durMin}</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">Price</span>
                <b>{s.price ?? 0} SOL</b>
              </div>
              <FakeReserveButton slotId={decodedId} price={s.price ?? 0} duration={durMin} />
            </div>
          )}
        </div>
        <div className="panel">
          <PaymentBox baseAmount={displayPrice} />
          <TicketPanel slotId={decodedId} creator={s.creator} nftMint={(s as any).nftMint} nftUri={(s as any).nftUri} />
        </div>
      </div>
    </section>
  );
}
