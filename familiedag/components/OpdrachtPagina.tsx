'use client';

import { useState, useEffect } from 'react';
import type { Opdracht } from '@/config/opdrachten';
import TeamKiezer from './TeamKiezer';
import QuizOpdracht from './QuizOpdracht';
import MuziekOpdracht from './MuziekOpdracht';
import FotoOpdracht from './FotoOpdracht';

const TEAM_KEY = 'familiedag:team';

type Props = {
  opdracht: Opdracht;
};

export default function OpdrachtPagina({ opdracht }: Props) {
  const [teamNaam, setTeamNaam] = useState<string | null>(null);
  const [alGedaan, setAlGedaan] = useState(false);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    const opgeslagen = localStorage.getItem(TEAM_KEY);
    if (opgeslagen) {
      setTeamNaam(opgeslagen);
      if (localStorage.getItem(`gedaan:${opgeslagen}:${opdracht.id}`)) {
        setAlGedaan(true);
      }
    }
    setGeladen(true);
  }, [opdracht.id]);

  function handleTeamSelected(team: string) {
    localStorage.setItem(TEAM_KEY, team);
    setTeamNaam(team);
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
