import { NextRequest, NextResponse } from 'next/server';
import { storageSet, storageKeys, storageMget } from '@/lib/storage';
import { teams } from '@/config/opdrachten';

export type FraudeMelding = {
  id: string;
  melderTeam: string;
  beschuldigdTeam: string;
  fotoUrls: string[];
  timestamp: string;
  status: 'open' | 'goedgekeurd' | 'afgewezen';
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { melderTeam, beschuldigdTeam, fotoUrls } = body as Partial<FraudeMelding>;

  if (!melderTeam || !beschuldigdTeam || !Array.isArray(fotoUrls) || fotoUrls.length === 0) {
    return NextResponse.json({ error: 'Ontbrekende velden' }, { status: 400 });
  }
  if (!teams.includes(melderTeam) || !teams.includes(beschuldigdTeam)) {
    return NextResponse.json({ error: 'Onbekend team' }, { status: 400 });
  }
  if (melderTeam === beschuldigdTeam) {
    return NextResponse.json({ error: 'Je kunt je eigen team niet melden' }, { status: 400 });
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const melding: FraudeMelding = {
    id,
    melderTeam,
    beschuldigdTeam,
    fotoUrls,
    timestamp: new Date().toISOString(),
    status: 'open',
  };

  await storageSet(`fraude:${id}`, melding);
  return NextResponse.json({ success: true, id });
}

export async function GET() {
  const keys = await storageKeys('fraude:*');
  if (keys.length === 0) return NextResponse.json({ meldingen: [] });

  const values = await storageMget(keys);
  const meldingen = values.filter(Boolean) as FraudeMelding[];
  meldingen.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json({ meldingen });
}
