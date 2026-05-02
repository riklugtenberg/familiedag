'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { GeluidFragment, GeluidOpdrachtClient } from '@/config/opdrachten';

const FRAGMENT_DUUR = 10;

function fragmentDuurSec(fragment: Pick<GeluidFragment, 'startTijd' | 'eindTijd'>): number {
  const startTijd = Math.max(0, fragment.startTijd);
  return fragment.eindTijd !== undefined
    ? Math.max(0, fragment.eindTijd - startTijd)
    : FRAGMENT_DUUR;
}

type Props = {
  opdracht: GeluidOpdrachtClient;
  teamNaam: string;
};

export default function GeluidOpdracht({ opdracht, teamNaam }: Props) {
  const [antwoorden, setAntwoorden] = useState<Array<string>>(() =>
    opdracht.fragmenten.map(() => '')
  );
  const [speeltIndex, setSpeeltIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  const audioRefs = useRef<Array<HTMLAudioElement | null>>(
    new Array(opdracht.fragmenten.length).fill(null)
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speeltIndexRef = useRef<number | null>(null);

  useEffect(() => {
    speeltIndexRef.current = speeltIndex;
  }, [speeltIndex]);

  function stopHuidig() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const idx = speeltIndexRef.current;
    if (idx !== null) {
      try {
        audioRefs.current[idx]?.pause();
      } catch {
        /* negeer */
      }
    }
    setSpeeltIndex(null);
  }

  function toggleSpelen(index: number) {
    if (speeltIndex === index) {
      stopHuidig();
      return;
    }
    stopHuidig();

    const fragment = opdracht.fragmenten[index];
    const audio = audioRefs.current[index];
    if (!audio) return;

    const startTijd = Math.max(0, fragment.startTijd);
    const duurSec = fragmentDuurSec(fragment);
    try {
      audio.pause();
      audio.currentTime = startTijd;
      void audio.play();
    } catch {
      return;
    }

    setSpeeltIndex(index);
    timerRef.current = setTimeout(() => {
      try {
        audio.pause();
      } catch {
        /* negeer */
      }
      setSpeeltIndex(null);
      timerRef.current = null;
    }, duurSec * 1000);
  }

  function updateAntwoord(index: number, waarde: string) {
    const nieuw = [...antwoorden];
    nieuw[index] = waarde;
    setAntwoorden(nieuw);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBezig(true);
    setFout('');
    try {
      const teSturen = antwoorden.map((a) => a.trim());
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
          Jullie antwoorden zijn ontvangen.
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

  return (
    <div className="min-h-screen flex flex-col p-6 pb-12 bg-white max-w-lg mx-auto">
      <div className="hidden" aria-hidden>
        {opdracht.fragmenten.map((fragment, i) => (
          <audio
            key={fragment.id}
            ref={(el) => {
              audioRefs.current[i] = el;
            }}
            src={fragment.audioSrc}
            preload="auto"
            onEnded={() => {
              if (speeltIndexRef.current !== i) return;
              if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
              }
              setSpeeltIndex(null);
            }}
          />
        ))}
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{teamNaam}</p>
        <h1 className="text-2xl font-bold mt-1">{opdracht.naam}</h1>
        {opdracht.ondertitel ? (
          <p className="text-sm text-gray-600 mt-2 leading-snug">{opdracht.ondertitel}</p>
        ) : null}
        <p className="text-base text-gray-600 mt-2">
          Druk op ▶ om een fragment te horen. Typ kort wat je denkt te horen (geen komma-lijsten
          nodig — één goede omschrijving is genoeg).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {opdracht.fragmenten.map((fragment, i) => (
          <div
            key={fragment.id}
            className="border-2 border-gray-200 rounded-2xl p-4 flex flex-col gap-4"
          >
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => toggleSpelen(i)}
                className="shrink-0 w-16 h-16 rounded-full bg-violet-600 text-white text-2xl flex items-center justify-center active:bg-violet-700 shadow-md"
                aria-label={speeltIndex === i ? 'Pauzeer' : 'Speel geluid af'}
              >
                {speeltIndex === i ? '⏸' : '▶'}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold">Geluid {i + 1}</p>
                <p className="text-sm text-gray-500">
                  {speeltIndex === i
                    ? 'Speelt af…'
                    : `Fragment van ${fragmentDuurSec(fragment)} s.`}
                </p>
              </div>
            </div>

            <input
              type="text"
              placeholder="Wat hoor je?"
              value={antwoorden[i]}
              onChange={(e) => updateAntwoord(i, e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-violet-500 focus:outline-none"
              style={{ minHeight: '56px', fontSize: '16px' }}
              autoComplete="off"
            />
          </div>
        ))}

        {fout ? <p className="text-red-600 text-base">{fout}</p> : null}

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
