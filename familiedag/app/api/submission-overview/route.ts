import { NextRequest, NextResponse } from 'next/server';
import { teams, opdrachten } from '@/config/opdrachten';
import { storageMget } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const teamNaam = new URL(req.url).searchParams.get('teamNaam');

  if (!teamNaam || !teams.includes(teamNaam)) {
    return NextResponse.json({ error: 'Onbekend team' }, { status: 400 });
  }

  const keys = opdrachten.map((o) => `team:${teamNaam}:opdracht:${o.id}`);
  const values = await storageMget(keys);

  const submitted: Record<string, boolean> = {};
  opdrachten.forEach((o, i) => {
    submitted[o.id] = values[i] !== null;
  });

  return NextResponse.json({ submitted });
}
