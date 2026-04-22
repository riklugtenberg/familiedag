'use client';

import { useState } from 'react';
import { teams } from '@/config/opdrachten';

type Props = {
  huidigTeam?: string;
  onTeamSelected: (team: string) => void;
  onAnnuleren?: () => void;
};

export default function TeamKiezer({ huidigTeam, onTeamSelected, onAnnuleren }: Props) {
  const [geselecteerd, setGeselecteerd] = useState(huidigTeam ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!geselecteerd) return;
    onTeamSelected(geselecteerd);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      {onAnnuleren && (
        <button
          onClick={onAnnuleren}
          className="absolute top-4 left-4 text-gray-400 text-base px-3 py-2"
          style={{ minHeight: '48px' }}
        >
          ← Terug
        </button>
      )}
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-3xl font-bold text-center mb-2">Familiedag Lugtenbergjes</h1>
      <p className="text-lg text-gray-600 text-center mb-10">
        {huidigTeam ? 'Kies een ander team' : 'Kies jouw team om te beginnen'}
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <label htmlFor="team" className="text-lg font-semibold text-gray-700">
          Jouw team:
        </label>
        <select
          id="team"
          value={geselecteerd}
          onChange={(e) => setGeselecteerd(e.target.value)}
          className="w-full border-2 border-gray-300 rounded-xl p-4 text-lg bg-white focus:border-blue-500 focus:outline-none"
          style={{ minHeight: '56px', fontSize: '16px' }}
        >
          <option value="">— Selecteer jouw team —</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!geselecteerd}
          className="w-full bg-blue-600 text-white text-xl font-bold rounded-xl py-4 disabled:opacity-40 active:bg-blue-700"
          style={{ minHeight: '60px' }}
        >
          {huidigTeam ? 'Opslaan' : 'Beginnen →'}
        </button>
      </form>
    </div>
  );
}
