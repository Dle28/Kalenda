import { NextResponse } from 'next/server';
import { deleteAvailabilityById, getAvailabilityByCreator, upsertAvailability, type Availability } from '@/lib/serverStore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const creator = searchParams.get('creator') || '';
  if (!creator) return NextResponse.json({ error: 'creator required' }, { status: 400 });
  const list = await getAvailabilityByCreator(creator);
  return NextResponse.json({ availability: list });
}

export async function POST(req: Request) {
  const body = await req.json();
  const items: Availability[] = Array.isArray(body?.availability) ? body.availability : [body];
  if (!items.length) return NextResponse.json({ error: 'availability required' }, { status: 400 });
  const merged = await upsertAvailability(items);
  return NextResponse.json({ availability: merged });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await deleteAvailabilityById(id);
  return NextResponse.json({ ok: true });
}
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

