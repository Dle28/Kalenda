import { NextResponse } from 'next/server';
import { saveCreatorProfile, loadCreatorProfile } from '@/lib/serverStore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pubkey = searchParams.get('pubkey') || '';
  if (!pubkey) return NextResponse.json({ error: 'pubkey required' }, { status: 400 });
  const data = await loadCreatorProfile(pubkey);
  return NextResponse.json({ profile: data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const pubkey = String(body?.pubkey || '');
  if (!pubkey) return NextResponse.json({ error: 'pubkey required' }, { status: 400 });
  const updated = await saveCreatorProfile(pubkey, body);
  return NextResponse.json({ profile: updated });
}
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
