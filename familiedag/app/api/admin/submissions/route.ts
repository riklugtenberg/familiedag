import { NextResponse } from 'next/server';
import { storageKeys, storageMget } from '@/lib/storage';

export async function GET() {
  const keys = await storageKeys('team:*');
  if (keys.length === 0) return NextResponse.json({ inzendingen: {} });

  const values = await storageMget(keys);
  const inzendingen: Record<string, unknown> = {};
  keys.forEach((key, i) => {
    inzendingen[key] = values[i];
  });

  return NextResponse.json({ inzendingen });
}
