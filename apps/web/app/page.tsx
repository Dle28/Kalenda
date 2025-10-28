"use client";
import Link from 'next/link';
import { useMemo } from 'react';
import { creators, slots } from '@/lib/mock';
import styles from './home.module.css';
import SubtleParticles from '@/components/SubtleParticles';
import Spotlight from '@/components/Spotlight';
import Testimonials from '@/components/Testimonials';
import ScrollEffects from '@/components/ScrollEffects';
import { summarizeSlotsByCreator } from '@/lib/slotSummary';
import CalendarInfographic from '@/components/CalendarInfographic';
import GlobalConnectInfographic from '../components/GlobalConnectInfographic';

export default function Page() {
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

  const upcomingSlots = useMemo(() => {
    const now = Date.now();
    return [...(slots as any[])]
      .filter((s: any) => new Date(s.start).getTime() > now)
      .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 3);
  }, []);

  const formatSlotTime = (isoString: string) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    }).format(new Date(isoString));

  return (
    <>
      <ScrollEffects />
      <section className={styles.wrap}>
        <div className={styles.heroShell}>
          {/* ===== BƯỚC 1: TÁI CẤU TRÚC HERO ===== */}
          <div className={styles.hero}>
            <div className={styles.heroContent}>
              <h1 className={styles.heading}>TIME IS MONEY.</h1>
              <p className={styles.sub}>Reserve expert time slots secured on Solana.</p>
              
              <div className={styles.primaryCta}>
                {/* LƯU Ý: Bạn cần import component WalletButton của mình. 
                  Copilot đề xuất nó ở đây. Nếu chưa có, bạn có thể 
                  tạm thời bỏ qua hoặc comment nó lại.
                */}
                {/* <WalletButton /> */}
                <Link className="btn btn-secondary" href="/book">Book a session</Link>
              </div>
            </div>

            <div className={styles.heroGraphic}>
              <GlobalConnectInfographic />
            </div>

            <SubtleParticles />
          </div>
          {/* ===== KẾT THÚC TÁI CẤU TRÚC HERO ===== */}

        </div>

        {/* ===== BƯỚC 2: TÁI CẤU TRÚC NỘI DUNG CHÍNH ===== */}
        <section className={styles.contentLayout}>
          
          {/* KHỐI HÀNH ĐỘNG CHÍNH (Lịch + Lưới Booking) */}
          <div className={styles.primaryColumn}>
            <div className={styles.card}>
              <CalendarInfographic />
              {upcomingSlots.length > 0 ? (
                <div className={styles.bookingGrid}>
                  {upcomingSlots.map((slot: any) => {
                    const creator = (creators as any[]).find((x: any) => x.pubkey === slot.creator);
                    return (
                      <Link
                        key={slot.id}
                        href={`/slot/${encodeURIComponent(slot.id)}`}
                        className={styles.eventCard}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={creator?.avatar || 'https://placehold.co/160'}
                          alt={creator?.name || 'creator'}
                          width={56}
                          height={56}
                        />
                        <div className={styles.eventBody}>
                          <b className="one-line">{creator?.name || 'Creator'}</b>
                          <span className="muted">{formatSlotTime(slot.start)}</span>
                          <span className={styles.badgeMode}>{slot.mode === 'Stable' ? 'Fixed' : 'Auction'}</span>
                        </div>
                        <span className={styles.eventCta}>Reserve</span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.bookingEmpty}>
                  <span className="muted">No upcoming slots yet. Check back soon.</span>
                </div>
              )}
            </div>

            <div className={styles.card}>
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

            <div className={styles.card}>
              <Testimonials embedded />
            </div>
          </div>

          {/* KHỐI HỖ TRỢ (Creators + Trending) */}
          <aside className={styles.supportingColumn}>
            {/* Top Creators (Spotlight) */}
            <div className={styles.card}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', margin: '0 0 10px' }}>
                <div className="row" style={{ gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(239,132,189,.15)', border: '1px solid rgba(239,132,189,.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🔥</div>
                  <div className="stack" style={{ gap: 2 }}>
                    <b style={{ fontSize: 18 }}>Top Creators</b>
                  </div>
                </div>
                <Link href="/creators" className="btn btn-outline" style={{ padding: '6px 10px' }}>See all</Link>
              </div>
              <Spotlight list={filtered as any} intervalMs={9000} />
            </div>

            {/* Top This Week (MiniList) */}
            <div className={styles.card}>
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
            </div>
          </aside>

        </section>
        {/* ===== KẾT THÚC BƯỚC 2 ===== */}
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
