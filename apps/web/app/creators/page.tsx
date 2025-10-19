import CreatorCard from '@/components/CreatorCard';
import { creators as mockCreators } from '@/lib/mock';
import { listCreatorProfiles } from '@/lib/serverStore';

export default async function CreatorsPage() {
  // Load any saved profiles (server-side) and merge with mock list by pubkey
  const saved = await listCreatorProfiles().catch(() => [] as any[]);
  const map = new Map<string, any>();
  for (const c of mockCreators) map.set(c.pubkey, c);
  for (const s of saved) {
    const prev = map.get(s.pubkey) || {};
    map.set(s.pubkey, { ...prev, ...s });
  }
  const list = Array.from(map.values());

  return (
    <section>
      <h2 className="title" style={{ fontSize: 28 }}>Explore creators</h2>
      <div className="grid" style={{ marginTop: 16 }}>
        {list.map((c) => (
          <CreatorCard key={c.pubkey} {...c} />
        ))}
      </div>
    </section>
  );
}
