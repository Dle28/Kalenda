import { slots } from '@/lib/mock';
import SlotCard from '@/components/SlotCard';

export default function SlotPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const s = slots.find((x) => x.id === id);
  if (!s) return <div>Không tìm thấy slot.</div>;
  return (
    <section>
      <h1 className="title" style={{ fontSize: 28 }}>Slot</h1>
      <p className="muted">Creator: {s.creator.slice(0, 6)}...{s.creator.slice(-4)}</p>
      <div style={{ marginTop: 12 }}>
        <SlotCard
          id={s.id}
          mode={s.mode}
          start={new Date(s.start)}
          end={new Date(s.end)}
          price={s.price}
          startPrice={s.startPrice}
        />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <b>Hành động</b>
        <p className="muted">Kết nối Anchor client để gọi transaction (stable_reserve / bid_place).</p>
      </div>
    </section>
  );
}

