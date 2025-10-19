import { promises as fs } from 'fs';
import path from 'path';

const root = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/timemarket-data' : path.join(process.cwd(), '.data'));
const dataDir = root;
const creatorsPath = path.join(dataDir, 'creators.json');
const slotsPath = path.join(dataDir, 'slots.json');

async function ensure() {
  await fs.mkdir(dataDir, { recursive: true });
  try { await fs.access(creatorsPath); } catch { await fs.writeFile(creatorsPath, JSON.stringify({}), 'utf-8'); }
  try { await fs.access(slotsPath); } catch { await fs.writeFile(slotsPath, JSON.stringify([]), 'utf-8'); }
}

export async function saveCreatorProfile(pubkey: string, profile: any) {
  await ensure();
  const raw = await fs.readFile(creatorsPath, 'utf-8');
  const map = JSON.parse(raw || '{}') as Record<string, any>;
  map[pubkey] = { ...(map[pubkey] || {}), ...profile, pubkey };
  await fs.writeFile(creatorsPath, JSON.stringify(map, null, 2), 'utf-8');
  return map[pubkey];
}

export async function loadCreatorProfile(pubkey: string) {
  await ensure();
  const map = JSON.parse(await fs.readFile(creatorsPath, 'utf-8') || '{}');
  return map[pubkey] || null;
}

export async function listCreatorProfiles() {
  await ensure();
  const map = JSON.parse(await fs.readFile(creatorsPath, 'utf-8') || '{}');
  return Object.values(map || {});
}

export type ServerSlot = {
  id: string;
  creator: string;
  start: string;
  end: string;
  mode: 'Stable' | 'EnglishAuction';
  price?: number;
  startPrice?: number;
};

export async function upsertSlots(slots: ServerSlot[]) {
  await ensure();
  const list: ServerSlot[] = JSON.parse(await fs.readFile(slotsPath, 'utf-8') || '[]');
  const byId = new Map(list.map((s) => [s.id, s] as const));
  for (const s of slots) byId.set(s.id, s);
  const merged = Array.from(byId.values()).sort((a, b) => a.start.localeCompare(b.start));
  await fs.writeFile(slotsPath, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

export async function getSlotsByCreator(pubkey: string) {
  await ensure();
  const list: ServerSlot[] = JSON.parse(await fs.readFile(slotsPath, 'utf-8') || '[]');
  return list.filter((x) => x.creator === pubkey);
}

export async function getSlotById(id: string) {
  await ensure();
  const list: ServerSlot[] = JSON.parse(await fs.readFile(slotsPath, 'utf-8') || '[]');
  return list.find((x) => x.id === id) || null;
}

export async function deleteSlotById(id: string) {
  await ensure();
  const list: ServerSlot[] = JSON.parse(await fs.readFile(slotsPath, 'utf-8') || '[]');
  const next = list.filter((x) => x.id !== id);
  await fs.writeFile(slotsPath, JSON.stringify(next, null, 2), 'utf-8');
  return { ok: true };
}
