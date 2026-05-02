'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { QuizOpdracht as QuizOpdrachtType } from '@/config/opdrachten';
import { isQuizVraagOpen, quizVraagIsBeantwoord } from '@/lib/quizScoring';

type Props = {
  opdracht: QuizOpdrachtType;
  teamNaam: string;
};

function initAntwoorden(opdracht: QuizOpdrachtType): Array<number | string> {
  return opdracht.vragen.map((v) => (isQuizVraagOpen(v) ? '' : -1));
}

export default function QuizOpdracht({ opdracht, teamNaam }: Props) {
  const [huidigeVraag, setHuidigeVraag] = useState(0);
  const [antwoorden, setAntwoorden] = useState<Array<number | string>>(() =>
    initAntwoorden(opdracht)
  );
  const [submitted, setSubmitted] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  const vraag = opdracht.vragen[huidigeVraag];
  const isLaatste = huidigeVraag === opdracht.vragen.length - 1;
  const huidigAntwoord = antwoorden[huidigeVraag];

  function selecteerOptie(index: number) {
    const nieuw = [...antwoorden];
    nieuw[huidigeVraag] = index;
    setAntwoorden(nieuw);
  }

  function zetOpenAntwoord(tekst: string) {
    const nieuw = [...antwoorden];
    nieuw[huidigeVraag] = tekst;
    setAntwoorden(nieuw);
  }

  async function handleVolgende() {
    if (!quizVraagIsBeantwoord(vraag, huidigAntwoord)) return;
    if (!isLaatste) {
      setHuidigeVraag(huidigeVraag + 1);
      return;
    }
    setBezig(true);
    setFout('');
    const teSturen = antwoorden.map((a, i) => {
      const vi = opdracht.vragen[i];
      if (isQuizVraagOpen(vi) && typeof a === 'string') return a.trim();
      return a;
    });
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

  const magVerder = quizVraagIsBeantwoord(vraag, huidigAntwoord);

  return (
    <div className="min-h-screen flex flex-col p-6 bg-white max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
          {teamNaam}
        </p>
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

      {/* Vraag */}
      <div className="flex-1">
        {isQuizVraagOpen(vraag) && vraag.regelBovenInvoer ? (
          <p className="text-base text-gray-600 font-medium mb-3">{vraag.regelBovenInvoer}</p>
        ) : null}
        {'afbeeldingSrc' in vraag && vraag.afbeeldingSrc ? (
          <div className="mb-5 rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={vraag.afbeeldingSrc}
              alt=""
              className="w-full h-auto max-h-56 object-contain mx-auto block"
            />
          </div>
        ) : null}
        <p className="text-xl font-semibold mb-6 leading-snug">{vraag.vraag}</p>
        {isQuizVraagOpen(vraag) ? (
          <input
            type="text"
            value={typeof huidigAntwoord === 'string' ? huidigAntwoord : ''}
            onChange={(e) => zetOpenAntwoord(e.target.value)}
            autoComplete="off"
            className="w-full rounded-2xl border-2 border-gray-200 p-4 text-lg text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none"
            placeholder="Typ je antwoord…"
            style={{ minHeight: '56px' }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {vraag.opties.map((optie, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selecteerOptie(i)}
                className={`w-full text-left rounded-2xl border-2 p-4 text-lg font-medium transition-colors active:scale-[0.98] ${
                  huidigAntwoord === i
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-white text-gray-800'
                }`}
                style={{ minHeight: '64px' }}
              >
                <span className="mr-3 inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-current text-sm font-bold shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                {optie}
              </button>
            ))}
          </div>
        )}
      </div>

      {fout && (
        <p className="text-red-600 text-base mt-4">{fout}</p>
      )}

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
          className="flex-2 bg-blue-600 text-white text-xl font-bold rounded-xl py-4 disabled:opacity-40 active:bg-blue-700"
          style={{ minHeight: '60px' }}
        >
          {bezig ? 'Bezig...' : isLaatste ? 'Insturen ✓' : 'Volgende →'}
        </button>
      </div>
    </div>
  );
}
