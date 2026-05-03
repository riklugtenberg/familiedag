import { NextRequest, NextResponse } from 'next/server';
import { teams, opdrachten } from '@/config/opdrachten';
import { storageDelete } from '@/lib/storage';

const ADMIN_PIN = '1212';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.pin !== ADMIN_PIN) {
    return NextResponse.json({ error: 'Onbevoegd' }, { status: 401 });
  }

  const opdrachtId = body.opdrachtId as string | undefined;
  if (!opdrachtId || !opdrachten.some((o) => o.id === opdrachtId)) {
    return NextResponse.json({ error: 'Ongeldige opdracht' }, { status: 400 });
  }

  if (body.wisAllesVoorOpdracht === true) {
    const keys: Array<string> = [];
    for (const t of teams) {
      keys.push(`team:${t}:opdracht:${opdrachtId}`);
      keys.push(`juryScore:${opdrachtId}:${t}`);
    }
    await storageDelete(keys);
    return NextResponse.json({ ok: true });
  }

  const teamNaam = body.teamNaam as string | undefined;
  if (!teamNaam || !teams.includes(teamNaam)) {
    return NextResponse.json({ error: 'Ongeldig team' }, { status: 400 });
  }

  await storageDelete([
    `team:${teamNaam}:opdracht:${opdrachtId}`,
    `juryScore:${opdrachtId}:${teamNaam}`,
  ]);

  return NextResponse.json({ ok: true });
}
