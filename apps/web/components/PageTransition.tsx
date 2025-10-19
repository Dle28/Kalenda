"use client";
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="page-transition">
      {/* overlay plays on every path change */}
      <div key={`ov-${pathname}`} className="page-swap" aria-hidden />
      {/* content fade-in on mount */}
      <div key={pathname} className="page-enter">{children}</div>
    </div>
  );
}
