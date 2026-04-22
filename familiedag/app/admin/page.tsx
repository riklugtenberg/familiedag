'use client';

import { useState, useEffect } from 'react';
import {
  opdrachten,
  teams,
  type QuizOpdracht,
  type MuziekOpdracht,
  type FotoOpdracht,
} from '@/config/opdrachten';

const ADMIN_PIN = '1212'; // tijdelijk niet in gebruik

type Inzending = {
  teamNaam: string;
  opdrachtId: string;
  antwoorden: unknown;
  timestamp: string;
};

type MuziekJuryScore = { scores: boolean[] };
type FotoJuryScore = { punten: number };
type JuryScoreWaarde = MuziekJuryScore | FotoJuryScore | null;

export default function AdminPage() {
  const [inzendingen, setInzendingen] = useState<Record<string, Inzending>>({});
  const [juryScores, setJuryScores] = useState<Record<string, JuryScoreWaarde>>({});
  const [laden, setLaden] = useState(false);
  const [laadFout, setLaadFout] = useState('');

  useEffect(() => { laadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function laadData() {
    setLaden(true);
    setLaadFout('');
    try {
      const [subRes, scoresRes] = await Promise.all([
        fetch(`/api/admin/submissions?pin=${ADMIN_PIN}`),
        fetch(`/api/scores?pin=${ADMIN_PIN}`),
      ]);
      if (!subRes.ok || !scoresRes.ok) throw new Error();
      const { inzendingen: sub } = await subRes.json();
      const { scores } = await scoresRes.json();
      setInzendingen(sub ?? {});
      setJuryScores(scores ?? {});
    } catch {
      setLaadFout('Laden mislukt. Controleer de KV verbinding.');
    } finally {
      setLaden(false);
    }
  }

  function getInzending(teamNaam: string, opdrachtId: string): Inzending | null {
    return inzendingen[`team:${teamNaam}:opdracht:${opdrachtId}`] ?? null;
  }

  function getJuryScore(opdrachtId: string, teamNaam: string): JuryScoreWaarde {
    return juryScores[`juryScore:${opdrachtId}:${teamNaam}`] ?? null;
  }

  async function slaJuryScoreOp(
    opdrachtId: string,
    teamNaam: string,
    scores: MuziekJuryScore | FotoJuryScore
  ) {
    const key = `juryScore:${opdrachtId}:${teamNaam}`;
    setJuryScores((prev) => ({ ...prev, [key]: scores }));
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: ADMIN_PIN, opdrachtId, teamNaam, scores }),
    });
  }

  function berekenQuizScore(teamNaam: string, opdracht: QuizOpdracht): number {
    const inzending = getInzending(teamNaam, opdracht.id);
    if (!inzending) return 0;
    const antwoorden = inzending.antwoorden as number[];
    if (!Array.isArray(antwoorden)) return 0;
    return opdracht.vragen.reduce(
      (acc, v, i) => acc + (antwoorden[i] === v.correct ? 1 : 0),
      0
    );
  }

  function berekenMuziekScore(teamNaam: string, opdracht: MuziekOpdracht): number {
    const score = getJuryScore(opdracht.id, teamNaam) as MuziekJuryScore | null;
    if (!score?.scores) return 0;
    return score.scores.filter(Boolean).length;
  }

  function berekenFotoScore(teamNaam: string, opdracht: FotoOpdracht): number {
    const score = getJuryScore(opdracht.id, teamNaam) as FotoJuryScore | null;
    return score?.punten ?? 0;
  }

  function berekenTotaal(teamNaam: string): number {
    return opdrachten.reduce((acc, opdracht) => {
      if (opdracht.type === 'quiz') return acc + berekenQuizScore(teamNaam, opdracht);
      if (opdracht.type === 'muziek') return acc + berekenMuziekScore(teamNaam, opdracht);
      if (opdracht.type === 'foto') return acc + berekenFotoScore(teamNaam, opdracht);
      return acc;
    }, 0);
  }

  // --- Admin dashboard ---
  const quizOpdrachten = opdrachten.filter((o): o is QuizOpdracht => o.type === 'quiz');
  const muziekOpdrachten = opdrachten.filter((o): o is MuziekOpdracht => o.type === 'muziek');
  const fotoOpdrachten = opdrachten.filter((o): o is FotoOpdracht => o.type === 'foto');

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <h1 className="text-2xl font-bold">Admin</h1>
          <button
            onClick={laadData}
            disabled={laden}
            className="bg-blue-600 text-white font-bold rounded-xl px-6 py-3 text-base active:bg-blue-700 disabled:opacity-50"
            style={{ minHeight: '48px' }}
          >
            {laden ? 'Laden…' : '🔄 Ververs'}
          </button>
        </div>

        {laadFout && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700">
            {laadFout}
          </div>
        )}

        {/* QUIZ SECTIES */}
        {quizOpdrachten.map((opdracht) => (
          <section key={opdracht.id} className="bg-white rounded-2xl shadow-sm p-5 mb-6">
            <h2 className="text-xl font-bold mb-4">📝 {opdracht.naam}</h2>
            <div className="flex flex-col gap-3">
              {teams.map((team) => {
                const inzending = getInzending(team, opdracht.id);
                const antwoorden = inzending?.antwoorden as number[] | undefined;
                const score = berekenQuizScore(team, opdracht);
                return (
                  <div
                    key={team}
                    className="border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-base">{team}</p>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 font-bold text-base px-3 py-1 rounded-full">
                          {score}/{opdracht.vragen.length}
                        </span>
                        <span className="text-xl">{inzending ? '✅' : '❌'}</span>
                      </div>
                    </div>
                    {!inzending ? (
                      <p className="text-sm text-gray-400">Nog niet ingestuurd</p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {opdracht.vragen.map((vraag, i) => {
                          const gekozen = antwoorden?.[i] ?? -1;
                          const correct = gekozen === vraag.correct;
                          return (
                            <div key={vraag.id} className="flex items-start gap-2 text-sm">
                              <span>{correct ? '✅' : '❌'}</span>
                              <span className="text-gray-600 flex-1">{vraag.vraag}</span>
                              <span className="text-gray-500 shrink-0">
                                → {gekozen >= 0 ? vraag.opties[gekozen] : '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* MUZIEK SECTIES */}
        {muziekOpdrachten.map((opdracht) => (
          <section key={opdracht.id} className="bg-white rounded-2xl shadow-sm p-5 mb-6">
            <h2 className="text-xl font-bold mb-4">🎵 {opdracht.naam}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left">
                    <th className="pb-3 pr-4 font-semibold text-gray-600 whitespace-nowrap">
                      Fragment
                    </th>
                    <th className="pb-3 pr-4 font-semibold text-gray-600 whitespace-nowrap">
                      Correct
                    </th>
                    {teams.map((t) => {
                      const heeftIngestuurd = !!getInzending(t, opdracht.id);
                      return (
                        <th key={t} className="pb-3 pr-4 font-semibold text-gray-600 whitespace-nowrap">
                          <span>{t}</span>
                          <span className="ml-1">{heeftIngestuurd ? '✅' : '❌'}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {opdracht.fragmenten.map((fragment, fi) => (
                    <tr key={fragment.id} className="border-t border-gray-100">
                      <td className="py-3 pr-4 font-medium whitespace-nowrap">
                        Fragment {fi + 1}
                      </td>
                      <td className="py-3 pr-4 text-green-700 whitespace-nowrap">
                        {fragment.artiest} — {fragment.titel}
                      </td>
                      {teams.map((team) => {
                        const inzending = getInzending(team, opdracht.id);
                        const teamAntwoorden = inzending?.antwoorden as
                          | { artiest: string; titel: string }[]
                          | undefined;
                        const antwoord = teamAntwoorden?.[fi];
                        const juryScore = getJuryScore(opdracht.id, team) as MuziekJuryScore | null;
                        const fragmentCorrect = juryScore?.scores?.[fi] ?? null;

                        return (
                          <td key={team} className="py-3 pr-4">
                            {!inzending ? (
                              <span className="text-gray-300">—</span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className="text-gray-700">
                                  {antwoord?.artiest || '—'} / {antwoord?.titel || '—'}
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const huidig = (getJuryScore(opdracht.id, team) as MuziekJuryScore | null)?.scores ?? new Array(opdracht.fragmenten.length).fill(null);
                                      const nieuw = [...huidig];
                                      nieuw[fi] = true;
                                      slaJuryScoreOp(opdracht.id, team, { scores: nieuw });
                                    }}
                                    className={`w-10 h-10 rounded-lg text-lg font-bold transition-colors ${
                                      fragmentCorrect === true
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => {
                                      const huidig = (getJuryScore(opdracht.id, team) as MuziekJuryScore | null)?.scores ?? new Array(opdracht.fragmenten.length).fill(null);
                                      const nieuw = [...huidig];
                                      nieuw[fi] = false;
                                      slaJuryScoreOp(opdracht.id, team, { scores: nieuw });
                                    }}
                                    className={`w-10 h-10 rounded-lg text-lg font-bold transition-colors ${
                                      fragmentCorrect === false
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                                  >
                                    ✗
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Score rij */}
                  <tr className="border-t-2 border-gray-300 font-bold">
                    <td className="pt-3 pr-4">Score</td>
                    <td className="pt-3 pr-4 text-gray-400">
                      max {opdracht.fragmenten.length}
                    </td>
                    {teams.map((team) => (
                      <td key={team} className="pt-3 pr-4 text-blue-700">
                        {berekenMuziekScore(team, opdracht)}/{opdracht.fragmenten.length}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {/* FOTO SECTIES */}
        {fotoOpdrachten.map((opdracht) => (
          <section key={opdracht.id} className="bg-white rounded-2xl shadow-sm p-5 mb-6">
            <h2 className="text-xl font-bold mb-4">📷 {opdracht.naam}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {teams.map((team) => {
                const inzending = getInzending(team, opdracht.id);
                const antwoorden = inzending?.antwoorden as { fotoUrl?: string } | undefined;
                const juryScore = getJuryScore(opdracht.id, team) as FotoJuryScore | null;
                const punten = juryScore?.punten ?? '';

                return (
                  <div key={team} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold text-base">{team}</p>
                      <span className="text-xl">{inzending ? '✅' : '❌'}</span>
                    </div>
                    {!inzending ? (
                      <p className="text-sm text-gray-400">Nog niet ingestuurd</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Voorbeeld</p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={opdracht.voorbeeldFotoUrl}
                              alt="Voorbeeld"
                              className="w-full rounded-lg object-cover bg-gray-100"
                              style={{ aspectRatio: '4/3' }}
                            />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Ingestuurd</p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={antwoorden?.fotoUrl}
                              alt={`Foto van ${team}`}
                              className="w-full rounded-lg object-cover bg-gray-100"
                              style={{ aspectRatio: '4/3' }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-semibold text-gray-700">
                            Punten (0–10):
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            value={punten}
                            onChange={(e) => {
                              const p = Math.min(10, Math.max(0, Number(e.target.value)));
                              slaJuryScoreOp(opdracht.id, team, { punten: p });
                            }}
                            className="w-20 border-2 border-gray-300 rounded-lg p-2 text-center text-lg font-bold focus:border-blue-500 focus:outline-none"
                            style={{ minHeight: '48px', fontSize: '18px' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* TOTAALSTAND */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-xl font-bold mb-4">🏆 Totaalstand</h2>
          <div className="flex flex-col gap-2">
            {[...teams]
              .map((team) => ({ team, totaal: berekenTotaal(team) }))
              .sort((a, b) => b.totaal - a.totaal)
              .map(({ team, totaal }, i) => (
                <div
                  key={team}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-400 w-6">
                      {i + 1}.
                    </span>
                    <span className="text-lg font-semibold">{team}</span>
                  </div>
                  <span className="text-xl font-bold text-blue-700">{totaal} pt</span>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
