"use client";
import TipLeaderboard from '@/components/TipLeaderboard';
import Link from 'next/link';

export default function TipsPage() {
  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: 1200 }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ 
          fontSize: 48, 
          fontWeight: 900, 
          marginBottom: 16,
          background: 'linear-gradient(135deg, #ef84bd, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          💰 Support Your Favorite Creators
        </h1>
        <p style={{ fontSize: 18, opacity: 0.85, maxWidth: 600, margin: '0 auto 24px' }}>
          Send tips directly to creators. 100% goes to them, zero fees, instant transfer on Solana.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/creators" className="btn btn-secondary">
            Browse Creators
          </Link>
          <Link href="/" className="btn btn-outline">
            How It Works
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 48,
      }}>
        <div style={{
          padding: 24,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.04)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>
            29.3 SOL
          </div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>Total Tips Sent</div>
        </div>
        <div style={{
          padding: 24,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.04)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#a78bfa', marginBottom: 8 }}>
            127
          </div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>Tips This Week</div>
        </div>
        <div style={{
          padding: 24,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.04)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#fbbf24', marginBottom: 8 }}>
            43
          </div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>Active Supporters</div>
        </div>
      </div>

      {/* Leaderboard */}
      <TipLeaderboard />

      {/* Features */}
      <div style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
          Why Tip on Kalenda?
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}>
          <div style={{
            padding: 20,
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Instant & Direct</h3>
            <p style={{ fontSize: 14, opacity: 0.7, margin: 0 }}>
              Tips arrive in creator's wallet instantly. No middleman, no delays.
            </p>
          </div>
          <div style={{
            padding: 20,
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💯</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Zero Fees</h3>
            <p style={{ fontSize: 14, opacity: 0.7, margin: 0 }}>
              100% of your tip goes to the creator. We don't take a cut.
            </p>
          </div>
          <div style={{
            padding: 20,
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Secure & Transparent</h3>
            <p style={{ fontSize: 14, opacity: 0.7, margin: 0 }}>
              All transactions on Solana blockchain. Verify anytime on explorer.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        marginTop: 48,
        padding: 32,
        borderRadius: 16,
        border: '1px solid rgba(239,132,189,0.3)',
        background: 'linear-gradient(135deg, rgba(239,132,189,0.1), rgba(167,139,250,0.1))',
        textAlign: 'center',
      }}>
        <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Ready to show your support?
        </h3>
        <p style={{ fontSize: 16, opacity: 0.85, marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
          Browse our amazing creators and tip your favorites today!
        </p>
        <Link href="/creators" className="btn btn-secondary" style={{ fontSize: 16, padding: '12px 24px' }}>
          Browse All Creators →
        </Link>
      </div>
    </div>
  );
}
