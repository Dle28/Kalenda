import CreatorCard from '@/components/CreatorCard';
import { creators } from '@/lib/mock';

export default function CreatorsPage() {
  return (
    <section>
      <h2 className="title" style={{ fontSize: 28 }}>Explore creators</h2>
      <div className="grid" style={{ marginTop: 16 }}>
        {creators.map((c) => (
          <CreatorCard key={c.pubkey} {...c} />
        ))}
      </div>
    </section>
  );
}
