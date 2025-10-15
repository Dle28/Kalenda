export type Creator = {
  pubkey: string;
  name: string;
  avatar: string;
  fields: string[];
  rating: number;
  bio: string;
  socials: { x?: string; ig?: string; web?: string };
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

export const creators: Creator[] = [
  {
    pubkey: 'Cr8t0r111111111111111111111111111111111111',
    name: 'Linh Nguyen',
    avatar: 'https://i.pravatar.cc/150?img=5',
    fields: ['Design', 'UI/UX'],
    rating: 4.9,
    bio: 'Product designer. 10y in SaaS & fintech.',
    socials: { x: 'https://x.com/', web: 'https://example.com' },
  },
  {
    pubkey: 'Cr8t0r222222222222222222222222222222222222',
    name: 'Minh Tran',
    avatar: 'https://i.pravatar.cc/150?img=15',
    fields: ['Marketing', 'Growth'],
    rating: 4.7,
    bio: 'Growth strategist, ex-startup operator.',
    socials: { x: 'https://x.com/' },
  },
  {
    pubkey: 'Cr8t0r333333333333333333333333333333333333',
    name: 'Thao Le',
    avatar: 'https://i.pravatar.cc/150?img=25',
    fields: ['AI', 'Data'],
    rating: 4.8,
    bio: 'ML engineer focusing on LLM tooling.',
    socials: { x: 'https://x.com/' },
  },
];

export const slots: Slot[] = (() => {
  const base = new Date();
  const startOfDay = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 9, 0, 0);
  const mk = (creator: string, dayOffset: number, hour: number, durMin: number, mode: Slot['mode'], price?: number, startPrice?: number) => {
    const s = new Date(startOfDay);
    s.setDate(s.getDate() + dayOffset);
    s.setHours(hour);
    const e = new Date(s);
    e.setMinutes(e.getMinutes() + durMin);
    return { id: `${creator}-${s.toISOString()}`, creator, start: s.toISOString(), end: e.toISOString(), mode, price, startPrice } as Slot;
  };
  const c0 = creators[0].pubkey, c1 = creators[1].pubkey, c2 = creators[2].pubkey;
  return [
    mk(c0, 0, 10, 30, 'Stable', 25),
    mk(c0, 1, 14, 45, 'EnglishAuction', undefined, 10),
    mk(c1, 2, 9, 30, 'Stable', 30),
    mk(c1, 3, 15, 60, 'EnglishAuction', undefined, 12),
    mk(c2, 1, 11, 30, 'Stable', 20),
    mk(c2, 4, 16, 45, 'EnglishAuction', undefined, 15),
  ];
})();

