'use client';

import { useState, useEffect, startTransition } from 'react';
import type { Opdracht } from '@/config/opdrachten';
import TeamKiezer from './TeamKiezer';
import QuizOpdracht from './QuizOpdracht';
import MuziekOpdracht from './MuziekOpdracht';
import FotoOpdracht from './FotoOpdracht';
import { getTeamFromCookie } from '@/lib/teamCookie';
import { saveSessionTeam } from '@/lib/sessionClient';

async function fetchSubmissionStatus(
  team: string,
  opdrachtId: string
): Promise<boolean> {
  const res = await fetch(
    `/api/submission-status?teamNaam=${encodeURIComponent(team)}&opdrachtId=${encodeURIComponent(opdrachtId)}`
  );
  if (!res.ok) throw new Error('status');
  const data = (await res.json()) as { submitted?: boolean };
  return Boolean(data.submitted);
}

type Props = {
  opdracht: Opdracht;
};

export default function OpdrachtPagina({ opdracht }: Props) {
  const [teamNaam, setTeamNaam] = useState<string | null>(null);
  const [alGedaan, setAlGedaan] = useState(false);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    const opgeslagen = getTeamFromCookie();

    if (!opgeslagen) {
      startTransition(() => setGeladen(true));
      return;
    }

    startTransition(() => setTeamNaam(opgeslagen));
    let cancelled = false;

    (async () => {
      try {
        const submitted = await fetchSubmissionStatus(opgeslagen, opdracht.id);
        if (!cancelled) {
          startTransition(() => setAlGedaan(submitted));
        }
      } catch {
        if (!cancelled) startTransition(() => setAlGedaan(false));
      } finally {
        if (!cancelled) startTransition(() => setGeladen(true));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [opdracht.id]);

  async function handleTeamSelected(team: string) {
    const ok = await saveSessionTeam(team);
    if (!ok) return;

    setTeamNaam(team);
    setGeladen(false);
    try {
      const submitted = await fetchSubmissionStatus(team, opdracht.id);
      setAlGedaan(submitted);
    } catch {
      setAlGedaan(false);
    } finally {
      setGeladen(true);
    }
  }

  // Voorkom flash van teamkiezer bij page-load
  if (!geladen) return null;

  if (!teamNaam) {
    return <TeamKiezer onTeamSelected={handleTeamSelected} />;
  }

  if (alGedaan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-8xl mb-6">✅</div>
        <h2 className="text-3xl font-bold text-center text-green-600">Al ingestuurd!</h2>
        <p className="text-lg text-gray-500 text-center mt-3">
          {teamNaam} heeft deze opdracht al gedaan.
        </p>
      </div>
    );
  }

  if (opdracht.type === 'quiz') {
    return <QuizOpdracht opdracht={opdracht} teamNaam={teamNaam} />;
  }

  if (opdracht.type === 'muziek') {
    return <MuziekOpdracht opdracht={opdracht} teamNaam={teamNaam} />;
  }

  if (opdracht.type === 'foto') {
    return <FotoOpdracht opdracht={opdracht} teamNaam={teamNaam} />;
  }

  return null;
}
