// apps/web/lib/data.ts
// Data service: fetch creators and slots from on-chain (TODO) or mock fallback

import { PublicKey } from '@solana/web3.js';
import type { CreatorUI, Slot } from './mock';
import { creators, slots } from './mock';
import { loadCreatorProfile, getSlotsByCreator, getSlotById, getAvailabilityByCreator } from './serverStore';

export type CreatorPublic = Pick<CreatorUI, 'pubkey' | 'name' | 'bio' | 'avatar' | 'pricePerSlot' | 'fields' | 'rating' | 'socials' | 'location' | 'timezone' | 'meetingTypes'>;

export async function getCreator(pubkey: string): Promise<CreatorPublic | null> {
  const k = decodeURIComponent(pubkey);
  // TODO: load CreatorProfile account by PDA using ts-sdk once RPC ready
  // const profile = await sdk.getCreatorProfile(new PublicKey(k));
  // return mapProfile(profile);
  const fromStore = await loadCreatorProfile(k).catch(() => null as any);
  const c = creators.find((x) => x.pubkey === k);
  const merged = fromStore || c;
  return merged
    ? {
        pubkey: merged.pubkey,
        name: merged.name,
        bio: merged.bio,
        avatar: merged.avatar,
        pricePerSlot: merged.pricePerSlot,
        fields: merged.fields,
        rating: merged.rating,
        socials: merged.socials,
        location: merged.location,
        timezone: merged.timezone,
        meetingTypes: merged.meetingTypes,
      }
    : null;
}

export async function getCreatorSlots(pubkey: string): Promise<Slot[]> {
  const k = decodeURIComponent(pubkey);
  // TODO: query TimeSlot accounts filtered by creator_authority == k
  // const list = await sdk.findSlotsByCreator(new PublicKey(k));
  const persisted = await getSlotsByCreator(k).catch(() => [] as any[]);
  if (persisted.length) return persisted as any;
  return slots.filter((s) => s.creator === k);
}

export async function getSlot(id: string): Promise<Slot | null> {
  const decoded = decodeURIComponent(id);
  const persisted = await getSlotById(decoded).catch(() => null as any);
  if (persisted) return persisted as any;
  const fromMock = slots.find((s) => s.id === decoded) as any;
  return fromMock || null;
}

export type Availability = { id: string; creator: string; start: string; end: string };

export async function getCreatorAvailability(pubkey: string): Promise<Availability[]> {
  const k = decodeURIComponent(pubkey);
  const list = await getAvailabilityByCreator(k).catch(() => [] as any[]);
  return list as any;
}

