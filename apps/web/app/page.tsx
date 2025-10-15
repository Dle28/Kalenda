import Link from 'next/link';

export default function Page() {
  return (
    <section className="hero">
      <div>
        <h1 className="title">Đặt lịch số thông minh</h1>
        <p className="subtitle">Khám phá và đặt slot thời gian của Creator trên Solana. Thanh toán qua escrow PDA, minh bạch và an toàn.</p>
        <div className="cta">
          <Link className="btn" href="/creators">Khám phá Creator</Link>
          <Link className="btn btn-secondary" href="/creator/onboard">Trở thành Creator</Link>
        </div>
      </div>
      <div className="card">
        <div className="stack">
          <div className="row" style={{justifyContent:'space-between'}}>
            <span className="badge">Mẫu slot (Stable)</span>
            <span className="muted">Hôm nay 14:00</span>
          </div>
          <div className="slot">
            <div className="row" style={{justifyContent:'space-between'}}>
              <b>30 phút</b>
              <span>25 USDC</span>
            </div>
          </div>
          <div className="row" style={{justifyContent:'space-between'}}>
            <span className="badge">Mẫu slot (Bidding)</span>
            <span className="muted">Còn 02:31:12</span>
          </div>
          <div className="slot slot-auction">
            <div className="row" style={{justifyContent:'space-between'}}>
              <b>45 phút</b>
              <span>Giá khởi điểm: 10 USDC</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

