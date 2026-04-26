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
  const pogingen: Record<string, { gedaan: number; max: number }> = {};

  opdrachten.forEach((o, i) => {
    const data = values[i] as { antwoorden?: { voltooid?: boolean; pogingen?: number[] } } | null;
    if (o.type === 'timing') {
      const voltooid = Boolean(data?.antwoorden?.voltooid);
      submitted[o.id] = voltooid;
      if (data && !voltooid) {
        pogingen[o.id] = {
          gedaan: data.antwoorden?.pogingen?.length ?? 0,
          max: o.maxPogingen ?? 3,
        };
      }
    } else {
      submitted[o.id] = data !== null;
    }
  });

  return NextResponse.json({ submitted, pogingen });
}
