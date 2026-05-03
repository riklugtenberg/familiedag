import { NextRequest, NextResponse } from 'next/server';
import { storageSet, storageKeys, storageMget } from '@/lib/storage';

const ADMIN_PIN = '1212';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { pin, opdrachtId, teamNaam, scores } = body;

  if (pin !== ADMIN_PIN) {
    return NextResponse.json({ error: 'Onbevoegd' }, { status: 401 });
  }

  if (!opdrachtId || !teamNaam || scores === undefined) {
    return NextResponse.json({ error: 'Ontbrekende velden' }, { status: 400 });
  }

  await storageSet(`juryScore:${opdrachtId}:${teamNaam}`, scores);
  return NextResponse.json({ success: true });
}

export async function GET() {
  const keys = await storageKeys('juryScore:*');
  if (keys.length === 0) return NextResponse.json({ scores: {} });

  const values = await storageMget(keys);
  const scores: Record<string, unknown> = {};
  keys.forEach((key, i) => {
    scores[key] = values[i];
  });

  return NextResponse.json({ scores });
}
