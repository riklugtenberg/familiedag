'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import type { TimingOpdracht as TimingOpdrachtType } from '@/config/opdrachten';

type Props = {
  opdracht: TimingOpdrachtType;
  teamNaam: string;
  initialPogingen?: number[];
};

type Poging = {
  tijd: number; // in milliseconden
};

export default function TimingOpdracht({ opdracht, teamNaam, initialPogingen = [] }: Props) {
  const maxPogingen = opdracht.maxPogingen ?? 3;
  const [pogingen, setPogingen] = useState<Poging[]>(
    () => initialPogingen.map((tijd) => ({ tijd }))
  );
  const [lopend, setLopend] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const startTijdRef = useRef<number | null>(null);

  const aantalGedaan = pogingen.length;
  const klaar = aantalGedaan >= maxPogingen;

  function formatTijd(ms: number): string {
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function afwijking(ms: number): number {
    return Math.abs(ms / 1000 - opdracht.doelTijd);
  }

  function bestePogingIndex(lijst: Poging[]): number {
    if (lijst.length === 0) return -1;
    return lijst.reduce(
      (best, p, i) => (afwijking(p.tijd) < afwijking(lijst[best].tijd) ? i : best),
      0
    );
  }

  function handleStart() {
    if (lopend || klaar) return;
    startTijdRef.current = performance.now();
    setLopend(true);
  }

  async function handleStop() {
    if (!lopend || startTijdRef.current === null) return;
    const verstreken = performance.now() - startTijdRef.current;
    startTijdRef.current = null;
    setLopend(false);

    const nieuwePogingen = [...pogingen, { tijd: verstreken }];
    setPogingen(nieuwePogingen);

    setBezig(true);
    setFout('');
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamNaam,
          opdrachtId: opdracht.id,
          antwoorden: {
            pogingen: nieuwePogingen.map((p) => p.tijd),
            besteTijd: nieuwePogingen[bestePogingIndex(nieuwePogingen)].tijd,
            doelTijd: opdracht.doelTijd * 1000,
            voltooid: nieuwePogingen.length >= maxPogingen,
          },
        }),
      });
      if (!res.ok) throw new Error();
      if (nieuwePogingen.length >= maxPogingen) setSubmitted(true);
    } catch {
      setFout('Er ging iets mis bij het opslaan.');
    } finally {
      setBezig(false);
    }
  }

  const beste = bestePogingIndex(pogingen);

  return (
    <div className="min-h-screen flex flex-col p-6 pb-12 bg-white max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
          {teamNaam}
        </p>
        <h1 className="text-2xl font-bold mt-1">{opdracht.naam}</h1>
      </div>

      {/* Uitleg of succesbanner */}
      {submitted ? (
        <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="text-3xl">✅</span>
          <p className="text-lg text-green-800 font-semibold leading-snug">
            Ingestuurd! Jullie beste poging: <span className="font-bold">{formatTijd(pogingen[beste].tijd)}</span>
            {' '}(± {afwijking(pogingen[beste].tijd).toFixed(2)}s van {opdracht.doelTijd}s)
          </p>
        </div>
      ) : (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
          <p className="text-lg text-blue-800 leading-snug">
            Stop de timer op precies{' '}
            <span className="font-bold">{opdracht.doelTijd} seconden</span>.
            Je hebt{' '}
            <span className="font-bold">{maxPogingen} pogingen</span>.
            De timer is verborgen — gebruik je gevoel!
          </p>
        </div>
      )}

      {/* Pogingen teller */}
      <p className="text-sm font-semibold text-gray-600 mb-4 text-center">
        Poging {Math.min(aantalGedaan + 1, maxPogingen)} van {maxPogingen}
      </p>

      {/* Timer display — altijd verborgen tijdens het lopen */}
      <div className="flex items-center justify-center mb-8">
        <div
          className={`w-48 h-48 rounded-full border-8 flex items-center justify-center transition-colors ${
            lopend
              ? 'border-orange-400 bg-orange-50'
              : klaar
              ? 'border-gray-200 bg-gray-50'
              : 'border-blue-400 bg-blue-50'
          }`}
        >
          <span className="text-2xl font-bold text-gray-700">
            {lopend ? '⏱ Bezig…' : bezig ? 'Opslaan…' : klaar ? 'Klaar!' : 'Klaar?'}
          </span>
        </div>
      </div>

      {/* Start / Stop knop */}
      {!klaar && (
        <div className="mb-6">
          {!lopend ? (
            <button
              onClick={handleStart}
              disabled={bezig}
              className="w-full bg-green-600 text-white text-2xl font-bold rounded-2xl active:bg-green-700 disabled:opacity-40"
              style={{ minHeight: '80px' }}
            >
              ▶ START
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="w-full bg-red-600 text-white text-2xl font-bold rounded-2xl active:bg-red-700"
              style={{ minHeight: '80px' }}
            >
              ■ STOP
            </button>
          )}
        </div>
      )}

      {/* Resultaten */}
      {pogingen.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-600 mb-3">Jouw pogingen:</p>
          <ul className="flex flex-col gap-2">
            {pogingen.map((p, i) => {
              const afwMs = afwijking(p.tijd);
              const isBeste = i === beste && pogingen.length > 1;
              return (
                <li
                  key={i}
                  className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 ${
                    isBeste
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <span className="font-semibold text-gray-700">
                    Poging {i + 1}
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900 mr-2">
                      {formatTijd(p.tijd)}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        afwMs < 0.5
                          ? 'text-green-600'
                          : afwMs < 2
                          ? 'text-orange-500'
                          : 'text-red-500'
                      }`}
                    >
                      {afwMs < 0.01
                        ? 'Perfect!'
                        : `± ${afwMs.toFixed(2)}s`}
                    </span>
                    {isBeste && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                        Beste
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {fout && <p className="text-red-600 text-base mt-2">{fout}</p>}

      {submitted && (
        <Link
          href="/"
          className="mt-4 w-full bg-blue-600 text-white text-xl font-bold rounded-xl py-4 text-center active:bg-blue-700"
          style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ← Terug naar beginscherm
        </Link>
      )}
    </div>
  );
}
