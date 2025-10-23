"use client";
import { useMemo, useState, useEffect } from 'react';
import styles from '@/app/home.module.css';

export default function SubtleParticles({ count = 14 }: { count?: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nodes = useMemo(() => {
    if (!mounted) return null;
    
    return Array.from({ length: count }).map((_, i) => {
      const size = 3 + Math.round(Math.random() * 6); // 3..9px
      const top = Math.round(Math.random() * 60); // top 60% left area
      const left = Math.round(Math.random() * 46); // within left half
      const delay = (Math.random() * 10).toFixed(2);
      const dur = (12 + Math.random() * 18).toFixed(2);
      const style: any = {
        width: size,
        height: size,
        top: `${top}%`,
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${dur}s`,
      };
      return <span key={i} className={styles.particle} style={style} />;
    });
  }, [count, mounted]);

  if (!mounted) return null;

  return <div className={styles.particlesWrap} aria-hidden>{nodes}</div>;
}

