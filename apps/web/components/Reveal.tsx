"use client";
import { useEffect, useRef, useState } from 'react';

export default function Reveal({ children, as: As = 'div', delay = 0, className = '', ...rest }: any) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => setInView(true), delay);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  const cls = `reveal ${inView ? 'in' : ''} ${className}`.trim();
  return <As ref={ref as any} className={cls} {...rest}>{children}</As>;
}


