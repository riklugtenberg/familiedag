'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { opdrachten } from '@/config/opdrachten';
import TeamKiezer from '@/components/TeamKiezer';

const TEAM_KEY = 'familiedag:team';

const typeEmoji: Record<string, string> = {
  quiz: '📝',
  muziek: '🎵',
  foto: '📷',
};

export default function HomePage() {
  const [team, setTeam] = useState<string | null>(null);
  const [wijzigenOpen, setWijzigenOpen] = useState(false);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    setTeam(localStorage.getItem(TEAM_KEY));
    setGeladen(true);
  }, []);

  function handleTeamSelected(nieuwTeam: string) {
    localStorage.setItem(TEAM_KEY, nieuwTeam);
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
          {opdrachten.map((opdracht) => (
            <Link
              key={opdracht.id}
              href={`/opdracht/${opdracht.id}`}
              className="flex items-center gap-4 bg-white border-2 border-gray-200 rounded-2xl p-5 active:bg-gray-50 shadow-sm"
              style={{ minHeight: '80px' }}
            >
              <span className="text-3xl">{typeEmoji[opdracht.type]}</span>
              <div>
                <p className="text-lg font-bold text-gray-900">{opdracht.naam}</p>
                <p className="text-sm text-gray-500 capitalize">{opdracht.type} opdracht</p>
              </div>
              <span className="ml-auto text-gray-400 text-xl">→</span>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex justify-center gap-6">
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
