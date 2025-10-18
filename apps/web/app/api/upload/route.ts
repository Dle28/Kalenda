import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const dest = path.join(uploadsDir, safeName);
  await fs.writeFile(dest, buffer);

  const url = `/uploads/${safeName}`;
  return NextResponse.json({ url });
}
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
