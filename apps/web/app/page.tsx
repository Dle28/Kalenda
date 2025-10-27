"use client";
import Link from 'next/link';
import { useMemo } from 'react';
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
import CalendarInfographic from '@/components/CalendarInfographic';
import GlobalConnectInfographic from '../components/GlobalConnectInfographic';

export default function Page() {
  const heroStats = [
    { label: 'Hours booked this week', value: '1,284h' },
    { label: 'Avg. creator rating', value: '4.8 / 5' },
    { label: 'Instant confirmations', value: '3.2k' },
  ];

  const heroSessions = [
    { city: 'Tokyo', label: 'Storyboard critique', time: 'Today · 18:30 JST', price: '42 USDC' },
    { city: 'Berlin', label: 'Lighting masterclass', time: 'Today · 20:00 CET', price: '55 USDC' },
    { city: 'New York', label: 'Investor AMA', time: 'Tomorrow · 10:00 EST', price: '68 USDC' },
  ];

  const enrichedCreators = useMemo(() => {
    const index = summarizeSlotsByCreator(slots as any);
    return (creators as any[]).map((c: any) => ({
      ...c,
      saleSummary: index[c.pubkey] ?? null,
    }));
  }, []);

  const filtered = useMemo(() => enrichedCreators, [enrichedCreators]);

  const topWeek = useMemo(() => {
    return [...(creators as any[])]
      .sort((a: any, b: any) => Number(b.rating || 0) - Number(a.rating || 0))
      .slice(0, 6);
  }, []);

  return (
    <>
      <ScrollEffects />
      <section className={styles.wrap}>
        <FloatingBadges values={[72, 49, 58, 38]} />
        <div className={styles.heroShell}>
          <div className={styles.hero}>
            <div className={styles.left}>
              <div className={styles.superTitle}>Creators everywhere</div>
              <h1 className={styles.heading}>Time is money.</h1>
              <p className={styles.sub}>Build your schedule around verified creators and collect high-impact sessions without time zone headaches.</p>
              <div className={styles.heroChecklist}>
                <div>Guaranteed calendar sync &amp; on-chain escrow</div>
                <div>Live availability across 14+ timezones</div>
                <div>Instant payouts once each session is complete</div>
              </div>
              <div className="cta">
                <Link className="btn btn-secondary" href="/creators">Explore creators</Link>
                <Link className="btn btn-outline" href="/creator/onboard">Get paid for your expertise</Link>
              </div>
              <div className={styles.metrics}>
                {heroStats.map((stat) => (
                  <div key={stat.label} className={styles.metricCard}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>
              <SubtleParticles />
            </div>
            <div className={styles.right}>
              <div className={styles.globeCard}>
                <div className={styles.liveTag}>Marketplace live</div>
                <GlobalConnectInfographic />
                <div className={styles.scheduleCard}>
                  <div className={styles.scheduleHeader}>
                    <span>Spotlight sessions</span>
                    <span className={styles.pill}>Filling fast</span>
                  </div>
                  <ul>
                    {heroSessions.map((session) => (
                      <li key={session.city}>
                        <div className={styles.slotCity}>{session.city}</div>
                        <div className={styles.slotMeta}>
                          <span>{session.label}</span>
                          <time>{session.time}</time>
                        </div>
                        <span className={styles.slotPrice}>{session.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={styles.volumeCard}>
                  <span>24h marketplace volume</span>
                  <strong>312&nbsp;SOL</strong>
                  <small>+12% vs. yesterday</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Below-hero sections */}
        <section className={styles.below}>
          <div className="container">
            <div style={{ margin: '8px 0 12px' }}>
              <CalendarInfographic />
            </div>
            <div className={styles.belowGrid}>
              <div className={styles.belowMain}>
                {/* Section header similar to reference */}
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 6px' }}>
                  <div className="row" style={{ gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(239,132,189,.15)', border: '1px solid rgba(239,132,189,.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🔥</div>
                    <div className="stack" style={{ gap: 2 }}>
                      <b style={{ fontSize: 18 }}>Top Creators</b>
                      <span className="muted" style={{ fontSize: 12 }}>Featured creators handpicked this week</span>
                    </div>
                  </div>
                  <Link href="/creators" className="btn btn-outline" style={{ padding: '6px 10px' }}>See all</Link>
                </div>
                <Spotlight list={filtered as any} intervalMs={9000} />
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
                      <b>Book & Pay</b>
                      <span className="muted">Secure your spot with USDC</span>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepIcon}>3</div>
                    <div className={styles.stepText}>
                      <b>Meet & Receive Materials</b>
                      <span className="muted">Join the call and get timely follow-ups</span>
                    </div>
                  </div>
                </div>
              </div>
              <aside className={styles.belowSide}>
                <div className={styles.miniHeader}>Top This Week</div>
                <div className={styles.miniList}>
                  {(topWeek as any[]).map((c: any) => (
                    <Link key={c.pubkey} href={`/creator/${encodeURIComponent(c.pubkey)}`} className={styles.miniItem}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.avatar || 'https://placehold.co/64x64'} alt={c.name} width={36} height={36} />
                      <div className={styles.miniMeta}>
                        <b className="one-line" title={c.name}>{c.name}</b>
                        <span className="muted">* {Number(c.rating || 0).toFixed(1)} - {c.saleSummary?.headline || 'Schedule coming soon'}</span>
                      </div>
                      <span className="muted" style={{ fontSize: 12 }}>{c.saleSummary?.window || 'Waiting for the next slot'}</span>
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
