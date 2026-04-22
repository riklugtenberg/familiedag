import { NextRequest, NextResponse } from 'next/server';
import { storageGet } from '@/lib/storage';
import { teams } from '@/config/opdrachten';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teamNaam = searchParams.get('teamNaam');
  const opdrachtId = searchParams.get('opdrachtId');

  if (!teamNaam || !opdrachtId) {
    return NextResponse.json({ error: 'Ontbrekende parameters' }, { status: 400 });
  }

  if (!teams.includes(teamNaam)) {
    return NextResponse.json({ error: 'Onbekend team' }, { status: 400 });
  }

  const key = `team:${teamNaam}:opdracht:${opdrachtId}`;
  const data = await storageGet(key);
  return NextResponse.json({ submitted: data !== null });
}
