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
  { id: 'aiko', name: 'Aiko', bio: 'Anime illustrator â€¢ VTuber avatar artist', pricePerSlot: 8.2,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Aiko',  pubkey: 'Cr8t0rAiko1111111111111111111111111111111',  fields: ['Illustration','VTuber'], rating: 4.9, socials: { x: 'https://x.com/' }, location: 'Remote', timezone: 'Asia/Tokyo', meetingTypes: ['Video call'] },
  { id: 'ren', name: 'Ren', bio: 'Pixel art â€¢ Twitch emotes',               pricePerSlot: 6.5,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Ren',   pubkey: 'Cr8t0rRen2222222222222222222222222222222',   fields: ['Pixel','Emotes'], rating: 4.7, socials: { x: 'https://x.com/' }, location: 'Remote', timezone: 'Europe/Berlin', meetingTypes: ['Video call','Audio call'] },
  { id: 'kenta', name: 'Kenta', bio: 'Manga paneling and tones',              pricePerSlot: 9.8,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Kenta', pubkey: 'Cr8t0rKenta33333333333333333333333333333', fields: ['Manga','Inking'], rating: 4.8, socials: { x: 'https://x.com/' }, location: 'Tokyo', timezone: 'Asia/Tokyo', meetingTypes: ['In-person','Video call'] },
  { id: 'sora', name: 'Sora', bio: 'Digital painter â€¢ Key visuals',           pricePerSlot: 12.2, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Sora',  pubkey: 'Cr8t0rSora444444444444444444444444444444',  fields: ['Painting','Key Visual'], rating: 4.6, socials: { x: 'https://x.com/' }},
  { id: 'yuki', name: 'Yuki', bio: 'Anime composer â€¢ BGMs',                   pricePerSlot: 10.5, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Yuki',  pubkey: 'Cr8t0rYuki555555555555555555555555555555',  fields: ['Music','BGM'], rating: 4.8, socials: { x: 'https://x.com/' }},
  { id: 'haru', name: 'Haru', bio: 'Storyboard & motion',                     pricePerSlot: 7.9,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Haru',  pubkey: 'Cr8t0rHaru666666666666666666666666666666',  fields: ['Storyboard','Motion'], rating: 4.5, socials: { x: 'https://x.com/' }},
  { id: 'niko', name: 'Niko', bio: 'Chibi commissions',                       pricePerSlot: 5.8,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Niko',  pubkey: 'Cr8t0rNiko777777777777777777777777777777',  fields: ['Chibi','Commissions'], rating: 4.7, socials: { x: 'https://x.com/' }},
  { id: 'miku', name: 'Miku', bio: 'VTuber rigging (Live2D)',                 pricePerSlot: 18.2, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Miku',  pubkey: 'Cr8t0rMiku888888888888888888888888888888',  fields: ['Rigging','Live2D'], rating: 4.9, socials: { x: 'https://x.com/' }},
  { id: 'riku', name: 'Riku', bio: 'Anime background artist',                 pricePerSlot: 11.0, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Riku',  pubkey: 'Cr8t0rRiku999999999999999999999999999999',  fields: ['Backgrounds','Painting'], rating: 4.6, socials: { x: 'https://x.com/' }},
  { id: 'hana', name: 'Hana', bio: 'Character designer',                      pricePerSlot: 9.2,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Hana',  pubkey: 'Cr8t0rHana000000000000000000000000000000',  fields: ['Characters','Concept'], rating: 4.8, socials: { x: 'https://x.com/' }},
  { id: 'kira', name: 'Kira', bio: 'Colorist â€¢ cel shading',                  pricePerSlot: 7.2,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Kira',  pubkey: 'Cr8t0rKiraaaaaa1111111111111111111111111',  fields: ['Color','Cel'], rating: 4.6, socials: { x: 'https://x.com/' }},
  { id: 'toshi', name: 'Toshi', bio: 'Effects animation (2D)',                pricePerSlot: 13.5, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Toshi', pubkey: 'Cr8t0rToshiBBBBBBBBBBBBBBBBBBBBBBBBBBBB',  fields: ['FX','Animation'], rating: 4.7, socials: { x: 'https://x.com/' }},
  { id: 'rina', name: 'Rina', bio: 'Logo & stream overlays',                  pricePerSlot: 6.9,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Rina',  pubkey: 'Cr8t0rRinaCCCCCCCCCCCCCCCCCCCCCCCCCCCC',    fields: ['Branding','Overlay'], rating: 4.5, socials: { x: 'https://x.com/' }},
  { id: 'kaoru', name: 'Kaoru', bio: 'Storyboard artist',                     pricePerSlot: 8.7,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Kaoru', pubkey: 'Cr8t0rKaoruDDDDDDDDDDDDDDDDDDDDDDDDDDD',   fields: ['Storyboard','Panels'], rating: 4.6, socials: { x: 'https://x.com/' }},
  { id: 'emi', name: 'Emi', bio: 'Chara pose / model sheets',                 pricePerSlot: 8.0,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Emi',   pubkey: 'Cr8t0rEmiEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',    fields: ['Model Sheet','Pose'], rating: 4.8, socials: { x: 'https://x.com/' }},
  { id: 'akira', name: 'Akira', bio: 'Anime cover art',                       pricePerSlot: 14.3, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Akira', pubkey: 'Cr8t0rAkiraFFFFFFFFFFFFFFFFFFFFFFFFFFFF',   fields: ['Cover','Poster'], rating: 4.7, socials: { x: 'https://x.com/' }},
  { id: 'kenji', name: 'Kenji', bio: 'VTuber logo & alerts',                  pricePerSlot: 9.1,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Kenji', pubkey: 'Cr8t0rKenjiGGGGGGGGGGGGGGGGGGGGGGGGGGG',   fields: ['Logo','Alerts'], rating: 4.6, socials: { x: 'https://x.com/' }},
  { id: 'mei', name: 'Mei', bio: 'Cute chibi art',                            pricePerSlot: 5.5,  avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Mei',   pubkey: 'Cr8t0rMeiHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',    fields: ['Chibi','Cute'], rating: 4.9, socials: { x: 'https://x.com/' }},
  { id: 'daichi', name: 'Daichi', bio: 'Mecha designs â€¢ line art',            pricePerSlot: 12.9, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Daichi',pubkey: 'Cr8t0rDaichiIIIIIIIIIIIIIIIIIIIIIIIIIII',  fields: ['Mecha','Line'], rating: 4.7, socials: { x: 'https://x.com/' }},
  { id: 'yume', name: 'Yume', bio: 'Backgrounds â€¢ night city vibes',          pricePerSlot: 11.6, avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Yume',  pubkey: 'Cr8t0rYumeJJJJJJJJJJJJJJJJJJJJJJJJJJJJ',    fields: ['Background','City'], rating: 4.8, socials: { x: 'https://x.com/' }},
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
  const list = [
    mk(c0, 0, 10, 30, 'Stable', 25),
    mk(c0, 1, 14, 45, 'EnglishAuction', undefined, 10),
    mk(c1, 2, 9, 30, 'Stable', 30),
    mk(c1, 3, 15, 60, 'EnglishAuction', undefined, 12),
  ] as Slot[];
  // Demo: attach sample NFT metadata to the first auction slot
  const firstAuction = list.find((s) => s.mode === 'EnglishAuction');
  if (firstAuction) {
    firstAuction.nftMint = 'DemoMint111111111111111111111111111111111';
    firstAuction.nftUri = '/sample/nft.json';
  }
  return list;
})();

