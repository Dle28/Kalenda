import { promises as fs } from 'fs';
import path from 'path';

const root = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/timemarket-data' : path.join(process.cwd(), '.data'));
const dataDir = root;
const creatorsPath = path.join(dataDir, 'creators.json');
const slotsPath = path.join(dataDir, 'slots.json');
const availabilityPath = path.join(dataDir, 'availability.json');
const requestsPath = path.join(dataDir, 'requests.json');

async function ensure() {
  await fs.mkdir(dataDir, { recursive: true });
  try { await fs.access(creatorsPath); } catch { await fs.writeFile(creatorsPath, JSON.stringify({}), 'utf-8'); }
  try { await fs.access(slotsPath); } catch { await fs.writeFile(slotsPath, JSON.stringify([]), 'utf-8'); }
  try { await fs.access(availabilityPath); } catch { await fs.writeFile(availabilityPath, JSON.stringify([]), 'utf-8'); }
  try { await fs.access(requestsPath); } catch { await fs.writeFile(requestsPath, JSON.stringify([]), 'utf-8'); }
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

export type Availability = {
  id: string;
  creator: string;
  start: string; // ISO
  end: string;   // ISO
};

export type BookingRequest = {
  id: string;
  creator: string;
  start: string; // ISO
  end: string;   // ISO
  from?: string; // viewer identifier (e.g., wallet or email)
  note?: string;
  createdAt: string; // ISO
  status?: 'pending' | 'approved' | 'declined';
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

// Availability helpers
export async function upsertAvailability(items: Availability[]) {
  await ensure();
  const list: Availability[] = JSON.parse(await fs.readFile(availabilityPath, 'utf-8') || '[]');
  const byId = new Map(list.map((s) => [s.id, s] as const));
  for (const s of items) byId.set(s.id, s);
  const merged = Array.from(byId.values()).sort((a, b) => a.start.localeCompare(b.start));
  await fs.writeFile(availabilityPath, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

export async function getAvailabilityByCreator(pubkey: string) {
  await ensure();
  const list: Availability[] = JSON.parse(await fs.readFile(availabilityPath, 'utf-8') || '[]');
  return list.filter((x) => x.creator === pubkey);
}

export async function deleteAvailabilityById(id: string) {
  await ensure();
  const list: Availability[] = JSON.parse(await fs.readFile(availabilityPath, 'utf-8') || '[]');
  const next = list.filter((x) => x.id !== id);
  await fs.writeFile(availabilityPath, JSON.stringify(next, null, 2), 'utf-8');
  return { ok: true };
}

// Booking requests
export async function addBookingRequest(req: Omit<BookingRequest, 'id' | 'createdAt'> & { id?: string }) {
  await ensure();
  const list: BookingRequest[] = JSON.parse(await fs.readFile(requestsPath, 'utf-8') || '[]');
  const id = req.id || `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const full: BookingRequest = { ...req, id, createdAt: new Date().toISOString(), status: (req as any).status || 'pending' } as BookingRequest;
  list.push(full);
  await fs.writeFile(requestsPath, JSON.stringify(list, null, 2), 'utf-8');
  return full;
}

export async function listBookingRequests(creator?: string) {
  await ensure();
  const list: BookingRequest[] = JSON.parse(await fs.readFile(requestsPath, 'utf-8') || '[]');
  return creator ? list.filter((x) => x.creator === creator) : list;
}

export async function updateBookingRequestStatus(id: string, status: BookingRequest['status']) {
  await ensure();
  const list: BookingRequest[] = JSON.parse(await fs.readFile(requestsPath, 'utf-8') || '[]');
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], status };
  await fs.writeFile(requestsPath, JSON.stringify(list, null, 2), 'utf-8');
  return list[idx];
}

export async function deleteBookingRequest(id: string) {
  await ensure();
  const list: BookingRequest[] = JSON.parse(await fs.readFile(requestsPath, 'utf-8') || '[]');
  const next = list.filter((x) => x.id !== id);
  await fs.writeFile(requestsPath, JSON.stringify(next, null, 2), 'utf-8');
  return { ok: true };
}
