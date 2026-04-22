'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { MuziekOpdracht as MuziekOpdrachtType } from '@/config/opdrachten';

type Props = {
  opdracht: MuziekOpdrachtType;
  teamNaam: string;
};

export default function MuziekOpdracht({ opdracht, teamNaam }: Props) {
  const [antwoorden, setAntwoorden] = useState<{ artiest: string; titel: string }[]>(
    opdracht.fragmenten.map(() => ({ artiest: '', titel: '' }))
  );
  const [speeltIndex, setSpeeltIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const audioRefs = useRef<(HTMLAudioElement | null)[]>(
    new Array(opdracht.fragmenten.length).fill(null)
  );

  useEffect(() => {
    const refs = audioRefs.current;
    return () => {
      refs.forEach((a) => {
        if (a) {
          a.pause();
          a.currentTime = 0;
        }
      });
    };
  }, []);

  function toggleSpelen(index: number) {
    const audio = audioRefs.current[index];
    if (!audio) return;

    if (speeltIndex === index) {
      audio.pause();
      setSpeeltIndex(null);
    } else {
      if (speeltIndex !== null) {
        const huidig = audioRefs.current[speeltIndex];
        if (huidig) {
          huidig.pause();
          huidig.currentTime = 0;
        }
      }
      audio.play().catch(() => {});
      setSpeeltIndex(index);
    }
  }

  function updateAntwoord(
    index: number,
    veld: 'artiest' | 'titel',
    waarde: string
  ) {
    const nieuw = [...antwoorden];
    nieuw[index] = { ...nieuw[index], [veld]: waarde };
    setAntwoorden(nieuw);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBezig(true);
    setFout('');
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamNaam, opdrachtId: opdracht.id, antwoorden }),
      });
      if (!res.ok) throw new Error();
      localStorage.setItem(`gedaan:${teamNaam}:${opdracht.id}`, '1');
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
          Jullie antwoorden zijn ontvangen.
        </p>
        <Link
          href="/"
          className="mt-10 w-full max-w-xs bg-blue-600 text-white text-xl font-bold rounded-xl py-4 text-center active:bg-blue-700"
          style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ← Terug naar beginscherm
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 pb-12 bg-white max-w-lg mx-auto">
      <div className="mb-6">
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
          {teamNaam}
        </p>
        <h1 className="text-2xl font-bold mt-1">{opdracht.naam}</h1>
        <p className="text-base text-gray-600 mt-2">
          Herken je de nummers? Vul voor elk fragment de artiest en de titel in.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {opdracht.fragmenten.map((fragment, i) => (
          <div
            key={fragment.id}
            className="border-2 border-gray-200 rounded-2xl p-4 flex flex-col gap-4"
          >
            {/* Play knop + label */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => toggleSpelen(i)}
                className="shrink-0 w-16 h-16 rounded-full bg-blue-600 text-white text-2xl flex items-center justify-center active:bg-blue-700 shadow-md"
                aria-label={speeltIndex === i ? 'Pauzeer' : 'Speel fragment af'}
              >
                {speeltIndex === i ? '⏸' : '▶'}
              </button>
              <div>
                <p className="text-lg font-bold">Fragment {i + 1}</p>
                <p className="text-sm text-gray-500">
                  {speeltIndex === i ? 'Speelt af…' : 'Druk om af te spelen'}
                </p>
              </div>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio
                ref={(el) => {
                  audioRefs.current[i] = el;
                }}
                src={fragment.audioUrl}
                onEnded={() => setSpeeltIndex(null)}
                preload="none"
              />
            </div>

            {/* Invoervelden */}
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Artiest"
                value={antwoorden[i].artiest}
                onChange={(e) => updateAntwoord(i, 'artiest', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-blue-500 focus:outline-none"
                style={{ minHeight: '56px', fontSize: '16px' }}
              />
              <input
                type="text"
                placeholder="Titel van het nummer"
                value={antwoorden[i].titel}
                onChange={(e) => updateAntwoord(i, 'titel', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-blue-500 focus:outline-none"
                style={{ minHeight: '56px', fontSize: '16px' }}
              />
            </div>
          </div>
        ))}

        {fout && <p className="text-red-600 text-base">{fout}</p>}

        <button
          type="submit"
          disabled={bezig}
          className="w-full bg-green-600 text-white text-xl font-bold rounded-xl py-4 disabled:opacity-40 active:bg-green-700 mt-2"
          style={{ minHeight: '60px' }}
        >
          {bezig ? 'Bezig…' : 'Alle antwoorden insturen ✓'}
        </button>
      </form>
    </div>
  );
}
