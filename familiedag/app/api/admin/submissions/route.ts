import { NextRequest, NextResponse } from 'next/server';
import { storageKeys, storageMget } from '@/lib/storage';

const ADMIN_PIN = '2525';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('pin') !== ADMIN_PIN) {
    return NextResponse.json({ error: 'Onbevoegd' }, { status: 401 });
  }

  const keys = await storageKeys('team:*');
  if (keys.length === 0) return NextResponse.json({ inzendingen: {} });

  const values = await storageMget(keys);
  const inzendingen: Record<string, unknown> = {};
  keys.forEach((key, i) => {
    inzendingen[key] = values[i];
  });

  return NextResponse.json({ inzendingen });
}
