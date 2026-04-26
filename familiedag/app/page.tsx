'use client';

import { useState, useEffect, startTransition } from 'react';
import Link from 'next/link';
import { opdrachten } from '@/config/opdrachten';
import TeamKiezer from '@/components/TeamKiezer';
import FraudeMeldenPanel from '@/components/FraudeMeldenPanel';
import { getTeamFromCookie } from '@/lib/teamCookie';
import { saveSessionTeam } from '@/lib/sessionClient';

const typeEmoji: Record<string, string> = {
  quiz: '📝',
  muziek: '🎵',
  foto: '📷',
  timing: '⏱',
};

export default function HomePage() {
  const [team, setTeam] = useState<string | null>(null);
  const [wijzigenOpen, setWijzigenOpen] = useState(false);
  const [geladen, setGeladen] = useState(false);
  /** null = laden van Redis */
  const [ingeleverd, setIngeleverd] = useState<Record<string, boolean> | null>(null);
  const [pogingen, setPogingen] = useState<Record<string, { gedaan: number; max: number }>>({});

  useEffect(() => {
    startTransition(() => {
      setTeam(getTeamFromCookie());
      setGeladen(true);
    });
  }, []);

  useEffect(() => {
    if (!team || wijzigenOpen) {
      setIngeleverd(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/submission-overview?teamNaam=${encodeURIComponent(team)}`
        );
        if (!res.ok) throw new Error();
        const data = (await res.json()) as {
          submitted?: Record<string, boolean>;
          pogingen?: Record<string, { gedaan: number; max: number }>;
        };
        if (!cancelled) {
          setIngeleverd(data.submitted ?? {});
          setPogingen(data.pogingen ?? {});
        }
      } catch {
        if (!cancelled) setIngeleverd({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [team, wijzigenOpen]);

  async function handleTeamSelected(nieuwTeam: string) {
    const ok = await saveSessionTeam(nieuwTeam);
    if (!ok) return;
    setTeam(nieuwTeam);
    setWijzigenOpen(false);
  }

  // Voorkom flash
  if (!geladen) return null;

  if (!team || wijzigenOpen) {
    return (
      <TeamKiezer
        huidigTeam={team ?? undefined}
        onTeamSelected={handleTeamSelected}
        onAnnuleren={wijzigenOpen ? () => setWijzigenOpen(false) : undefined}
      />
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-6 bg-linear-to-b from-blue-50 to-white">
      <div className="w-full max-w-sm">
        {/* Top bar */}
        <div className="flex items-center justify-between pt-4 mb-8">
          <div className="text-2xl font-bold text-gray-900">🎉 Familiedag Lugtenbergjes</div>
          <button
            onClick={() => setWijzigenOpen(true)}
            className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 active:bg-gray-50"
            style={{ minHeight: '44px' }}
          >
            <span>{team}</span>
            <span className="text-gray-400 text-xs">✎</span>
          </button>
        </div>

        {/* Opdrachten lijst */}
        <div className="flex flex-col gap-4">
          {opdrachten.map((opdracht) => {
            const done =
              ingeleverd !== null ? Boolean(ingeleverd[opdracht.id]) : null;

            return (
              <Link
                key={opdracht.id}
                href={`/opdracht/${opdracht.id}`}
                className="flex items-center gap-4 bg-white border-2 border-gray-200 rounded-2xl p-5 active:bg-gray-50 shadow-sm"
                style={{ minHeight: '80px' }}
              >
                <span className="text-3xl">{typeEmoji[opdracht.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-gray-900">{opdracht.naam}</p>
                  {opdracht.type === 'quiz' && opdracht.ondertitel ? (
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                        {opdracht.ondertitel}
                      </p>
                    ) : null}
                  <p className="text-sm text-gray-500 capitalize">
                    {opdracht.type} opdracht
                  </p>
                  <p className="text-sm mt-1 text-gray-600">
                    {done === null && (
                      <span className="text-gray-400">Status laden…</span>
                    )}
                    {done === true && (
                      <span>
                        Ingeleverd <span className="text-green-600">✅</span>
                      </span>
                    )}
                    {done === false && pogingen[opdracht.id] && (
                      <span className="text-orange-500 font-medium">
                        Bezig — {pogingen[opdracht.id].gedaan}/{pogingen[opdracht.id].max} pogingen 🔄
                      </span>
                    )}
                    {done === false && !pogingen[opdracht.id] && (
                      <span>
                        Nog niet ingeleverd <span className="text-red-500">❌</span>
                      </span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-gray-400 text-xl">→</span>
              </Link>
            );
          })}
        </div>

        <FraudeMeldenPanel melderTeam={team} />

        <div className="mt-8 flex justify-center gap-6">
          <Link href="/qr" className="text-sm text-gray-400 underline">
            QR-codes
          </Link>
          <Link href="/admin" className="text-sm text-gray-400 underline">
            Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
