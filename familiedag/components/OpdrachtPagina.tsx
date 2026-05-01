'use client';

import { useState, useEffect, startTransition } from 'react';
import type { Opdracht } from '@/config/opdrachten';
import TeamKiezer from './TeamKiezer';
import QuizOpdracht from './QuizOpdracht';
import MuziekOpdracht from './MuziekOpdracht';
import FotoOpdracht from './FotoOpdracht';
import TimingOpdracht from './TimingOpdracht';
import EmojiOpdracht from './EmojiOpdracht';
import { getTeamFromCookie } from '@/lib/teamCookie';
import { saveSessionTeam } from '@/lib/sessionClient';

type SubmissionStatus = {
  submitted: boolean;
  antwoorden: unknown;
};

function isVoltooid(type: string, status: SubmissionStatus): boolean {
  if (!status.submitted) return false;
  if (type === 'timing') {
    const a = status.antwoorden as { voltooid?: boolean } | null;
    return Boolean(a?.voltooid);
  }
  return true;
}

async function fetchSubmissionStatus(
  team: string,
  opdrachtId: string
): Promise<SubmissionStatus> {
  const res = await fetch(
    `/api/submission-status?teamNaam=${encodeURIComponent(team)}&opdrachtId=${encodeURIComponent(opdrachtId)}`
  );
  if (!res.ok) throw new Error('status');
  const data = (await res.json()) as { submitted?: boolean; antwoorden?: unknown };
  return { submitted: Boolean(data.submitted), antwoorden: data.antwoorden ?? null };
}

type Props = {
  opdracht: Opdracht;
};

export default function OpdrachtPagina({ opdracht }: Props) {
  const [teamNaam, setTeamNaam] = useState<string | null>(null);
  const [alGedaan, setAlGedaan] = useState(false);
  const [bestaandeAntwoorden, setBestaandeAntwoorden] = useState<unknown>(null);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    const opgeslagen = getTeamFromCookie();

    if (!opgeslagen) {
      startTransition(() => setGeladen(true));
      return;
    }

    if (opdracht.type === 'gepland') {
      startTransition(() => {
        setTeamNaam(opgeslagen);
        setGeladen(true);
      });
      return;
    }

    startTransition(() => setTeamNaam(opgeslagen));
    let cancelled = false;

    (async () => {
      try {
        const status = await fetchSubmissionStatus(opgeslagen, opdracht.id);
        if (!cancelled) {
          const voltooid = isVoltooid(opdracht.type, status);
          startTransition(() => {
            setAlGedaan(voltooid);
            setBestaandeAntwoorden(status.antwoorden);
          });
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
  }, [opdracht.id, opdracht.type]);

  async function handleTeamSelected(team: string) {
    const ok = await saveSessionTeam(team);
    if (!ok) return;

    if (opdracht.type === 'gepland') {
      setTeamNaam(team);
      setGeladen(true);
      return;
    }

    setTeamNaam(team);
    setGeladen(false);
    try {
      const status = await fetchSubmissionStatus(team, opdracht.id);
      setAlGedaan(isVoltooid(opdracht.type, status));
      setBestaandeAntwoorden(status.antwoorden);
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

  if (opdracht.type === 'gepland') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-7xl mb-6">📋</div>
        <h2 className="text-2xl font-bold text-center text-gray-900">{opdracht.naam}</h2>
        <p className="text-lg text-gray-500 text-center mt-4 max-w-sm">
          Deze opdracht wordt later toegevoegd. Kom later nog eens terug.
        </p>
        <p className="text-sm text-gray-400 mt-6">Team: {teamNaam}</p>
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

  if (opdracht.type === 'emoji') {
    return <EmojiOpdracht opdracht={opdracht} teamNaam={teamNaam} />;
  }

  if (opdracht.type === 'timing') {
    const a = bestaandeAntwoorden as { pogingen?: number[] } | null;
    return (
      <TimingOpdracht
        opdracht={opdracht}
        teamNaam={teamNaam}
        initialPogingen={a?.pogingen ?? []}
      />
    );
  }

  return null;
}
