"use client";
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { creators, slots } from '@/lib/mock';
import styles from './home.module.css';
import FloatingBadges from '@/components/FloatingBadges';
import SubtleParticles from '@/components/SubtleParticles';
import Spotlight from '@/components/Spotlight';
import Testimonials from '@/components/Testimonials';
import EventsStrip from '@/components/EventsStrip';
import ScrollEffects from '@/components/ScrollEffects';
import UpcomingAppointments from '@/components/UpcomingAppointments';
import { summarizeSlotsByCreator } from '@/lib/slotSummary';

export default function Page() {
  const enrichedCreators = useMemo(() => {
    const index = summarizeSlotsByCreator(slots as any);
    return (creators as any[]).map((c: any) => ({
      ...c,
      saleSummary: index[c.pubkey] ?? null,
    }));
  }, []);

  const allCategories = useMemo(() => {
    const s = new Set<string>();
    enrichedCreators.forEach((c: any) => (c.fields || []).forEach((f: string) => s.add(f)));
    return ['All', ...Array.from(s)];
  }, [enrichedCreators]);

  const [cat, setCat] = useState<string>('All');
  const filtered = useMemo(() => {
    if (cat === 'All') return enrichedCreators;
    return enrichedCreators.filter((c: any) => (c.fields || []).includes(cat));
  }, [cat, enrichedCreators]);

  const featured = filtered.slice(0, 8);
  const leftItems = featured.filter((_, i) => i % 2 === 0);
  const rightItems = featured.filter((_, i) => i % 2 === 1);

  const topWeek = useMemo(() => {
    return [...enrichedCreators]
      .sort((a: any, b: any) => Number(b.rating || 0) - Number(a.rating || 0))
      .slice(0, 6);
  }, [enrichedCreators]);

  return (
    <>
      <ScrollEffects />
      <section className={styles.wrap}>
        <div className="container">
          <div className={styles.hero}>
            <div className={styles.left}>
              <h1 className={styles.heading}>TIME IS MONEY.</h1>
              <p className={styles.sub}>Get instant access to and invest in your favorite creators & experts.</p>
              <div className="cta">
                <Link className="btn btn-secondary" href="/creators">Explore creators</Link>
                <Link className="btn btn-outline" href="/creator/onboard">Get paid for your time</Link>
              </div>
              <SubtleParticles />
            </div>

            <div className={styles.right}>
              <div className={`${styles.col} ${styles.colLeft}`}>
                <div className={styles.track}>
                  {[0, 1].map((dup) => (
                    leftItems.map((c: any, idx: number) => (
                      <Link key={`L-${dup}-${idx}-${c.pubkey}`} href={`/creator/${encodeURIComponent(c.pubkey)}`} className={styles.tile} data-reveal data-float="0.02">
                        <div className={styles.media} style={{ backgroundImage: `url(${c.avatar || 'https://placehold.co/600x800'})` }} />
                        <div className={styles.overlay}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <b>{c.name}</b>
                          </div>
                          {c.saleSummary?.headline && (
                            <div className="muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.saleSummary.headline}</div>
                          )}
                          {c.saleSummary?.window ? (
                            <div className="muted" style={{ fontSize: 12 }}>{c.saleSummary.window}</div>
                          ) : (
                            c.bio && (
                              <div className="muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.bio}</div>
                            )
                          )}
                        </div>
                      </Link>
                    ))
                  ))}
                </div>
              </div>

              <div className={`${styles.col} ${styles.colRight}`}>
                <div className={styles.track}>
                  {[0, 1].map((dup) => (
                    rightItems.map((c: any, idx: number) => (
                      <Link key={`R-${dup}-${idx}-${c.pubkey}`} href={`/creator/${encodeURIComponent(c.pubkey)}`} className={styles.tile} data-reveal data-float="0.02">
                        <div className={styles.media} style={{ backgroundImage: `url(${c.avatar || 'https://placehold.co/600x800'})` }} />
                        <div className={styles.overlay}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <b>{c.name}</b>
                          </div>
                          {c.saleSummary?.headline && (
                            <div className="muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.saleSummary.headline}</div>
                          )}
                          {c.saleSummary?.window ? (
                            <div className="muted" style={{ fontSize: 12 }}>{c.saleSummary.window}</div>
                          ) : (
                            c.bio && (
                              <div className="muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.bio}</div>
                            )
                          )}
                        </div>
                      </Link>
                    ))
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <FloatingBadges />

        {/* Upcoming Appointments Section */}
        <div className="container">
          <UpcomingAppointments slots={slots} creators={enrichedCreators} />
        </div>

        {/* Below-hero sections */}
        <section className={styles.below}>
          <div className="container">
            <div className={styles.belowGrid}>
              <div className={styles.belowMain}>
                <Spotlight list={enrichedCreators as any} intervalMs={9000} />
                <div className={styles.filters}>
                  {allCategories.map((f) => (
                    <button key={f} className="chip" onClick={() => setCat(f)} style={{ background: cat === f ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#e5e7eb' }}>{f}</button>
                  ))}
                </div>
                <div className={styles.how}>
                  <div className={styles.step}>
                    <div className={styles.stepIcon}>1</div>
                    <div className={styles.stepText}>
                      <b>Select a creator</b>
                      <span className="muted">View pricing, availability, and reviews</span>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepIcon}>2</div>
                    <div className={styles.stepText}>
                      <b>Book & pay</b>
                      <span className="muted">Secure your spot with USDC</span>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepIcon}>3</div>
                    <div className={styles.stepText}>
                      <b>Meet & get materials</b>
                      <span className="muted">Join the call and receive follow-ups</span>
                    </div>
                  </div>
                </div>
              </div>
              <aside className={styles.belowSide}>
                <div className={styles.miniHeader}>Top Week</div>
                <div className={styles.miniList}>
                  {(topWeek as any[]).map((c: any) => (
                    <Link key={c.pubkey} href={`/creator/${encodeURIComponent(c.pubkey)}`} className={styles.miniItem}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.avatar || 'https://placehold.co/64x64'} alt={c.name} width={36} height={36} />
                      <div className={styles.miniMeta}>
                        <b className="one-line" title={c.name}>{c.name}</b>
                        <span className="muted">* {Number(c.rating || 0).toFixed(1)} - {c.saleSummary?.headline || 'Schedule coming soon'}</span>
                      </div>
                      <span className="muted" style={{ fontSize: 12 }}>{c.saleSummary?.window || 'Waiting for next slot'}</span>
                    </Link>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <Testimonials />
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
    </>
  );
}

