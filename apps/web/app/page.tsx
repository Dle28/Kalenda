"use client";
import Link from 'next/link';
import { creators } from '@/lib/mock';
import styles from './home.module.css';
import FloatingBadges from '@/components/FloatingBadges';
import { useMemo, useState } from 'react';
import SubtleParticles from '@/components/SubtleParticles';
import Spotlight from '@/components/Spotlight';
import Testimonials from '@/components/Testimonials';
import EventsStrip from '@/components/EventsStrip';

export default function Page() {
  const allCategories = useMemo(() => {
    const s = new Set<string>();
    creators.forEach((c: any) => (c.fields || []).forEach((f: string) => s.add(f)));
    return ['All', ...Array.from(s)];
  }, []);
  const [cat, setCat] = useState<string>('All');
  const filtered = useMemo(() => {
    if (cat === 'All') return creators;
    return creators.filter((c: any) => (c.fields || []).includes(cat));
  }, [cat]);
  const featured = filtered.slice(0, 8);
  const leftItems = featured.filter((_, i) => i % 2 === 0);
  const rightItems = featured.filter((_, i) => i % 2 === 1);
  const topWeek = useMemo(() => {
    return [...creators]
      .sort((a: any, b: any) => (Number(b.rating||0) - Number(a.rating||0)) || (Number(b.trend||0) - Number(a.trend||0)))
      .slice(0, 6);
  }, []);
  return (
    <section className={styles.wrap}>
      <div className="container">
        <div className={styles.hero}>
          <div className={styles.left}>
            <h1 className={styles.heading}>TIME IS MONEY.</h1>
            <p className={styles.sub}>
              Get instant access to and invest in your favorite creators & experts.
            </p>
            <div className="cta">
              <Link className="btn btn-secondary" href="/creators">Explore creators</Link>
              <Link className="btn btn-outline" href="/creator/onboard">Get paid for your time</Link>
            </div>

            {/* Creator spotlight */}
            <Spotlight list={creators as any} intervalMs={7000} />

            {/* Category chips */}
            <div className={styles.filters}>
              {allCategories.map((f) => (
                <button
                  key={f}
                  className="chip"
                  onClick={() => setCat(f)}
                  style={{
                    background: cat === f ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.06)',
                    border: '1px solid rgba(255,255,255,.12)',
                    color: '#e5e7eb',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* How it works */}
            <div className={styles.how}>
              <div className={styles.step}>
                <div className={styles.stepIcon}>1</div>
                <div className={styles.stepText}>
                  <b>Chọn creator</b>
                  <span className="muted">Xem giá, lịch trống, đánh giá</span>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepIcon}>2</div>
                <div className={styles.stepText}>
                  <b>Đặt lịch & thanh toán</b>
                  <span className="muted">Giữ chỗ an toàn bằng USDC</span>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepIcon}>3</div>
                <div className={styles.stepText}>
                  <b>Gặp gỡ & nhận tài liệu</b>
                  <span className="muted">Kết nối video, tài liệu sau buổi</span>
                </div>
              </div>
            </div>
            <SubtleParticles />
          </div>

          <div className={styles.right}>
            {/* Left scrolling column */}
            <div className={`${styles.col} ${styles.colLeft}`}>
              <div className={styles.track}>
                {[0, 1].map((dup) => (
                  leftItems.map((c, idx) => (
                    <div key={`L-${dup}-${idx}-${c.pubkey}`} className={styles.tile}>
                      <div
                        className={styles.media}
                        style={{ backgroundImage: `url(${c.avatar || 'https://placehold.co/600x800'})` }}
                      />
                      <div className={styles.overlay}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <b>{c.name}</b>
                          {typeof c.pricePerSlot === 'number' && (
                            <span>
                              ${c.pricePerSlot.toFixed(2)} <span className="muted">/ min</span>
                            </span>
                          )}
                        </div>
                        {c.bio && (
                          <div className="muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.bio}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ))}
              </div>
            </div>

            {/* Right scrolling column (staggered) */}
            <div className={`${styles.col} ${styles.colRight}`}>
              <div className={styles.track}>
                {[0, 1].map((dup) => (
                  rightItems.map((c, idx) => (
                    <div key={`R-${dup}-${idx}-${c.pubkey}`} className={styles.tile}>
                      <div
                        className={styles.media}
                        style={{ backgroundImage: `url(${c.avatar || 'https://placehold.co/600x800'})` }}
                      />
                      <div className={styles.overlay}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <b>{c.name}</b>
                          {typeof c.pricePerSlot === 'number' && (
                            <span>
                              ${c.pricePerSlot.toFixed(2)} <span className="muted">/ min</span>
                            </span>
                          )}
                        </div>
                        {c.bio && (
                          <div className="muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.bio}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ))}
              </div>
            </div>

            {/* Mini Top Week column */}
            <div className={`${styles.col} ${styles.colMini}`}>
              <div className={styles.miniHeader}>Top week</div>
              <div className={styles.miniList}>
                {topWeek.map((c: any) => (
                  <Link key={c.pubkey} href={`/creator/${encodeURIComponent(c.pubkey)}`} className={styles.miniItem}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.avatar || 'https://placehold.co/64x64'} alt={c.name} width={36} height={36} />
                    <div className={styles.miniMeta}>
                      <b className="one-line" title={c.name}>{c.name}</b>
                      <span className="muted">★ {Number(c.rating || 0).toFixed(1)} · {typeof c.pricePerSlot==='number' ? `$${c.pricePerSlot.toFixed(2)}/min` : '—'}</span>
                    </div>
                    <span className={Number(c.trend||0) >= 0 ? styles.pos : styles.neg}>{Number(c.trend||0) >= 0 ? '+' : ''}{Number(c.trend||0).toFixed(2)}%</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <FloatingBadges />

      {/* Testimonials under hero */}
      <Testimonials />

      {/* Events / Workshops strip */}
      <EventsStrip />
      <footer className={styles.footer}>
        <div className="container" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <Link href="/terms" className="link">Terms</Link>
            <Link href="/faq" className="link">FAQs</Link>
            <Link href="/refund" className="link">Refund policy</Link>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <a className="link" href="https://discord.gg" target="_blank" rel="noreferrer">Discord</a>
            <a className="link" href="https://x.com" target="_blank" rel="noreferrer">Twitter/X</a>
          </div>
        </div>
      </footer>
    </section>
  );
}
