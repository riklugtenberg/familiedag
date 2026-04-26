'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import {
  opdrachten,
  teams,
  type QuizOpdracht,
  type MuziekOpdracht,
  type FotoOpdracht,
  type EmojiOpdracht,
} from '@/config/opdrachten';
import { fotoUrlsFromAntwoorden } from '@/lib/fotoAntwoorden';
import type { FraudeMelding } from '@/app/api/fraude/route';

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
  const [fraudeMeldingen, setFraudeMeldingen] = useState<FraudeMelding[]>([]);
  const [laden, setLaden] = useState(false);
  const [laadFout, setLaadFout] = useState('');
  const [fotoLightbox, setFotoLightbox] = useState<{ src: string; alt: string } | null>(null);

  const laadData = useCallback(async () => {
    setLaden(true);
    setLaadFout('');
    try {
      const [subRes, scoresRes, fraudeRes] = await Promise.all([
        fetch(`/api/admin/submissions?pin=${ADMIN_PIN}`),
        fetch(`/api/scores?pin=${ADMIN_PIN}`),
        fetch('/api/fraude'),
      ]);
      if (!subRes.ok || !scoresRes.ok || !fraudeRes.ok) throw new Error();
      const { inzendingen: sub } = await subRes.json();
      const { scores } = await scoresRes.json();
      const { meldingen } = await fraudeRes.json();
      setInzendingen(sub ?? {});
      setJuryScores(scores ?? {});
      setFraudeMeldingen(meldingen ?? []);
    } catch {
      setLaadFout('Laden mislukt. Controleer de KV verbinding.');
    } finally {
      setLaden(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void laadData();
    });
  }, [laadData]);

  useEffect(() => {
    if (!fotoLightbox) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setFotoLightbox(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fotoLightbox]);

  async function verwijderInzending(
    teamNaam: string,
    opdrachtId: string,
    titel: string
  ) {
    if (
      !confirm(
        `Inzending van ${teamNaam} voor “${titel}” verwijderen? Ook het jurycijfer (muziek/foto) voor dit team gaat mee.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch('/api/admin/wis-inzending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: ADMIN_PIN, teamNaam, opdrachtId }),
      });
      if (!res.ok) throw new Error();
      await laadData();
    } catch {
      alert('Verwijderen mislukt.');
    }
  }

  async function verwijderAlleInzendingenVoorOpdracht(
    opdrachtId: string,
    titel: string
  ) {
    if (
      !confirm(
        `Alle inzendingen en juryscores voor “${titel}” wissen (alle teams)? Dit kan niet ongedaan worden.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch('/api/admin/wis-inzending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: ADMIN_PIN,
          opdrachtId,
          wisAllesVoorOpdracht: true,
        }),
      });
      if (!res.ok) throw new Error();
      await laadData();
    } catch {
      alert('Verwijderen mislukt.');
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

  function berekenFraudeBonus(teamNaam: string): number {
    return fraudeMeldingen.filter(
      (m) => m.status === 'goedgekeurd' && m.melderTeam === teamNaam
    ).length;
  }

  function berekenFraudeStraf(teamNaam: string): number {
    return fraudeMeldingen.filter(
      (m) => m.status === 'goedgekeurd' && m.beschuldigdTeam === teamNaam
    ).length;
  }

  function berekenTotaal(teamNaam: string): number {
    const opdrachtPunten = opdrachten.reduce((acc, opdracht) => {
      if (opdracht.type === 'quiz') return acc + berekenQuizScore(teamNaam, opdracht);
      if (opdracht.type === 'muziek') return acc + berekenMuziekScore(teamNaam, opdracht);
      if (opdracht.type === 'foto') return acc + berekenFotoScore(teamNaam, opdracht);
      if (opdracht.type === 'emoji') return acc + berekenEmojiScore(teamNaam, opdracht);
      return acc;
    }, 0);
    return opdrachtPunten + berekenFraudeBonus(teamNaam) - berekenFraudeStraf(teamNaam);
  }

  async function beoordeelFraude(id: string, status: 'goedgekeurd' | 'afgewezen') {
    try {
      const res = await fetch('/api/fraude/beoordelen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: ADMIN_PIN, id, status }),
      });
      if (!res.ok) throw new Error();
      setFraudeMeldingen((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m))
      );
    } catch {
      alert('Beoordelen mislukt.');
    }
  }

  function berekenEmojiScore(teamNaam: string, opdracht: EmojiOpdracht): number {
    const score = getJuryScore(opdracht.id, teamNaam) as MuziekJuryScore | null;
    if (!score?.scores) return 0;
    return score.scores.filter(Boolean).length;
  }

  // --- Admin dashboard ---
  const quizOpdrachten = opdrachten.filter((o): o is QuizOpdracht => o.type === 'quiz');
  const muziekOpdrachten = opdrachten.filter((o): o is MuziekOpdracht => o.type === 'muziek');
  const fotoOpdrachten = opdrachten.filter((o): o is FotoOpdracht => o.type === 'foto');
  const emojiOpdrachten = opdrachten.filter((o): o is EmojiOpdracht => o.type === 'emoji');

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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold">📝 {opdracht.naam}</h2>
              <button
                type="button"
                onClick={() =>
                  verwijderAlleInzendingenVoorOpdracht(opdracht.id, opdracht.naam)
                }
                className="shrink-0 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 active:bg-red-100"
                style={{ minHeight: '40px' }}
              >
                Wis alle inzendingen
              </button>
            </div>
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
                    <div className="flex justify-between items-center gap-2 mb-2 flex-wrap">
                      <p className="font-bold text-base">{team}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="bg-blue-100 text-blue-800 font-bold text-base px-3 py-1 rounded-full">
                          {score}/{opdracht.vragen.length}
                        </span>
                        <span className="text-xl">{inzending ? '✅' : '❌'}</span>
                        {inzending ? (
                          <button
                            type="button"
                            onClick={() =>
                              verwijderInzending(team, opdracht.id, opdracht.naam)
                            }
                            className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 active:bg-red-100 whitespace-nowrap"
                          >
                            Wis inzending
                          </button>
                        ) : null}
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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold">🎵 {opdracht.naam}</h2>
              <button
                type="button"
                onClick={() =>
                  verwijderAlleInzendingenVoorOpdracht(opdracht.id, opdracht.naam)
                }
                className="shrink-0 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 active:bg-red-100"
                style={{ minHeight: '40px' }}
              >
                Wis alle inzendingen
              </button>
            </div>
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
                        <th key={t} className="pb-3 pr-4 font-semibold text-gray-600 align-bottom">
                          <div className="flex flex-col gap-1 items-start min-w-[5.5rem]">
                            <span className="whitespace-nowrap">
                              {t}{' '}
                              <span className="font-normal">
                                {heeftIngestuurd ? '✅' : '❌'}
                              </span>
                            </span>
                            {heeftIngestuurd ? (
                              <button
                                type="button"
                                onClick={() =>
                                  verwijderInzending(t, opdracht.id, opdracht.naam)
                                }
                                className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1 active:bg-red-100 whitespace-nowrap"
                              >
                                Wis inzending
                              </button>
                            ) : null}
                          </div>
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
                        {fragment.artiest ?? '?'} — {fragment.titel ?? '?'}
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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold">📷 {opdracht.naam}</h2>
              <button
                type="button"
                onClick={() =>
                  verwijderAlleInzendingenVoorOpdracht(opdracht.id, opdracht.naam)
                }
                className="shrink-0 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 active:bg-red-100"
                style={{ minHeight: '40px' }}
              >
                Wis alle inzendingen
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {teams.map((team) => {
                const inzending = getInzending(team, opdracht.id);
                const fotoUrls = fotoUrlsFromAntwoorden(inzending?.antwoorden);
                const juryScore = getJuryScore(opdracht.id, team) as FotoJuryScore | null;
                const punten = juryScore?.punten ?? '';

                return (
                  <div key={team} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <p className="font-bold text-base">{team}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        {inzending ? (
                          <button
                            type="button"
                            onClick={() =>
                              verwijderInzending(team, opdracht.id, opdracht.naam)
                            }
                            className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 active:bg-red-100 whitespace-nowrap"
                          >
                            Wis inzending
                          </button>
                        ) : null}
                        <span className="text-xl">{inzending ? '✅' : '❌'}</span>
                      </div>
                    </div>
                    {!inzending ? (
                      <p className="text-sm text-gray-400">Nog niet ingestuurd</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Voorbeeld</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={opdracht.voorbeeldFotoUrl}
                            alt="Voorbeeld"
                            className="w-full max-w-xs rounded-lg object-cover bg-gray-100"
                            style={{ aspectRatio: '4/3' }}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-2">
                            Ingestuurde foto’s ({fotoUrls.length})
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {fotoUrls.map((url, fi) => (
                              <div key={fi}>
                                <button
                                  type="button"
                                  className="block w-full rounded-lg overflow-hidden bg-gray-100 ring-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-zoom-in"
                                  onClick={() =>
                                    setFotoLightbox({
                                      src: url,
                                      alt: `Foto ${fi + 1} van ${team}`,
                                    })
                                  }
                                  title="Klik voor grotere weergave"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={url}
                                    alt={`Foto ${fi + 1} van ${team}`}
                                    className="w-full object-cover hover:opacity-95 transition-opacity"
                                    style={{ aspectRatio: '4/3' }}
                                  />
                                </button>
                                <p className="text-xs text-gray-400 mt-1 text-center">
                                  {fi + 1}
                                </p>
                              </div>
                            ))}
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

        {/* EMOJI SECTIES */}
        {emojiOpdrachten.map((opdracht) => (
          <section key={opdracht.id} className="bg-white rounded-2xl shadow-sm p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold">🤔 {opdracht.naam}</h2>
              <button
                type="button"
                onClick={() => verwijderAlleInzendingenVoorOpdracht(opdracht.id, opdracht.naam)}
                className="shrink-0 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 active:bg-red-100"
                style={{ minHeight: '40px' }}
              >
                Wis alle inzendingen
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left">
                    <th className="pb-3 pr-4 font-semibold text-gray-600 whitespace-nowrap">Vraag</th>
                    <th className="pb-3 pr-4 font-semibold text-gray-600 whitespace-nowrap">Antwoord</th>
                    {teams.map((t) => {
                      const heeftIngestuurd = !!getInzending(t, opdracht.id);
                      return (
                        <th key={t} className="pb-3 pr-4 font-semibold text-gray-600 align-bottom">
                          <div className="flex flex-col gap-1 items-start min-w-[5.5rem]">
                            <span className="whitespace-nowrap">
                              {t} <span className="font-normal">{heeftIngestuurd ? '✅' : '❌'}</span>
                            </span>
                            {heeftIngestuurd && (
                              <button
                                type="button"
                                onClick={() => verwijderInzending(t, opdracht.id, opdracht.naam)}
                                className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1 active:bg-red-100 whitespace-nowrap"
                              >
                                Wis inzending
                              </button>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {opdracht.vragen.map((vraag, vi) => (
                    <tr key={vraag.id} className="border-t border-gray-100">
                      <td className="py-3 pr-4 text-2xl whitespace-nowrap">{vraag.emoji}</td>
                      <td className="py-3 pr-4 text-green-700 font-medium whitespace-nowrap">
                        {vraag.antwoord}
                      </td>
                      {teams.map((team) => {
                        const inzending = getInzending(team, opdracht.id);
                        const teamAntwoorden = inzending?.antwoorden as string[] | undefined;
                        const antwoord = teamAntwoorden?.[vi];
                        const juryScore = getJuryScore(opdracht.id, team) as MuziekJuryScore | null;
                        const correct = juryScore?.scores?.[vi] ?? null;

                        return (
                          <td key={team} className="py-3 pr-4">
                            {!inzending ? (
                              <span className="text-gray-300">—</span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className="text-gray-700 italic">&ldquo;{antwoord || '—'}&rdquo;</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const huidig = (getJuryScore(opdracht.id, team) as MuziekJuryScore | null)?.scores ?? new Array(opdracht.vragen.length).fill(null);
                                      const nieuw = [...huidig];
                                      nieuw[vi] = true;
                                      slaJuryScoreOp(opdracht.id, team, { scores: nieuw });
                                    }}
                                    className={`w-10 h-10 rounded-lg text-lg font-bold transition-colors ${correct === true ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => {
                                      const huidig = (getJuryScore(opdracht.id, team) as MuziekJuryScore | null)?.scores ?? new Array(opdracht.vragen.length).fill(null);
                                      const nieuw = [...huidig];
                                      nieuw[vi] = false;
                                      slaJuryScoreOp(opdracht.id, team, { scores: nieuw });
                                    }}
                                    className={`w-10 h-10 rounded-lg text-lg font-bold transition-colors ${correct === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}
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
                  <tr className="border-t-2 border-gray-300 font-bold">
                    <td className="pt-3 pr-4">Score</td>
                    <td className="pt-3 pr-4 text-gray-400">max {opdracht.vragen.length}</td>
                    {teams.map((team) => (
                      <td key={team} className="pt-3 pr-4 text-blue-700">
                        {berekenEmojiScore(team, opdracht)}/{opdracht.vragen.length}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {/* FRAUDE MELDINGEN */}
        <section className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <h2 className="text-xl font-bold mb-4">🚨 Fraude meldingen</h2>
          {fraudeMeldingen.length === 0 ? (
            <p className="text-sm text-gray-400">Nog geen meldingen.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {fraudeMeldingen.map((melding) => (
                <div
                  key={melding.id}
                  className={`border-2 rounded-xl p-4 ${
                    melding.status === 'goedgekeurd'
                      ? 'border-green-300 bg-green-50'
                      : melding.status === 'afgewezen'
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-bold text-base">
                        {melding.melderTeam} meldt: {melding.beschuldigdTeam}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(melding.timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      melding.status === 'goedgekeurd'
                        ? 'bg-green-200 text-green-800'
                        : melding.status === 'afgewezen'
                        ? 'bg-gray-200 text-gray-600'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {melding.status === 'goedgekeurd' ? '✅ Goedgekeurd' : melding.status === 'afgewezen' ? '✗ Afgewezen' : '⏳ Open'}
                    </span>
                  </div>

                  {/* Foto's */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {melding.fotoUrls.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        className="rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in"
                        onClick={() => setFotoLightbox({ src: url, alt: `Bewijs ${i + 1}` })}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Bewijs ${i + 1}`}
                          className="w-full object-cover hover:opacity-90 transition-opacity"
                          style={{ aspectRatio: '4/3' }}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Beoordeel knoppen */}
                  {melding.status === 'open' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => beoordeelFraude(melding.id, 'goedgekeurd')}
                        className="flex-1 bg-green-600 text-white font-bold rounded-xl py-2 text-sm active:bg-green-700"
                        style={{ minHeight: '44px' }}
                      >
                        ✅ Goedkeuren (+1 voor {melding.melderTeam}, −1 voor {melding.beschuldigdTeam})
                      </button>
                      <button
                        type="button"
                        onClick={() => beoordeelFraude(melding.id, 'afgewezen')}
                        className="flex-1 bg-gray-200 text-gray-700 font-bold rounded-xl py-2 text-sm active:bg-gray-300"
                        style={{ minHeight: '44px' }}
                      >
                        ✗ Afwijzen
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

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

      {fotoLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Vergrote foto"
          onClick={() => setFotoLightbox(null)}
        >
          <button
            type="button"
            className="absolute top-3 right-3 z-60 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white text-xl font-bold hover:bg-white/25 active:bg-white/35"
            onClick={(e) => {
              e.stopPropagation();
              setFotoLightbox(null);
            }}
            aria-label="Sluiten"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotoLightbox.src}
            alt={fotoLightbox.alt}
            className="max-h-[min(92vh,100%)] max-w-[min(96vw,100%)] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/70 pointer-events-none">
            Klik buiten de foto of druk op Esc om te sluiten
          </p>
        </div>
      )}
    </div>
  );
}
