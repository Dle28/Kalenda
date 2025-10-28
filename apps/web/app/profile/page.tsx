"use client";
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ProfileStatus = {
  status: 'new' | 'incomplete' | 'complete';
  percentage: number;
  completed: number;
  total: number;
  checks: {
    hasName: boolean;
    hasBio: boolean;
    hasSessionTitle: boolean;
    hasSessionDescription: boolean;
    hasAvailability: boolean;
    hasPricing: boolean;
    hasAvatar: boolean;
  };
  nextStep: string;
};

export default function MyProfilePage() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const pubkey = publicKey?.toBase58();
  
  const [loading, setLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);

  useEffect(() => {
    if (!pubkey) {
      setLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/creator/status?pubkey=${encodeURIComponent(pubkey)}`, { cache: 'no-store' });
        const data = await res.json();
        setProfileStatus(data);
        
        // Auto-redirect based on profile status
        if (data.status === 'complete') {
          // Profile is complete, go to dashboard
          setTimeout(() => router.replace('/creator/dashboard'), 800);
        } else if (data.status === 'incomplete') {
          // Profile started but not complete, resume onboarding
          setTimeout(() => router.replace(data.nextStep), 800);
        }
        // If 'new', stay here to show onboarding prompt
      } catch (err) {
        console.error('Failed to check status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [pubkey, router]);

  if (loading) {
    return (
      <section className="container page-enter" style={{ maxWidth: 720, textAlign: 'center', padding: '60px 20px' }}>
        <div className="spinner" style={{ margin: '0 auto 20px' }} />
        <p className="muted">Loading your profile...</p>
      </section>
    );
  }

  if (!pubkey) {
    return (
      <section className="container page-enter" style={{ maxWidth: 720, padding: '60px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>👋</div>
          <h1 className="title" style={{ fontSize: 32, marginBottom: 12 }}>Welcome to Your Profile</h1>
          <p className="muted" style={{ fontSize: 16 }}>
            Connect your wallet to set up your creator profile and start earning
          </p>
        </div>
        
        <div className="card" style={{ padding: 24, textAlign: 'center', background: 'linear-gradient(135deg, rgba(96,165,250,0.05), rgba(168,85,247,0.05))' }}>
          <p className="muted" style={{ marginBottom: 16 }}>
            Once connected, you can:
          </p>
          <ul style={{ textAlign: 'left', maxWidth: 400, margin: '0 auto', lineHeight: 2 }}>
            <li>✨ Create your creator profile</li>
            <li>📅 Set your availability</li>
            <li>💰 List time slots for sale</li>
            <li>🎯 Manage bookings and earnings</li>
          </ul>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link href="/creators" className="btn btn-outline" style={{ padding: '10px 20px' }}>
            Explore Creators →
          </Link>
        </div>
      </section>
    );
  }

  // Profile status is 'new' - show onboarding prompt
  return (
    <section className="container page-enter" style={{ maxWidth: 720, padding: '60px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🚀</div>
        <h1 className="title" style={{ fontSize: 36, marginBottom: 16, background: 'linear-gradient(135deg, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Ready to Get Started?
        </h1>
        <p className="muted" style={{ fontSize: 18, lineHeight: 1.6 }}>
          Set up your creator profile in minutes and start selling your time on Solana
        </p>
      </div>

      {profileStatus?.status === 'incomplete' && (
        <div className="card" style={{ padding: 20, marginBottom: 24, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)' }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <b>Profile {profileStatus.percentage}% complete</b>
            <span className="badge">{profileStatus.completed} / {profileStatus.total}</span>
          </div>
          <div style={{ background: 'rgba(148,163,184,0.1)', borderRadius: 999, height: 8, overflow: 'hidden', marginBottom: 12 }}>
            <div 
              style={{ 
                height: '100%', 
                background: 'linear-gradient(90deg, #60a5fa, #a855f7)', 
                width: `${profileStatus.percentage}%`,
                transition: 'width 0.3s ease',
                borderRadius: 999
              }} 
            />
          </div>
          <p className="muted" style={{ fontSize: 14 }}>
            Redirecting to continue setup...
          </p>
        </div>
      )}

      <div className="card" style={{ padding: 32, marginBottom: 24 }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 32 }}>👤</div>
            <div>
              <b style={{ display: 'block', marginBottom: 4 }}>Create your profile</b>
              <p className="muted" style={{ fontSize: 14 }}>Share your expertise, bio, and what you offer</p>
            </div>
          </div>

          <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 32 }}>📅</div>
            <div>
              <b style={{ display: 'block', marginBottom: 4 }}>Set availability</b>
              <p className="muted" style={{ fontSize: 14 }}>Define your weekly schedule and pricing</p>
            </div>
          </div>

          <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 32 }}>💎</div>
            <div>
              <b style={{ display: 'block', marginBottom: 4 }}>List your slots</b>
              <p className="muted" style={{ fontSize: 14 }}>Create time slots with fixed prices or auctions</p>
            </div>
          </div>

          <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 32 }}>📈</div>
            <div>
              <b style={{ display: 'block', marginBottom: 4 }}>Manage & earn</b>
              <p className="muted" style={{ fontSize: 14 }}>Track bookings, earnings, and grow your presence</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link 
          href="/creator/onboard" 
          className="btn btn-primary" 
          style={{ padding: '14px 36px', fontSize: 18, marginBottom: 16 }}
        >
          🎯 Start Setup (5 min)
        </Link>
        <div>
          <Link href="/creators" className="btn btn-outline" style={{ padding: '10px 20px' }}>
            Browse Creators First
          </Link>
        </div>
      </div>

      <style>{`
        .spinner {
          border: 3px solid rgba(148,163,184,0.2);
          border-top-color: #60a5fa;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}

