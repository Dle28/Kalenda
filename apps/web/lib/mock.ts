// apps/web/lib/mock.ts
export type Creator = {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  pricePerSlot?: number;
};

export type Slot = {
  id: string;
  creator: string; // pubkey
  start: string; // ISO
  end: string; // ISO
  mode: 'Stable' | 'EnglishAuction';
  price?: number; // USDC
  startPrice?: number; // auction
};

// Keep extra fields to satisfy existing UI while conforming to Creator
export const creators = [
  {
    id: 'demo-1',
    name: 'Alice',
    bio: 'Product designer',
    pricePerSlot: 25,
    avatar: 'https://i.pravatar.cc/150?img=5',
    // extra fields used by current UI
    pubkey: 'Cr8t0rAlice111111111111111111111111111111',
    fields: ['Design', 'UI/UX'],
    rating: 4.9,
    socials: { x: 'https://x.com/' },
  },
  {
    id: 'demo-2',
    name: 'Bob',
    bio: 'Solana dev',
    pricePerSlot: 40,
    avatar: 'https://i.pravatar.cc/150?img=15',
    // extra fields used by current UI
    pubkey: 'Cr8t0rBob22222222222222222222222222222222',
    fields: ['Blockchain', 'Solana'],
    rating: 4.7,
    socials: { x: 'https://x.com/' },
  },
] satisfies Creator[];

export const slots: Slot[] = (() => {
  const base = new Date();
  const startOfDay = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 9, 0, 0);
  const mk = (
    creator: string,
    dayOffset: number,
    hour: number,
    durMin: number,
    mode: Slot['mode'],
    price?: number,
    startPrice?: number,
  ) => {
    const s = new Date(startOfDay);
    s.setDate(s.getDate() + dayOffset);
    s.setHours(hour);
    const e = new Date(s);
    e.setMinutes(e.getMinutes() + durMin);
    return {
      id: `${creator}-${s.toISOString()}`,
      creator,
      start: s.toISOString(),
      end: e.toISOString(),
      mode,
      price,
      startPrice,
    } as Slot;
  };
  const c0 = (creators as any)[0].pubkey,
    c1 = (creators as any)[1].pubkey;
  return [
    mk(c0, 0, 10, 30, 'Stable', 25),
    mk(c0, 1, 14, 45, 'EnglishAuction', undefined, 10),
    mk(c1, 2, 9, 30, 'Stable', 30),
    mk(c1, 3, 15, 60, 'EnglishAuction', undefined, 12),
  ];
})();

