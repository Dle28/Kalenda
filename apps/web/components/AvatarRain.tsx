"use client";
import React from 'react';

export default function AvatarRain({ image, count = 24, forceMotion = true }: { image?: string; count?: number; forceMotion?: boolean }) {
  const img = image || 'https://placehold.co/100x100?text=User';
  const drops = Array.from({ length: count }).map((_, i) => {
    const left = Math.round(Math.random() * 100);
    const size = Math.round(14 + Math.random() * 22); // 14..36 (smaller)
    const dur = +(20 + Math.random() * 14).toFixed(1); // 20..34s (slower)
    const delay = +(-Math.random() * dur).toFixed(2); // negative to desync
    const rot = Math.round((Math.random() * 28) - 14); // -14..14deg (subtle)
    const opacity = (0.08 + Math.random() * 0.14).toFixed(2); // 0.08..0.22 (lighter)
    return (
      <div
        key={i}
        className="avatar-drop"
        style={{
          left: `${left}%`,
          ['--size' as any]: `${size}px`,
          ['--dur' as any]: `${dur}s`,
          ['--delay' as any]: `${delay}s`,
          ['--rot' as any]: `${rot}deg`,
          opacity: Number(opacity),
          backgroundImage: `url(${img})`,
        }}
      />
    );
  });
  return <div className={`avatar-rain${forceMotion ? ' motion-allow' : ''}`} aria-hidden>{drops}</div>;
}

