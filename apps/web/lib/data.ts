// apps/web/lib/data.ts
// Data service: fetch creators and slots from on-chain (TODO) or mock fallback

import { PublicKey } from '@solana/web3.js';
import type { CreatorUI, Slot } from './mock';
import { creators, slots } from './mock';

export type CreatorPublic = Pick<CreatorUI, 'pubkey' | 'name' | 'bio' | 'avatar' | 'pricePerSlot' | 'fields' | 'rating' | 'socials' | 'location' | 'timezone' | 'meetingTypes'>;

export async function getCreator(pubkey: string): Promise<CreatorPublic | null> {
  const k = decodeURIComponent(pubkey);
  // TODO: load CreatorProfile account by PDA using ts-sdk once RPC ready
  // const profile = await sdk.getCreatorProfile(new PublicKey(k));
  // return mapProfile(profile);
  const c = creators.find((x) => x.pubkey === k);
  return c
    ? {
        pubkey: c.pubkey,
        name: c.name,
        bio: c.bio,
        avatar: c.avatar,
        pricePerSlot: c.pricePerSlot,
        fields: c.fields,
        rating: c.rating,
        socials: c.socials,
        location: c.location,
        timezone: c.timezone,
        meetingTypes: c.meetingTypes,
      }
    : null;
}

export async function getCreatorSlots(pubkey: string): Promise<Slot[]> {
  const k = decodeURIComponent(pubkey);
  // TODO: query TimeSlot accounts filtered by creator_authority == k
  // const list = await sdk.findSlotsByCreator(new PublicKey(k));
  return slots.filter((s) => s.creator === k);
}
