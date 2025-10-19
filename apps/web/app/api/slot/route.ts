import { NextResponse } from 'next/server';
import { getSlot } from '@/lib/data';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const s = await getSlot(id);
  if (!s) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ slot: s });
}
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

