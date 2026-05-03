'use client';

import { useState, useEffect, startTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FraudeMeldenPanel from '@/components/FraudeMeldenPanel';
import { getTeamFromCookie } from '@/lib/teamCookie';

export default function MeldingPage() {
  const router = useRouter();
  const [team, setTeam] = useState<string | null>(null);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setTeam(getTeamFromCookie());
      setGeladen(true);
    });
  }, []);

  useEffect(() => {
    if (!geladen) return;
    if (!team) {
      router.replace(`/team?next=${encodeURIComponent('/melding')}`);
    }
  }, [geladen, team, router]);

  if (!geladen) return null;
  if (!team) return null;

  return (
    <main className="min-h-screen flex flex-col items-center p-6 bg-linear-to-b from-red-50 to-white">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between pt-4 mb-6">
          <h1 className="text-xl font-bold text-gray-900">🚨 Fraude melden</h1>
          <Link
            href={`/team?next=${encodeURIComponent('/melding')}`}
            className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 active:bg-gray-50"
            style={{ minHeight: '44px' }}
          >
            <span>{team}</span>
            <span className="text-gray-400 text-xs">✎</span>
          </Link>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Stuur bewijs naar de jury. Na goedkeuring krijgt jullie team een bonuspunt en het andere
          team een strafpunt.
        </p>

        <FraudeMeldenPanel melderTeam={team} />
      </div>
    </main>
  );
}
