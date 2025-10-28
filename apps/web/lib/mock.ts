// apps/web/lib/mock.ts
export type Creator = {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  pricePerSlot?: number;
};

type Socials = {
  web?: string;
  x?: string;
  ig?: string;
};

export type CreatorUI = Creator & {
  pubkey: string;
  fields: string[];
  rating?: number;
  socials: Socials;
  location?: string;
  timezone?: string;
  meetingTypes?: string[]; // e.g., ['Video call', 'Audio call']
};

export type Slot = {
  id: string;
  creator: string; // pubkey
  start: string; // ISO
  end: string; // ISO
  mode: 'Stable' | 'EnglishAuction';
  price?: number; // USDC
  startPrice?: number; // auction
  nftMint?: string; // optional minted ticket
  nftUri?: string; // optional metadata URI
};

// Keep extra fields to satisfy existing UI while conforming to Creator
export const creators: CreatorUI[] = [
  { id: 'aiko', name: 'Aiko', bio: 'Anime illustrator • VTuber avatar artist', pricePerSlot: 8.2,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Aiko',  pubkey: '9KzF3m7vLqRbN8xWpD5tYe4jCaUhG2sV6wM1rA',  fields: ['Illustration','VTuber'], rating: 4.9, socials: { x: 'https://x.com/' }, location: 'Remote', timezone: 'Asia/Tokyo', meetingTypes: ['Video call'] },
  { id: 'ren', name: 'Ren', bio: 'Pixel art • Twitch emotes',               pricePerSlot: 6.5,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Ren',   pubkey: '4Hx8TcP2qNfJ9mBvL5sYeRtK3wUg6hDa7ZnV1M',   fields: ['Pixel','Emotes'], rating: 4.7, socials: { x: 'https://x.com/' }, location: 'Remote', timezone: 'Europe/Berlin', meetingTypes: ['Video call','Audio call'] },
  { id: 'kenta', name: 'Kenta', bio: 'Manga paneling and tones',              pricePerSlot: 9.8,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Kenta', pubkey: '7Jq2WnK4xBfR6mPvY8sLe3tCaUhD9zG5oN1rT', fields: ['Manga','Inking'], rating: 4.8, socials: { x: 'https://x.com/' }, location: 'Tokyo', timezone: 'Asia/Tokyo', meetingTypes: ['In-person','Video call'] },
  { id: 'sora', name: 'Sora', bio: 'Digital painter • Key visuals',           pricePerSlot: 12.2, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Sora',  pubkey: '2Vy5XpL9qRfM4nBsW7tYe6jCaUhG8zK3oD1rP',  fields: ['Painting','Key Visual'], rating: 4.6, socials: { x: 'https://x.com/' }},
  { id: 'yuki', name: 'Yuki', bio: 'Anime composer • BGMs',                   pricePerSlot: 10.5, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Yuki',  pubkey: '8Km3FnQ6xCgT9mLvY2sWe5jBaRhD7zN4pU1rM',  fields: ['Music','BGM'], rating: 4.8, socials: { x: 'https://x.com/' }},
  { id: 'haru', name: 'Haru', bio: 'Storyboard & motion',                     pricePerSlot: 7.9,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Haru',  pubkey: '3Tx9VpN2qSfK7mBwY4sXe8jDaUhG6zL5oC1rR',  fields: ['Storyboard','Motion'], rating: 4.5, socials: { x: 'https://x.com/' }},
  { id: 'niko', name: 'Niko', bio: 'Chibi commissions',                       pricePerSlot: 5.8,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Niko',  pubkey: '6Wr4HpM8xDgJ2nCvZ5sYe9jEaShF3zK7qA1rT',  fields: ['Chibi','Commissions'], rating: 4.7, socials: { x: 'https://x.com/' }},
  { id: 'miku', name: 'Miku', bio: 'VTuber rigging (Live2D)',                 pricePerSlot: 18.2, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Miku',  pubkey: '5Nq7GpL3qUfR8mDwX2sYe6jBaTgH9zM4oK1rP',  fields: ['Rigging','Live2D'], rating: 4.9, socials: { x: 'https://x.com/' }},
  { id: 'riku', name: 'Riku', bio: 'Anime background artist',                 pricePerSlot: 11.0, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Riku',  pubkey: '9Lm2TnW6xHgK4mEvY7sZe3jCaUhD8zN5pF1rQ',  fields: ['Backgrounds','Painting'], rating: 4.6, socials: { x: 'https://x.com/' }},
  { id: 'hana', name: 'Hana', bio: 'Character designer',                      pricePerSlot: 9.2,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Hana',  pubkey: '4Vp8XnR5qJfM3mBsW9tYe2jDaThG7zL6oC1rN',  fields: ['Characters','Concept'], rating: 4.8, socials: { x: 'https://x.com/' }},
  { id: 'kira', name: 'Kira', bio: 'Colorist • cel shading',                  pricePerSlot: 7.2,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Kira',  pubkey: '7Ym3KnQ9xSgT2mLvY6sWe4jEaRhD8zP5qU1rM',  fields: ['Color','Cel'], rating: 4.6, socials: { x: 'https://x.com/' }},
  { id: 'toshi', name: 'Toshi', bio: 'Effects animation (2D)',                pricePerSlot: 13.5, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Toshi', pubkey: '2Wk8VpN4qRfJ7mBwX5sYe9jCaUhG3zK8oD1rT',  fields: ['FX','Animation'], rating: 4.7, socials: { x: 'https://x.com/' }},
  { id: 'rina', name: 'Rina', bio: 'Logo & stream overlays',                  pricePerSlot: 6.9,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Rina',  pubkey: '8Hr5MpL7xDgK9mCvZ3sYe6jBaShF2zN4qA1rP',    fields: ['Branding','Overlay'], rating: 4.5, socials: { x: 'https://x.com/' }},
  { id: 'kaoru', name: 'Kaoru', bio: 'Storyboard artist',                     pricePerSlot: 8.7,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Kaoru', pubkey: '3Nq6GpM2qUfR4mDwY8sXe5jCaTgH7zM9oK1rR',   fields: ['Storyboard','Panels'], rating: 4.6, socials: { x: 'https://x.com/' }},
  { id: 'emi', name: 'Emi', bio: 'Chara pose / model sheets',                 pricePerSlot: 8.0,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Emi',   pubkey: '6Lm9TnW3xHgJ5mEvZ2sYe7jDaUhD4zN8pF1rQ',    fields: ['Model Sheet','Pose'], rating: 4.8, socials: { x: 'https://x.com/' }},
  { id: 'akira', name: 'Akira', bio: 'Anime cover art',                       pricePerSlot: 14.3, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Akira', pubkey: '5Vp7XnR8qJfM6mBsW4tYe9jEaThG2zL3oC1rN',   fields: ['Cover','Poster'], rating: 4.7, socials: { x: 'https://x.com/' }},
  { id: 'kenji', name: 'Kenji', bio: 'VTuber logo & alerts',                  pricePerSlot: 9.1,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Kenji', pubkey: '9Ym2KnQ5xSgT8mLvY3sWe6jCaRhD9zP4qU1rM',   fields: ['Logo','Alerts'], rating: 4.6, socials: { x: 'https://x.com/' }},
  { id: 'mei', name: 'Mei', bio: 'Cute chibi art',                            pricePerSlot: 5.5,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Mei',   pubkey: '4Wk7VpN6qRfJ2mBwX8sYe5jDaUhG6zK7oD1rT',    fields: ['Chibi','Cute'], rating: 4.9, socials: { x: 'https://x.com/' }},
  { id: 'daichi', name: 'Daichi', bio: 'Mecha designs • line art',            pricePerSlot: 12.9, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Daichi',pubkey: '7Hr4MpL9xDgK3mCvZ6sYe2jEaShF8zN5qA1rP',  fields: ['Mecha','Line'], rating: 4.7, socials: { x: 'https://x.com/' }},
  { id: 'yume', name: 'Yume', bio: 'Backgrounds • night city vibes',          pricePerSlot: 11.6, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Yume',  pubkey: '2Nq3GpM8qUfR7mDwY5sXe9jBaTgH4zM6oK1rR',    fields: ['Background','City'], rating: 4.8, socials: { x: 'https://x.com/' }},
];

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
    s.setHours(hour, 0, 0, 0);
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

  const seedFrom = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 31 + input.charCodeAt(i)) % 2147483647;
    }
    return hash || 1;
  };

  const makeRng = (seed: number) => () => {
    seed = (seed * 48271) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const c0 = (creators as any)[0].pubkey;
  const c1 = (creators as any)[1].pubkey;

  const list = [
    mk(c0, 0, 10, 30, 'Stable', 25),
    mk(c0, 1, 14, 45, 'EnglishAuction', undefined, 10),
    mk(c1, 2, 9, 30, 'Stable', 30),
    mk(c1, 3, 15, 60, 'EnglishAuction', undefined, 12),
  ] as Slot[];

  const seen = new Set(list.map((slot) => slot.id));
  const randomSlots: Slot[] = [];

  (creators as CreatorUI[]).forEach((creator) => {
    const rng = makeRng(seedFrom(creator.pubkey));
    const slotCount = 2 + Math.floor(rng() * 3); // 2-4 slots per creator
    for (let i = 0; i < slotCount; i++) {
      const dayOffset = Math.floor(rng() * 7); // within the current week
      const startHour = 9 + Math.floor(rng() * 9); // 9 AM - 17 PM
      const minuteBucket = rng() > 0.5 ? 30 : 0;
      const durOptions = [30, 45, 60, 75, 90];
      const duration = durOptions[Math.floor(rng() * durOptions.length)];
      const mode: Slot['mode'] = rng() > 0.7 ? 'EnglishAuction' : 'Stable';
      const basePrice = Number(creator.pricePerSlot || 10);
      const priceSpread = 0.75 + rng() * 0.6;
      const stablePrice = Number((basePrice * priceSpread).toFixed(2));
      const auctionStart = Number((stablePrice * (0.55 + rng() * 0.25)).toFixed(2));

      const s = new Date(startOfDay);
      s.setDate(s.getDate() + dayOffset);
      s.setHours(startHour, minuteBucket, 0, 0);
      const e = new Date(s);
      e.setMinutes(e.getMinutes() + duration);
      const id = `${creator.pubkey}-${s.toISOString()}`;
      if (seen.has(id)) continue;
      seen.add(id);

      randomSlots.push({
        id,
        creator: creator.pubkey,
        start: s.toISOString(),
        end: e.toISOString(),
        mode,
        price: mode === 'Stable' ? stablePrice : undefined,
        startPrice: mode === 'EnglishAuction' ? auctionStart : undefined,
      });
    }
  });

  // Demo: attach sample NFT metadata to the first auction slot
  const firstAuction = list.find((s) => s.mode === 'EnglishAuction');
  if (firstAuction) {
    firstAuction.nftMint = 'DemoMint111111111111111111111111111111111';
    firstAuction.nftUri = '/sample/nft.json';
  }

  const fullList = [...list, ...randomSlots].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  return fullList;
})();

