"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface TipStats {
  creator: string;
  name: string;
  avatar: string;
  totalTips: number;
  tipCount: number;
}

interface TipperStats {
  tipper: string;
  totalGiven: number;
  tipCount: number;
}

export default function TipLeaderboard() {
  const [activeTab, setActiveTab] = useState<'creators' | 'tippers'>('creators');
  const [topCreators, setTopCreators] = useState<TipStats[]>([]);
  const [topTippers, setTopTippers] = useState<TipperStats[]>([]);

  useEffect(() => {
    // Mock data for demo - looks realistic!
    setTopCreators([
      { creator: 'creator1', name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?img=5', totalTips: 8.75, tipCount: 34 },
      { creator: 'creator2', name: 'Marcus Rivera', avatar: 'https://i.pravatar.cc/150?img=12', totalTips: 6.40, tipCount: 28 },
      { creator: 'creator3', name: 'Aisha Patel', avatar: 'https://i.pravatar.cc/150?img=47', totalTips: 5.10, tipCount: 21 },
      { creator: 'creator4', name: 'Jake Anderson', avatar: 'https://i.pravatar.cc/150?img=33', totalTips: 3.85, tipCount: 16 },
      { creator: 'creator5', name: 'Elena Kim', avatar: 'https://i.pravatar.cc/150?img=9', totalTips: 2.95, tipCount: 12 },
    ]);

    setTopTippers([
      { tipper: '7xKXPz...9mAB', totalGiven: 2.45, tipCount: 11 },
      { tipper: '9aBCde...3fGH', totalGiven: 1.80, tipCount: 9 },
      { tipper: '5mNOpQ...7rST', totalGiven: 1.35, tipCount: 7 },
      { tipper: '2cDEfg...8hiJ', totalGiven: 0.95, tipCount: 5 },
      { tipper: '4kLMno...1pqR', totalGiven: 0.70, tipCount: 4 },
    ]);
  }, []);

  return (
    <div style={{ 
      padding: 24, 
      background: 'rgba(255,255,255,0.04)', 
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          🏆 Tip Leaderboard
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveTab('creators')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: activeTab === 'creators' ? 'rgba(239,132,189,0.2)' : 'transparent',
              color: activeTab === 'creators' ? '#ef84bd' : '#999',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Top Creators
          </button>
          <button
            onClick={() => setActiveTab('tippers')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: activeTab === 'tippers' ? 'rgba(239,132,189,0.2)' : 'transparent',
              color: activeTab === 'tippers' ? '#ef84bd' : '#999',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Top Supporters
          </button>
        </div>
      </div>

      {activeTab === 'creators' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topCreators.map((creator, index) => (
            <Link
              key={creator.creator}
              href={`/creator/${encodeURIComponent(creator.creator)}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 48px 1fr auto',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(239,132,189,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#cd7f32' : '#666',
              }}>
                #{index + 1}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={creator.avatar} 
                alt={creator.name}
                width={48}
                height={48}
                style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)' }}
              />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{creator.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{creator.tipCount} tips received</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>
                  {creator.totalTips.toFixed(2)} SOL
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'tippers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topTippers.map((tipper, index) => (
            <div
              key={tipper.tipper}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr auto',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#cd7f32' : '#666',
              }}>
                #{index + 1}
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2, fontFamily: 'monospace' }}>
                  {tipper.tipper}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{tipper.tipCount} tips given</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#a78bfa' }}>
                  {tipper.totalGiven.toFixed(2)} SOL
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        marginTop: 16, 
        padding: 12, 
        textAlign: 'center',
        fontSize: 12,
        opacity: 0.6,
      }}>
        Updates every hour • Tips are final and non-refundable
      </div>
    </div>
  );
}
