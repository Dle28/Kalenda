"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

type ProfileStatus = {
  status: 'new' | 'incomplete' | 'complete';
  percentage: number;
  profile?: any;
};

export default function CombinedHeaderProfile() {
  const { publicKey, connected } = useWallet();
  const base58 = publicKey?.toBase58();
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!base58) {
        setProfileStatus(null);
        return;
      }
      
      setLoading(true);
      try {
        const res = await fetch(`/api/creator/status?pubkey=${encodeURIComponent(base58)}`, { cache: 'no-store' });
        const json = await res.json();
        if (!active) return;
        setProfileStatus({
          status: json.status || 'new',
          percentage: json.percentage || 0,
          profile: json.profile
        });
      } catch (err) {
        console.error('Failed to load profile status:', err);
        if (active) setProfileStatus(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false };
  }, [base58]);

  const avatar = profileStatus?.profile?.avatar;
  const name = profileStatus?.profile?.name;

  const initials = useMemo(() => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (!base58) return "MP";
    return `${base58.slice(0, 2)}`.toUpperCase();
  }, [base58, name]);

  // Determine button style based on status
  const getButtonStyle = () => {
    if (!connected) {
      return {
        background: 'rgba(148,163,184,0.12)',
        border: '1px solid rgba(148,163,184,0.24)',
        color: '#e2e8f0'
      };
    }
    if (profileStatus?.status === 'complete') {
      return {
        background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.15))',
        border: '1px solid rgba(34,197,94,0.4)',
        color: '#86efac'
      };
    }
    if (profileStatus?.status === 'incomplete') {
      return {
        background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.15))',
        border: '1px solid rgba(251,191,36,0.4)',
        color: '#fcd34d'
      };
    }
    // new or loading
    return {
      background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(168,85,247,0.15))',
      border: '1px solid rgba(96,165,250,0.4)',
      color: '#93c5fd'
    };
  };

  const getLabel = () => {
    if (!connected) return 'Get Started';
    if (loading) return 'Loading...';
    if (profileStatus?.status === 'complete') return name || 'Dashboard';
    if (profileStatus?.status === 'incomplete') return `Setup ${profileStatus.percentage}%`;
    return 'Setup Profile';
  };

  const buttonStyle = getButtonStyle();

  return (
    <Link 
      href="/profile" 
      className="header-profile-btn"
      style={{ 
        padding: '6px 12px', 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: 8,
        borderRadius: 12,
        transition: 'all 0.2s ease',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'hidden',
        ...buttonStyle
      }}
    >
      {/* Progress indicator for incomplete profiles */}
      {profileStatus?.status === 'incomplete' && (
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 2,
            background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
            width: `${profileStatus.percentage}%`,
            transition: 'width 0.3s ease'
          }}
        />
      )}

      {/* Avatar/Icon */}
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,.12)',
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: avatar ? 'transparent' : 'linear-gradient(135deg, rgba(96,165,250,.25), rgba(168,85,247,.25))',
          color: '#f8fafc',
          fontWeight: 600,
          fontSize: 11,
          flexShrink: 0
        }}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={avatar} 
            alt="avatar" 
            width={28} 
            height={28} 
            style={{ width: 28, height: 28, objectFit: 'cover' }} 
          />
        ) : (
          <>{initials}</>
        )}
      </span>

      {/* Label */}
      <span style={{ fontWeight: 500, fontSize: 14 }}>
        {getLabel()}
      </span>

      {/* Badge for incomplete status */}
      {profileStatus?.status === 'incomplete' && (
        <span 
          style={{
            fontSize: 10,
            background: 'rgba(251,191,36,0.2)',
            color: '#fcd34d',
            padding: '2px 6px',
            borderRadius: 6,
            fontWeight: 600
          }}
        >
          !
        </span>
      )}

      <style jsx>{`
        .header-profile-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .header-profile-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </Link>
  );
}


