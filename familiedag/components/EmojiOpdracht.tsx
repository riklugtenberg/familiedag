'use client';

import { useState } from 'react';
import type { EmojiOpdracht as EmojiOpdrachtType } from '@/config/opdrachten';

type Props = {
  opdracht: EmojiOpdrachtType;
  teamNaam: string;
};

export default function EmojiOpdracht({ opdracht, teamNaam }: Props) {
  const [huidige, setHuidige] = useState(0);
  const [antwoorden, setAntwoorden] = useState<string[]>(
    new Array(opdracht.vragen.length).fill('')
  );
  const [submitted, setSubmitted] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  const vraag = opdracht.vragen[huidige];
  const isLaatste = huidige === opdracht.vragen.length - 1;
  const huidigAntwoord = antwoorden[huidige];

  function setAntwoord(waarde: string) {
    const nieuw = [...antwoorden];
    nieuw[huidige] = waarde;
    setAntwoorden(nieuw);
  }

  async function handleVolgende() {
    if (!isLaatste) {
      setHuidige(huidige + 1);
      return;
    }
    setBezig(true);
    setFout('');
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamNaam,
          opdrachtId: opdracht.id,
          antwoorden,
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setFout('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setBezig(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-8xl mb-6">✅</div>
        <h2 className="text-3xl font-bold text-center text-green-600">Ingestuurd!</h2>
        <p className="text-lg text-gray-500 text-center mt-3">
          De jury beoordeelt jullie antwoorden.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 bg-white max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{teamNaam}</p>
        <h1 className="text-2xl font-bold mt-1">{opdracht.naam}</h1>
        {opdracht.ondertitel && (
          <p className="text-sm text-gray-500 mt-1">{opdracht.ondertitel}</p>
        )}
        <p className="text-base text-gray-500 mt-1">
          Vraag {huidige + 1} van {opdracht.vragen.length}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((huidige + 1) / opdracht.vragen.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Emoji display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="bg-gray-50 border-2 border-gray-200 rounded-3xl w-full flex items-center justify-center py-10 px-4">
          <span className="text-6xl tracking-widest">{vraag.emoji}</span>
        </div>

        <div className="w-full">
          <label className="block text-base font-semibold text-gray-700 mb-2">
            {vraag.vraagLabel}
          </label>
          <input
            type="text"
            value={huidigAntwoord}
            onChange={(e) => setAntwoord(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && huidigAntwoord.trim()) handleVolgende(); }}
            placeholder="Typ hier je antwoord…"
            className="w-full border-2 border-gray-300 rounded-2xl px-4 py-4 text-xl focus:border-blue-500 focus:outline-none"
            style={{ minHeight: '64px' }}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>
      </div>

      {fout && <p className="text-red-600 text-base mt-4">{fout}</p>}

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setHuidige((v) => v - 1)}
          disabled={huidige === 0}
          className="flex-1 bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl py-4 disabled:opacity-30 active:bg-gray-200"
          style={{ minHeight: '60px' }}
        >
          ← Vorige
        </button>
        <button
          onClick={handleVolgende}
          disabled={!huidigAntwoord.trim() || bezig}
          className="flex-2 bg-blue-600 text-white text-xl font-bold rounded-xl py-4 disabled:opacity-40 active:bg-blue-700"
          style={{ minHeight: '60px' }}
        >
          {bezig ? 'Bezig...' : isLaatste ? 'Insturen ✓' : 'Volgende →'}
        </button>
      </div>
    </div>
  );
}
