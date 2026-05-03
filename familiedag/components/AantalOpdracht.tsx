'use client';

import { useState } from 'react';
import type { AantalOpdracht as AantalOpdrachtType } from '@/config/opdrachten';

type Props = {
  opdracht: AantalOpdrachtType;
  teamNaam: string;
};

export default function AantalOpdracht({ opdracht, teamNaam }: Props) {
  const [waarde, setWaarde] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  const label = opdracht.veldLabel?.trim() || 'Aantal';

  async function handleSubmit() {
    const n = Number(String(waarde).replace(',', '.'));
    if (!Number.isFinite(n) || n < 0 || !String(waarde).trim()) {
      setFout('Vul een geldig getal in (0 of hoger).');
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
          antwoorden: { aantal: n },
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
          De jury noteert jullie score.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 bg-white max-w-lg mx-auto">
      <div className="mb-6">
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{teamNaam}</p>
        <h1 className="text-2xl font-bold mt-1">{opdracht.naam}</h1>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        <div>
          <label htmlFor="aantal-opdracht" className="block text-base font-semibold text-gray-700 mb-2">
            {label}
          </label>
          <input
            id="aantal-opdracht"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={waarde}
            onChange={(e) => setWaarde(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-lg font-semibold focus:border-blue-500 focus:outline-none"
            style={{ minHeight: '52px' }}
            autoComplete="off"
          />
        </div>

        {fout ? <p className="text-sm text-red-600">{fout}</p> : null}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={bezig}
          className="w-full bg-blue-600 text-white font-bold rounded-xl py-4 text-lg active:bg-blue-700 disabled:opacity-50"
          style={{ minHeight: '52px' }}
        >
          {bezig ? 'Bezig…' : 'Insturen'}
        </button>
      </div>
    </div>
  );
}
