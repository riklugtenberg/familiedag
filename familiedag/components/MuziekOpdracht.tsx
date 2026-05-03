'use client';

import { useState, useRef, useEffect } from 'react';
import type {
  MuziekFragment,
  MuziekOpdracht as MuziekOpdrachtType,
} from '@/config/opdrachten';

const FRAGMENT_DUUR = 10;

function fragmentDuurSec(fragment: MuziekFragment): number {
  const startTijd = Math.max(0, fragment.startTijd);
  return fragment.eindTijd !== undefined
    ? Math.max(0, fragment.eindTijd - startTijd)
    : FRAGMENT_DUUR;
}

type Props = {
  opdracht: MuziekOpdrachtType;
  teamNaam: string;
};

export default function MuziekOpdracht({ opdracht, teamNaam }: Props) {
  const [antwoorden, setAntwoorden] = useState<Array<{ artiest: string; titel: string }>>(() =>
    opdracht.fragmenten.map(() => ({ artiest: '', titel: '' }))
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
    const duurSec =
      fragment.eindTijd !== undefined
        ? Math.max(0, fragment.eindTijd - startTijd)
        : FRAGMENT_DUUR;
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

  function updateAntwoord(index: number, veld: 'artiest' | 'titel', waarde: string) {
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
        <p className="text-base text-gray-600 mt-2">
          Herken je de nummers? Vul voor elk fragment de artiest en de titel in.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Je hoort steeds maar een kort stukje van het nummer — niet het hele lied.
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
                className="shrink-0 w-16 h-16 rounded-full bg-blue-600 text-white text-2xl flex items-center justify-center active:bg-blue-700 shadow-md"
                aria-label={speeltIndex === i ? 'Pauzeer' : 'Speel fragment af'}
              >
                {speeltIndex === i ? '⏸' : '▶'}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold">Fragment {i + 1}</p>
                <p className="text-sm text-gray-500">
                  {speeltIndex === i
                    ? 'Speelt af…'
                    : `Druk op ▶ om het fragment te horen (${fragmentDuurSec(fragment)} s — alleen een stukje van het nummer).`}
                </p>
              </div>
            </div>

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
