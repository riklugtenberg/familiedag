'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Link from 'next/link';
import type { KaartOpdrachtClient } from '@/config/opdrachten';

const NederlandLeafletKlik = dynamic(() => import('@/components/NederlandLeafletKlik'), {
  ssr: false,
  loading: () => (
    <div
      className="flex w-full min-h-[280px] h-[min(52vh,440px)] items-center justify-center rounded-2xl border-2 border-blue-200 bg-slate-100 text-slate-500"
      role="status"
    >
      Kaart laden…
    </div>
  ),
});

export type KaartTeamAntwoord = { lat: number; lng: number };

type Props = {
  opdracht: KaartOpdrachtClient;
  teamNaam: string;
};

function initAntwoorden(n: number): Array<KaartTeamAntwoord | null> {
  return Array.from({ length: n }, () => null);
}

export default function KaartOpdracht({ opdracht, teamNaam }: Props) {
  const [huidigeVraag, setHuidigeVraag] = useState(0);
  const [antwoorden, setAntwoorden] = useState<Array<KaartTeamAntwoord | null>>(() =>
    initAntwoorden(opdracht.vragen.length)
  );
  const [submitted, setSubmitted] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  const vraag = opdracht.vragen[huidigeVraag];
  const isLaatste = huidigeVraag === opdracht.vragen.length - 1;
  const huidigAntwoord = antwoorden[huidigeVraag];

  function zetMarker(pos: KaartTeamAntwoord) {
    const nieuw = [...antwoorden];
    nieuw[huidigeVraag] = pos;
    setAntwoorden(nieuw);
  }

  async function handleVolgende() {
    if (!huidigAntwoord) return;
    if (!isLaatste) {
      setHuidigeVraag(huidigeVraag + 1);
      return;
    }
    setBezig(true);
    setFout('');
    if (antwoorden.some((a) => !a)) {
      setBezig(false);
      setFout('Niet alle vragen hebben een stip op de kaart.');
      return;
    }
    const teSturen = antwoorden.map((a) => ({
      lat: Number(a!.lat.toFixed(5)),
      lng: Number(a!.lng.toFixed(5)),
    }));
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamNaam, opdrachtId: opdracht.id, antwoorden: teSturen }),
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
          Jullie keuzes op de kaart zijn ontvangen.
        </p>
        <Link
          href="/"
          className="mt-10 w-full max-w-xs bg-blue-600 text-white text-xl font-bold rounded-xl py-4 text-center active:bg-blue-700"
          style={{
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ← Terug naar beginscherm
        </Link>
      </div>
    );
  }

  const magVerder = Boolean(huidigAntwoord);

  return (
    <div className="min-h-screen flex flex-col p-6 bg-white max-w-lg mx-auto w-full">
      <div className="mb-4">
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{teamNaam}</p>
        <h1 className="text-2xl font-bold mt-1">{opdracht.naam}</h1>
        {opdracht.ondertitel ? (
          <p className="text-sm text-gray-500 mt-1 leading-snug">{opdracht.ondertitel}</p>
        ) : null}
        <p className="text-base text-gray-500 mt-1">
          Vraag {huidigeVraag + 1} van {opdracht.vragen.length}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((huidigeVraag + 1) / opdracht.vragen.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <p className="text-xl font-semibold leading-snug">{vraag.vraag}</p>
        <p className="text-sm text-gray-600">
          Verschuif de kaart met één vinger; zoom met twee vingers. Tik waar je stip moet staan;
          tik ergens anders om te verplaatsen. De jury beoordeelt straks wie het dichtst bij zit.
        </p>
        <NederlandLeafletKlik
          mapKey={huidigeVraag}
          marker={huidigAntwoord}
          onPlaatsMarker={zetMarker}
        />
      </div>

      {fout ? <p className="text-red-600 text-base mt-4">{fout}</p> : null}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => setHuidigeVraag((v) => v - 1)}
          disabled={huidigeVraag === 0}
          className="flex-1 bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl py-4 disabled:opacity-30 active:bg-gray-200"
          style={{ minHeight: '60px' }}
        >
          ← Vorige
        </button>
        <button
          type="button"
          onClick={handleVolgende}
          disabled={!magVerder || bezig}
          className="flex-[1.4] bg-blue-600 text-white text-xl font-bold rounded-xl py-4 disabled:opacity-40 active:bg-blue-700"
          style={{ minHeight: '60px' }}
        >
          {bezig ? 'Bezig...' : isLaatste ? 'Insturen ✓' : 'Volgende →'}
        </button>
      </div>
    </div>
  );
}
