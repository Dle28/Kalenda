"use client";
import { useMemo, useState, useEffect } from 'react';

export type BidEvent = { ts: number; bidder: string; amount: number; walletAddress?: string };

// Simulated demo bidders
const DEMO_BIDDERS = [
  { name: "Alice", wallet: "Abc...xyz" },
  { name: "Bob", wallet: "Def...123" },
  { name: "Charlie", wallet: "Ghi...456" },
  { name: "Diana", wallet: "Jkl...789" },
];

export default function BidRoom(props: {
  startPrice: number;
  bidStep: number;
  currentPrice?: number;
  currency?: 'SOL';
  onPlaceBid?: (amount: number) => Promise<void> | void;
  enableDemoBidding?: boolean; // New prop for demo mode
}) {
  const { startPrice, bidStep, currentPrice, currency = 'SOL', onPlaceBid, enableDemoBidding = false } = props;
  const [maxAutoBid, setMaxAutoBid] = useState<string>('');
  const [log, setLog] = useState<BidEvent[]>([]);
  const [highestBid, setHighestBid] = useState(currentPrice ?? startPrice);
  const [isAutoBidding, setIsAutoBidding] = useState(false);

  const minNext = useMemo(() => {
    return Math.round((highestBid + bidStep) * 1e6) / 1e6;
  }, [highestBid, bidStep]);

  // Demo: Random bidders place bids (auto mode)
  useEffect(() => {
    if (!enableDemoBidding) return;

    const interval = setInterval(() => {
      // 30% chance to place a bid every 3 seconds
      if (Math.random() > 0.7) {
        const bidder = DEMO_BIDDERS[Math.floor(Math.random() * DEMO_BIDDERS.length)];
        const bidAmount = Math.round((highestBid + bidStep + Math.random() * bidStep * 2) * 1e6) / 1e6;
        
        setLog((prev) => [{
          ts: Date.now(),
          bidder: bidder.name,
          amount: bidAmount,
          walletAddress: bidder.wallet
        }, ...prev].slice(0, 50));
        
        setHighestBid(bidAmount);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [enableDemoBidding, highestBid, bidStep]);

  async function placeBid(amount: number, bidderName: string = 'You', wallet?: string) {
    const a = Math.max(amount, minNext);
    
    // Call parent callback if provided
    if (onPlaceBid) {
      await onPlaceBid(a);
    }
    
    setLog((prev) => [{ 
      ts: Date.now(), 
      bidder: bidderName, 
      amount: a,
      walletAddress: wallet 
    }, ...prev].slice(0, 50));
    
    setHighestBid(a);
  }

  const handleQuickBid = () => {
    placeBid(minNext);
  };

  const handleAutoBid = () => {
    const v = Number(maxAutoBid);
    if (!Number.isFinite(v) || v <= minNext) {
      alert(`Auto-bid must be higher than ${minNext} ${currency}`);
      return;
    }
    
    setIsAutoBidding(true);
    placeBid(v);
    
    // Simulate auto-bidding behavior
    setTimeout(() => setIsAutoBidding(false), 2000);
  };

  const handleDemoBid = () => {
    const bidder = DEMO_BIDDERS[Math.floor(Math.random() * DEMO_BIDDERS.length)];
    const bidAmount = Math.round((highestBid + bidStep + Math.random() * bidStep) * 1e6) / 1e6;
    placeBid(bidAmount, bidder.name, bidder.wallet);
  };

  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      {/* Header */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <b style={{ fontSize: 18 }}>🎯 Bid Room</b>
          {isAutoBidding && (
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
              Auto-bidding active
            </span>
          )}
        </div>
        <span className="badge">Step: +{bidStep} {currency}</span>
      </div>

      {/* Current Status */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '12px',
        padding: '16px',
        display: 'grid',
        gap: 12
      }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="muted">Current highest bid</span>
          <b style={{ fontSize: 20, color: '#3b82f6' }}>{highestBid.toFixed(4)} {currency}</b>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="muted">Your minimum bid</span>
          <b style={{ color: '#10b981' }}>{minNext.toFixed(4)} {currency}</b>
        </div>
      </div>

      {/* Bidding Controls */}
      <div style={{ display: 'grid', gap: 10 }}>
        {/* Quick Bid */}
        <button 
          className="btn btn-primary"
          onClick={handleQuickBid}
          style={{ 
            padding: '12px 16px',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          🚀 Quick Bid {minNext.toFixed(3)} {currency}
        </button>

        {/* Auto Bid */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            style={{ flex: 1, padding: '10px 12px' }}
            type="number"
            step={bidStep}
            min={minNext}
            placeholder={`Max auto-bid (min ${minNext} ${currency})`}
            value={maxAutoBid}
            onChange={(e) => setMaxAutoBid(e.target.value)}
          />
          <button
            className="btn btn-secondary"
            onClick={handleAutoBid}
            disabled={!maxAutoBid || Number(maxAutoBid) <= minNext}
            style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
          >
            ⚡ Auto-bid
          </button>
        </div>

        {/* Demo Bidding Button */}
        <div style={{
          borderTop: '1px solid var(--line)',
          paddingTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span className="muted" style={{ fontSize: 13 }}>Demo Mode</span>
            <p className="muted" style={{ fontSize: 11, margin: '4px 0 0 0' }}>
              Simulate other bidders
            </p>
          </div>
          <button
            className="btn btn-outline"
            onClick={handleDemoBid}
            style={{ padding: '8px 16px', fontSize: 14 }}
          >
            🎲 Simulate Random Bid
          </button>
        </div>
      </div>

      {/* Auction Log */}
      <div style={{ 
        borderTop: '1px solid var(--line)', 
        paddingTop: 12,
        marginTop: 8 
      }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <b>📜 Auction History</b>
          <span className="muted" style={{ fontSize: 12 }}>
            {log.length} bid{log.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div style={{ 
          maxHeight: 240, 
          overflow: 'auto', 
          display: 'grid', 
          gap: 8,
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 8,
          padding: log.length > 0 ? 12 : 0,
        }}>
          {log.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: 'var(--muted)' 
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔨</div>
              <span>No bids yet. Be the first!</span>
            </div>
          ) : (
            log.map((e, i) => (
              <div 
                key={i} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: i === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                  borderRadius: 8,
                  border: i === 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ 
                    fontSize: 13, 
                    fontWeight: i === 0 ? 600 : 400,
                    color: i === 0 ? '#10b981' : 'inherit'
                  }}>
                    {e.bidder}
                    {i === 0 && ' 👑'}
                  </span>
                  <span className="muted" style={{ fontSize: 11 }}>
                    {e.walletAddress || 'Connected wallet'} • {new Date(e.ts).toLocaleTimeString()}
                  </span>
                </div>
                <b style={{ 
                  fontSize: 16,
                  color: i === 0 ? '#10b981' : '#3b82f6'
                }}>
                  {e.amount.toFixed(4)} {currency}
                </b>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Footer */}
      <div style={{
        borderTop: '1px solid var(--line)',
        paddingTop: 12,
        fontSize: 12,
        color: 'var(--muted)',
        lineHeight: 1.5
      }}>
        💡 <b>How it works:</b> Auction ends when timer expires. Highest bidder wins the slot. 
        Outbid users get automatic refunds. Use "Auto-bid" to set your max and let the system bid for you.
      </div>
    </div>
  );
}


