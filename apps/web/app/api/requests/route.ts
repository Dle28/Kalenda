import { NextResponse } from 'next/server';
import { addBookingRequest, deleteBookingRequest, listBookingRequests, updateBookingRequestStatus } from '@/lib/serverStore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const creator = searchParams.get('creator') || undefined;
  const status = searchParams.get('status') || undefined;
  let list = await listBookingRequests(creator);
  if (status) list = list.filter((x) => x.status === status);
  return NextResponse.json({ requests: list });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body?.creator || !body?.start || !body?.end) return NextResponse.json({ error: 'creator, start, end required' }, { status: 400 });
  const saved = await addBookingRequest({ creator: body.creator, start: body.start, end: body.end, from: body.from, note: body.note });
  return NextResponse.json({ request: saved });
}
export async function PATCH(req: Request) {
  const body = await req.json();
  const id = String(body?.id || '');
  const status = body?.status as any;
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  const updated = await updateBookingRequestStatus(id, status);
  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ request: updated });
}
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await deleteBookingRequest(id);
  return NextResponse.json({ ok: true });
}
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
