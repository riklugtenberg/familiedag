import { NextRequest, NextResponse } from 'next/server';
import { storageSet } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { teamNaam, opdrachtId, antwoorden } = body;

  if (!teamNaam || !opdrachtId || antwoorden === undefined) {
    return NextResponse.json({ error: 'Ontbrekende velden' }, { status: 400 });
  }

  const key = `team:${teamNaam}:opdracht:${opdrachtId}`;
  await storageSet(key, {
    teamNaam,
    opdrachtId,
    antwoorden,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
