'use client';

import { Suspense, useEffect, useState, startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TeamKiezer from '@/components/TeamKiezer';
import { getTeamFromCookie } from '@/lib/teamCookie';
import { saveSessionTeam } from '@/lib/sessionClient';

/** Alleen interne paden; voorkomt open redirects. */
function normalizeNextPath(raw: string | null): string {
  if (!raw || typeof raw !== 'string') return '/';
  const t = raw.trim();
  if (!t.startsWith('/') || t.startsWith('//')) return '/';
  return t;
}

function TeamKiezenInhoud() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = normalizeNextPath(searchParams.get('next'));
  const [huidigTeam, setHuidigTeam] = useState<string | undefined>(undefined);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setHuidigTeam(getTeamFromCookie() ?? undefined);
      setGeladen(true);
    });
  }, []);

  async function handleTeamSelected(team: string) {
    const ok = await saveSessionTeam(team);
    if (!ok) return;
    router.push(nextPath);
  }

  function handleAnnuleren() {
    router.push(nextPath);
  }

  if (!geladen) return null;

  return (
    <TeamKiezer
      huidigTeam={huidigTeam}
      onTeamSelected={handleTeamSelected}
      onAnnuleren={huidigTeam ? handleAnnuleren : undefined}
    />
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={null}>
      <TeamKiezenInhoud />
    </Suspense>
  );
}
