import Link from 'next/link';
import Countdown from './Countdown';

export default function SlotCard(props: {
  id: string;
  mode: 'Stable' | 'EnglishAuction';
  start: Date;
  end: Date;
  price?: number;
  startPrice?: number;
}) {
  const { id, mode, start, end, price, startPrice } = props;
  const durMin = Math.round((end.getTime() - start.getTime()) / 60000);
  return (
    <div className={`slot ${mode === 'EnglishAuction' ? 'slot-auction' : ''}`}>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div className="stack">
          <b>{start.toLocaleString()}</b>
          <span className="muted">{durMin} phút</span>
        </div>
        {mode === 'Stable' ? (
          <div className="stack" style={{alignItems:'flex-end'}}>
            <span><b>{price} USDC</b></span>
            <Link href={`/slot/${encodeURIComponent(id)}`} className="btn">Đặt ngay</Link>
          </div>
        ) : (
          <div className="stack" style={{alignItems:'flex-end'}}>
            <span className="muted">Giá khởi điểm</span>
            <span><b>{startPrice} USDC</b></span>
            <Countdown to={new Date(start.getTime() + 2 * 60 * 60 * 1000)} />
            <Link href={`/slot/${encodeURIComponent(id)}`} className="btn btn-secondary">Tham gia đấu giá</Link>
          </div>
        )}
      </div>
    </div>
  );
}

