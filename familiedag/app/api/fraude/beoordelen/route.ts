import { NextRequest, NextResponse } from 'next/server';
import { storageGet, storageSet } from '@/lib/storage';
import type { FraudeMelding } from '../route';

const ADMIN_PIN = '1212';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { pin, id, status } = body as { pin?: string; id?: string; status?: 'goedgekeurd' | 'afgewezen' };

  if (pin !== ADMIN_PIN) {
    return NextResponse.json({ error: 'Onbevoegd' }, { status: 401 });
  }
  if (!id || (status !== 'goedgekeurd' && status !== 'afgewezen')) {
    return NextResponse.json({ error: 'Ongeldige invoer' }, { status: 400 });
  }

  const melding = await storageGet<FraudeMelding>(`fraude:${id}`);
  if (!melding) {
    return NextResponse.json({ error: 'Melding niet gevonden' }, { status: 404 });
  }

  await storageSet(`fraude:${id}`, { ...melding, status });
  return NextResponse.json({ success: true });
}
