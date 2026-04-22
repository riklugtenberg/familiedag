import { NextRequest, NextResponse } from 'next/server';
import { teams } from '@/config/opdrachten';
import { TEAM_COOKIE_NAME } from '@/lib/teamCookie';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const teamNaam = body.teamNaam as string | undefined;

  if (!teamNaam || !teams.includes(teamNaam)) {
    return NextResponse.json({ error: 'Onbekend team' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(TEAM_COOKIE_NAME, encodeURIComponent(teamNaam), {
    httpOnly: false,
    path: '/',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
