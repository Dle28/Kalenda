import { NextResponse } from 'next/server';
import { upsertSlots, type ServerSlot, getSlotsByCreator } from '@/lib/serverStore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const creator = searchParams.get('creator') || '';
  if (!creator) return NextResponse.json({ error: 'creator required' }, { status: 400 });
  const list = await getSlotsByCreator(creator);
  return NextResponse.json({ slots: list });
}

export async function POST(req: Request) {
  const body = await req.json();
  const input: ServerSlot[] = Array.isArray(body?.slots) ? body.slots : [body];
  if (!input.length) return NextResponse.json({ error: 'slots required' }, { status: 400 });
  const merged = await upsertSlots(input);
  return NextResponse.json({ slots: merged });
}
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
