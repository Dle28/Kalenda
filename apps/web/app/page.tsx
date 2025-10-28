"use client";
import Link from 'next/link';
import { useMemo } from 'react';
import { creators, slots } from '@/lib/mock';
import styles from './home.module.css';
import SubtleParticles from '@/components/SubtleParticles';
import Spotlight from '@/components/Spotlight';
import Testimonials from '@/components/Testimonials';
import EventsStrip from '@/components/EventsStrip';
import ScrollEffects from '@/components/ScrollEffects';
import { summarizeSlotsByCreator } from '@/lib/slotSummary';
import CalendarInfographic from '@/components/CalendarInfographic';
import UpcomingAppointments from '@/components/UpcomingAppointments';
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

  return (
    <>
      <ScrollEffects />
      <section className={styles.wrap}>
        <div className="container">
          
          {/* ===== BƯỚC 1: TÁI CẤU TRÚC HERO ===== */}
          <div className={styles.hero}>
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
            <SubtleParticles />
          </div>
          
          {/* Đồ họa bây giờ nằm dưới hero, không còn bên cạnh nữa */}
          <div className={styles.heroGraphic}>
            <GlobalConnectInfographic />
          </div>
          {/* ===== KẾT THÚC TÁI CẤU TRÚC HERO ===== */}

        </div>

        {/* ===== BƯỚC 2: TÁI CẤU TRÚC NỘI DUNG CHÍNH ===== */}
        <section className={styles.contentLayout}>
          
          {/* KHỐI HÀNH ĐỘNG CHÍNH (Lịch + Lưới Booking) */}
          <div className={styles.primaryActionCard}>
            {/* LƯU Ý: Đây là nơi Copilot gợi ý đặt Tabs (Intro Call | Fixed Price | Auction) 
              Chúng ta sẽ thêm component Tabs sau. 
              Trước mắt, hãy dùng component Lịch + Lưới booking bạn đã sửa.
            */}

            {/* Bạn có thể di chuyển <CalendarInfographic> vào đây nếu muốn */}
            {/* <CalendarInfographic /> */}

            {/* HOẶC dùng component Lịch của bạn (từ ảnh chụp) */}
            {/* <SmartCalendar ... /> */}
            
            {/* TODO: Bạn cần di chuyển component chịu trách nhiệm 
              hiển thị "Smart calendar" VÀ "lưới booking" (Kira, Aiko...)
              vào đây. Dựa trên code cũ, có vẻ đó là <UpcomingAppointments /> ?
              Nếu chưa có, bạn hãy dùng component <CalendarInfographic> và
              phần lưới booking ở dưới.
            */}
            
            {/* Tạm thời tôi sẽ lấy từ code cũ của bạn */}
            <div style={{ margin: '8px 0 12px' }}>
              <CalendarInfographic />
            </div>
            
            <UpcomingAppointments slots={slots as any} creators={creators as any} />

            {/* Tạm thời di chuyển phần "How-to" vào đây */}
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

          {/* KHỐI HỖ TRỢ (Creators + Trending) */}
          <aside className={styles.supportingColumn}>
            {/* Top Creators (Spotlight) */}
            <div className={styles.supportingCard}>
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
            <div className={styles.supportingCard}>
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
