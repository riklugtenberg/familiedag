'use client';

import { useState, useEffect, useCallback, startTransition, type FormEvent } from 'react';
import {
  opdrachten,
  teams,
  type QuizOpdracht,
  type QuizVraag,
  type MuziekOpdracht,
  type GeluidOpdracht,
  type FotoOpdracht,
  type EmojiOpdracht,
  type KaartOpdracht,
  type TimingOpdracht,
  type AantalOpdracht,
} from '@/config/opdrachten';
import { fotoUrlsFromAntwoorden } from '@/lib/fotoAntwoorden';
import { isQuizVraagOpen } from '@/lib/quizScoring';
import { haversineKm } from '@/lib/haversineKm';
import type { FraudeMelding } from '@/app/api/fraude/route';

function formatKaartCoordNl(n: number): string {
  return n.toLocaleString('nl-NL', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function formatKaartKmNl(km: number): string {
  return km.toLocaleString('nl-NL', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}

function formatQuizTeamAntwoord(vraag: QuizVraag, gekozen: unknown): string {
  if (isQuizVraagOpen(vraag)) {
    return typeof gekozen === 'string' && gekozen.trim() ? gekozen.trim() : '—';
  }
  const idx = typeof gekozen === 'number' ? gekozen : -1;
  return idx >= 0 ? vraag.opties[idx] : '—';
}

function quizModelAntwoord(vraag: QuizVraag): string {
  const hint =
    'antwoordJury' in vraag && typeof vraag.antwoordJury === 'string' && vraag.antwoordJury.trim()
      ? vraag.antwoordJury.trim()
      : '';
  if (hint) return hint;
  if (isQuizVraagOpen(vraag)) return '—';
  return vraag.opties[vraag.correct] ?? '—';
}

type TimingInzendingAntwoorden = {
  pogingen: Array<number>;
  besteTijd?: number;
  doelTijd?: number;
  voltooid?: boolean;
};

function parseTimingAntwoorden(raw: unknown): TimingInzendingAntwoorden | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.pogingen)) return null;
  const pogingen = o.pogingen.filter((x): x is number => typeof x === 'number');
  return {
    pogingen,
    besteTijd: typeof o.besteTijd === 'number' ? o.besteTijd : undefined,
    doelTijd: typeof o.doelTijd === 'number' ? o.doelTijd : undefined,
    voltooid: typeof o.voltooid === 'boolean' ? o.voltooid : undefined,
  };
}

function formatTimingMs(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

function timingAfwijkingSec(ms: number, doelSec: number): number {
  return Math.abs(ms / 1000 - doelSec);
}

function besteTimingPogingIndex(pogingen: Array<number>, doelSec: number): number {
  if (pogingen.length === 0) return -1;
  return pogingen.reduce(
    (best, _, i) =>
      timingAfwijkingSec(pogingen[i], doelSec) < timingAfwijkingSec(pogingen[best], doelSec)
        ? i
        : best,
    0
  );
}

function parseAantalAntwoorden(raw: unknown): number | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const a = o.aantal;
  if (typeof a !== 'number' || !Number.isFinite(a)) return null;
  return a;
}

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
  const [adminPin, setAdminPin] = useState<string | null>(null);
  const [pinInvoer, setPinInvoer] = useState('');
  const [pinFout, setPinFout] = useState(false);

  const laadData = useCallback(async () => {
    if (!adminPin) return;
    setLaden(true);
    setLaadFout('');
    try {
      const enc = encodeURIComponent(adminPin);
      const [subRes, scoresRes, fraudeRes] = await Promise.all([
        fetch(`/api/admin/submissions?pin=${enc}`),
        fetch(`/api/scores?pin=${enc}`),
        fetch('/api/fraude'),
      ]);
      if (subRes.status === 401 || scoresRes.status === 401) {
        setAdminPin(null);
        setPinFout(true);
        setPinInvoer('');
        return;
      }
      if (!subRes.ok || !scoresRes.ok || !fraudeRes.ok) throw new Error();
      const { inzendingen: sub } = await subRes.json();
      const { scores } = await scoresRes.json();
      const { meldingen } = await fraudeRes.json();
      setInzendingen(sub ?? {});
      setJuryScores(scores ?? {});
      setFraudeMeldingen(meldingen ?? []);
      setPinFout(false);
    } catch {
      setLaadFout('Laden mislukt. Controleer de KV verbinding.');
    } finally {
      setLaden(false);
    }
  }, [adminPin]);

  useEffect(() => {
    if (!adminPin) return;
    startTransition(() => {
      void laadData();
    });
  }, [adminPin, laadData]);

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
        `Inzending van ${teamNaam} voor “${titel}” verwijderen? Ook het jurycijfer (quiz/muziek/geluid/emoji/foto/kaart/timing/aantal) voor dit team gaat mee.`
      )
    ) {
      return;
    }
    if (!adminPin) return;
    try {
      const res = await fetch('/api/admin/wis-inzending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin, teamNaam, opdrachtId }),
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
    if (!adminPin) return;
    try {
      const res = await fetch('/api/admin/wis-inzending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: adminPin,
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
    if (!adminPin) return;
    const key = `juryScore:${opdrachtId}:${teamNaam}`;
    setJuryScores((prev) => ({ ...prev, [key]: scores }));
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: adminPin, opdrachtId, teamNaam, scores }),
    });
  }

  function berekenQuizScore(teamNaam: string, opdracht: QuizOpdracht): number {
    const score = getJuryScore(opdracht.id, teamNaam) as MuziekJuryScore | null;
    if (!score?.scores) return 0;
    return score.scores.filter(Boolean).length;
  }

  function berekenMuziekScore(teamNaam: string, opdracht: MuziekOpdracht): number {
    const score = getJuryScore(opdracht.id, teamNaam) as MuziekJuryScore | null;
    if (!score?.scores) return 0;
    return score.scores.filter(Boolean).length;
  }

  function berekenGeluidScore(teamNaam: string, opdracht: GeluidOpdracht): number {
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

  function berekenKaartScore(teamNaam: string, opdracht: KaartOpdracht): number {
    const score = getJuryScore(opdracht.id, teamNaam) as MuziekJuryScore | null;
    if (!score?.scores) return 0;
    return score.scores.filter(Boolean).length;
  }

  function berekenTimingScore(teamNaam: string, opdracht: TimingOpdracht): number {
    const score = getJuryScore(opdracht.id, teamNaam) as FotoJuryScore | null;
    return score?.punten ?? 0;
  }

  function berekenAantalScore(teamNaam: string, opdracht: AantalOpdracht): number {
    const score = getJuryScore(opdracht.id, teamNaam) as FotoJuryScore | null;
    return score?.punten ?? 0;
  }

  function berekenTotaal(teamNaam: string): number {
    const opdrachtPunten = opdrachten.reduce((acc, opdracht) => {
      if (opdracht.type === 'quiz') return acc + berekenQuizScore(teamNaam, opdracht);
      if (opdracht.type === 'muziek') return acc + berekenMuziekScore(teamNaam, opdracht);
      if (opdracht.type === 'geluid') return acc + berekenGeluidScore(teamNaam, opdracht);
      if (opdracht.type === 'foto') return acc + berekenFotoScore(teamNaam, opdracht);
      if (opdracht.type === 'emoji') return acc + berekenEmojiScore(teamNaam, opdracht);
      if (opdracht.type === 'kaart') return acc + berekenKaartScore(teamNaam, opdracht);
      if (opdracht.type === 'timing') return acc + berekenTimingScore(teamNaam, opdracht);
      if (opdracht.type === 'aantal') return acc + berekenAantalScore(teamNaam, opdracht);
      return acc;
    }, 0);
    return opdrachtPunten + berekenFraudeBonus(teamNaam) - berekenFraudeStraf(teamNaam);
  }

  async function beoordeelFraude(id: string, status: 'goedgekeurd' | 'afgewezen') {
    if (!adminPin) return;
    try {
      const res = await fetch('/api/fraude/beoordelen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin, id, status }),
      });
      if (!res.ok) throw new Error();
      setFraudeMeldingen((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    } catch {
      alert('Beoordelen mislukt.');
    }
  }

  async function verwijderFraudeMelding(id: string) {
    if (!adminPin) return;
    if (!confirm('Deze melding permanent uit de database verwijderen?')) return;
    try {
      const res = await fetch('/api/fraude/beoordelen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin, id, verwijderen: true }),
      });
      if (!res.ok) throw new Error();
      setFraudeMeldingen((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert('Verwijderen mislukt.');
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
  const geluidOpdrachten = opdrachten.filter((o): o is GeluidOpdracht => o.type === 'geluid');
  const fotoOpdrachten = opdrachten.filter((o): o is FotoOpdracht => o.type === 'foto');
  const emojiOpdrachten = opdrachten.filter((o): o is EmojiOpdracht => o.type === 'emoji');
  const kaartOpdrachten = opdrachten.filter((o): o is KaartOpdracht => o.type === 'kaart');
  const timingOpdrachten = opdrachten.filter((o): o is TimingOpdracht => o.type === 'timing');
  const aantalOpdrachten = opdrachten.filter((o): o is AantalOpdracht => o.type === 'aantal');

  function handleAdminLogin(e: FormEvent) {
    e.preventDefault();
    const p = pinInvoer.trim();
    if (!p) return;
    setPinFout(false);
    setAdminPin(p);
  }

  if (!adminPin) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center pb-12">
        <form
          onSubmit={handleAdminLogin}
          className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full border border-gray-100"
        >
          <h1 className="text-2xl font-bold mb-2">Admin</h1>
          <p className="text-sm text-gray-600 mb-6">Voer het beheerderswachtwoord in om door te gaan.</p>
          <label htmlFor="admin-pin" className="block text-sm font-medium text-gray-700 mb-2">
            Wachtwoord
          </label>
          <input
            id="admin-pin"
            type="password"
            value={pinInvoer}
            onChange={(e) => {
              setPinInvoer(e.target.value);
              setPinFout(false);
            }}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoComplete="current-password"
          />
          {pinFout && (
            <p className="text-sm text-red-600 mb-4" role="alert">
              Onjuist wachtwoord.
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold rounded-xl py-3 text-base active:bg-blue-700"
            style={{ minHeight: '48px' }}
          >
            Ga verder
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4 gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">Admin</h1>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => {
                setAdminPin(null);
                setPinInvoer('');
                setPinFout(false);
              }}
              className="font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-base active:bg-gray-200"
              style={{ minHeight: '48px' }}
            >
              Afmelden
            </button>
            <button
              onClick={laadData}
              disabled={laden}
              className="bg-blue-600 text-white font-bold rounded-xl px-6 py-3 text-base active:bg-blue-700 disabled:opacity-50"
              style={{ minHeight: '48px' }}
            >
              {laden ? 'Laden…' : '🔄 Ververs'}
            </button>
          </div>
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
            <p className="text-sm text-gray-500 mb-3">
              Per vraag en per team: <span className="font-semibold text-green-700">✓</span> goed,{' '}
              <span className="font-semibold text-red-700">✗</span> fout. Alleen ✓ telt mee. Kolom{' '}
              <span className="font-semibold">Referentie</span> komt uit de config ter controle
              (meerkeuze: de goede optie, tenzij er een aparte juryregel is ingevuld).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left">
                    <th className="pb-3 pr-4 font-semibold text-gray-600 min-w-[10rem]">Vraag</th>
                    <th className="pb-3 pr-4 font-semibold text-gray-600 whitespace-nowrap">
                      Referentie
                    </th>
                    {teams.map((t) => {
                      const heeftIngestuurd = !!getInzending(t, opdracht.id);
                      return (
                        <th key={t} className="pb-3 pr-4 font-semibold text-gray-600 align-bottom">
                          <div className="flex flex-col gap-1 items-start min-w-[5.5rem]">
                            <span className="whitespace-nowrap">
                              {t}{' '}
                              <span className="font-normal">{heeftIngestuurd ? '✅' : '❌'}</span>
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
                      <td className="py-3 pr-4 text-gray-800 align-top">{vraag.vraag}</td>
                      <td className="py-3 pr-4 text-green-700 font-medium align-top max-w-[14rem]">
                        {quizModelAntwoord(vraag)}
                      </td>
                      {teams.map((team) => {
                        const inzending = getInzending(team, opdracht.id);
                        const teamAntwoorden = inzending?.antwoorden as
                          | Array<number | string>
                          | undefined;
                        const gekozen = teamAntwoorden?.[vi];
                        const juryScore = getJuryScore(opdracht.id, team) as MuziekJuryScore | null;
                        const juist = juryScore?.scores?.[vi] ?? null;

                        return (
                          <td key={team} className="py-3 pr-4 align-top">
                            {!inzending ? (
                              <span className="text-gray-300">—</span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className="text-gray-700 italic">
                                  &ldquo;{formatQuizTeamAntwoord(vraag, gekozen)}&rdquo;
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const huidig =
                                        (getJuryScore(opdracht.id, team) as MuziekJuryScore | null)
                                          ?.scores ?? new Array(opdracht.vragen.length).fill(null);
                                      const nieuw = [...huidig];
                                      nieuw[vi] = true;
                                      slaJuryScoreOp(opdracht.id, team, { scores: nieuw });
                                    }}
                                    className={`w-10 h-10 rounded-lg text-lg font-bold transition-colors ${
                                      juist === true
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const huidig =
                                        (getJuryScore(opdracht.id, team) as MuziekJuryScore | null)
                                          ?.scores ?? new Array(opdracht.vragen.length).fill(null);
                                      const nieuw = [...huidig];
                                      nieuw[vi] = false;
                                      slaJuryScoreOp(opdracht.id, team, { scores: nieuw });
                                    }}
                                    className={`w-10 h-10 rounded-lg text-lg font-bold transition-colors ${
                                      juist === false
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
                  <tr className="border-t-2 border-gray-300 font-bold">
                    <td className="pt-3 pr-4">Score</td>
                    <td className="pt-3 pr-4 text-gray-400">max {opdracht.vragen.length}</td>
                    {teams.map((team) => (
                      <td key={team} className="pt-3 pr-4 text-blue-700">
                        {berekenQuizScore(team, opdracht)}/{opdracht.vragen.length}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {/* KAART SECTIES */}
        {kaartOpdrachten.map((opdracht) => (
          <section key={opdracht.id} className="bg-white rounded-2xl shadow-sm p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold">🗺️ {opdracht.naam}</h2>
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
            <p className="text-sm text-gray-500 mb-3">
              Kolom <span className="font-semibold">Referentie</span>: plek en coördinaten uit de
              config (vogelvlucht). Per team: ingestuurde positie en tussen haakjes de afstand in km
              tot dat referentiepunt. ✓/✗ zet je als jury nog steeds zelf.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left">
                    <th className="pb-3 pr-4 font-semibold text-gray-600 min-w-[10rem]">Vraag</th>
                    <th className="pb-3 pr-4 font-semibold text-gray-600 min-w-[9rem]">Referentie</th>
                    {teams.map((t) => {
                      const heeftIngestuurd = !!getInzending(t, opdracht.id);
                      return (
                        <th key={t} className="pb-3 pr-4 font-semibold text-gray-600 align-bottom">
                          <div className="flex flex-col gap-1 items-start min-w-[6rem]">
                            <span className="whitespace-nowrap">
                              {t}{' '}
                              <span className="font-normal">{heeftIngestuurd ? '✅' : '❌'}</span>
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
                      <td className="py-3 pr-4 text-gray-800 align-top">{vraag.vraag}</td>
                      <td className="py-3 pr-4 align-top">
                        <p className="font-medium text-green-800">{vraag.referentie}</p>
                        <p className="text-xs text-gray-600 font-mono mt-1 tabular-nums">
                          {formatKaartCoordNl(vraag.lat)}, {formatKaartCoordNl(vraag.lng)}
                        </p>
                      </td>
                      {teams.map((team) => {
                        const inzending = getInzending(team, opdracht.id);
                        const teamAntwoorden = inzending?.antwoorden as
                          | Array<{ lat: number; lng: number }>
                          | undefined;
                        const gekozen = teamAntwoorden?.[vi];
                        const juryScore = getJuryScore(opdracht.id, team) as MuziekJuryScore | null;
                        const juist = juryScore?.scores?.[vi] ?? null;
                        const km =
                          gekozen != null
                            ? haversineKm(gekozen, { lat: vraag.lat, lng: vraag.lng })
                            : null;

                        return (
                          <td key={team} className="py-3 pr-4 align-top">
                            {!inzending ? (
                              <span className="text-gray-300">—</span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {gekozen && km != null ? (
                                  <p className="text-gray-800 text-xs font-mono leading-snug tabular-nums">
                                    {formatKaartCoordNl(gekozen.lat)},{' '}
                                    {formatKaartCoordNl(gekozen.lng)}{' '}
                                    <span className="text-gray-600 font-sans">
                                      ({formatKaartKmNl(km)} km)
                                    </span>
                                  </p>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const huidig =
                                        (getJuryScore(opdracht.id, team) as MuziekJuryScore | null)
                                          ?.scores ?? new Array(opdracht.vragen.length).fill(null);
                                      const nieuw = [...huidig];
                                      nieuw[vi] = true;
                                      slaJuryScoreOp(opdracht.id, team, { scores: nieuw });
                                    }}
                                    className={`w-10 h-10 rounded-lg text-lg font-bold transition-colors ${
                                      juist === true
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const huidig =
                                        (getJuryScore(opdracht.id, team) as MuziekJuryScore | null)
                                          ?.scores ?? new Array(opdracht.vragen.length).fill(null);
                                      const nieuw = [...huidig];
                                      nieuw[vi] = false;
                                      slaJuryScoreOp(opdracht.id, team, { scores: nieuw });
                                    }}
                                    className={`w-10 h-10 rounded-lg text-lg font-bold transition-colors ${
                                      juist === false
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
                  <tr className="border-t-2 border-gray-300 font-bold">
                    <td className="pt-3 pr-4 text-gray-800">
                      Score{' '}
                      <span className="text-gray-400 font-normal">(max {opdracht.vragen.length})</span>
                    </td>
                    <td className="pt-3 pr-4 text-gray-400 font-normal">—</td>
                    {teams.map((team) => (
                      <td key={team} className="pt-3 pr-4 text-blue-700">
                        {berekenKaartScore(team, opdracht)}/{opdracht.vragen.length}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
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

        {/* GELUID SECTIES */}
        {geluidOpdrachten.map((opdracht) => (
          <section key={opdracht.id} className="bg-white rounded-2xl shadow-sm p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold">🔊 {opdracht.naam}</h2>
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
            <p className="text-sm text-gray-500 mb-3">
              Per fragment: referentie uit de config. Per team ✓/✗ naar eigen oordeel.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left">
                    <th className="pb-3 pr-4 font-semibold text-gray-600 whitespace-nowrap">
                      Fragment
                    </th>
                    <th className="pb-3 pr-4 font-semibold text-gray-600 whitespace-nowrap">
                      Referentie (jury)
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
                      <td className="py-3 pr-4 font-medium whitespace-nowrap">Geluid {fi + 1}</td>
                      <td className="py-3 pr-4 text-green-700 align-top max-w-[14rem]">
                        {fragment.antwoordJury}
                      </td>
                      {teams.map((team) => {
                        const inzending = getInzending(team, opdracht.id);
                        const teamAntwoorden = inzending?.antwoorden as string[] | undefined;
                        const antwoord = teamAntwoorden?.[fi];
                        const juryScore = getJuryScore(opdracht.id, team) as MuziekJuryScore | null;
                        const fragmentCorrect = juryScore?.scores?.[fi] ?? null;

                        return (
                          <td key={team} className="py-3 pr-4 align-top">
                            {!inzending ? (
                              <span className="text-gray-300">—</span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className="text-gray-700 italic">
                                  &ldquo;{antwoord?.trim() ? antwoord.trim() : '—'}&rdquo;
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const huidig =
                                        (getJuryScore(opdracht.id, team) as MuziekJuryScore | null)
                                          ?.scores ?? new Array(opdracht.fragmenten.length).fill(null);
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
                                    type="button"
                                    onClick={() => {
                                      const huidig =
                                        (getJuryScore(opdracht.id, team) as MuziekJuryScore | null)
                                          ?.scores ?? new Array(opdracht.fragmenten.length).fill(null);
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
                  <tr className="border-t-2 border-gray-300 font-bold">
                    <td className="pt-3 pr-4">Score</td>
                    <td className="pt-3 pr-4 text-gray-400">
                      max {opdracht.fragmenten.length}
                    </td>
                    {teams.map((team) => (
                      <td key={team} className="pt-3 pr-4 text-blue-700">
                        {berekenGeluidScore(team, opdracht)}/{opdracht.fragmenten.length}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {/* TIMING SECTIES */}
        {timingOpdrachten.map((opdracht) => {
          const maxPogingen = opdracht.maxPogingen ?? 3;
          return (
            <section key={opdracht.id} className="bg-white rounded-2xl shadow-sm p-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">⏱ {opdracht.naam}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Doel: <span className="font-semibold text-gray-700">{opdracht.doelTijd}s</span>
                    {' · '}
                    max <span className="font-semibold text-gray-700">{maxPogingen}</span> pogingen
                  </p>
                </div>
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
                  const parsed = parseTimingAntwoorden(inzending?.antwoorden);
                  const juryScore = getJuryScore(opdracht.id, team) as FotoJuryScore | null;
                  const punten = juryScore?.punten ?? '';
                  const heeftData = Boolean(parsed && parsed.pogingen.length > 0);
                  const klaar = Boolean(parsed?.voltooid);
                  const besteIdx =
                    parsed && parsed.pogingen.length > 0
                      ? besteTimingPogingIndex(parsed.pogingen, opdracht.doelTijd)
                      : -1;

                  return (
                    <div key={team} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <p className="font-bold text-base">{team}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          {heeftData ? (
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
                          <span className="text-xl" title={klaar ? 'Afgerond' : heeftData ? 'Bezig' : 'Geen data'}>
                            {!heeftData ? '❌' : klaar ? '✅' : '⏳'}
                          </span>
                        </div>
                      </div>
                      {!heeftData || !parsed ? (
                        <p className="text-sm text-gray-400">Nog geen pogingen opgeslagen</p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <ul className="flex flex-col gap-1.5">
                            {parsed.pogingen.map((ms, i) => {
                              const afw = timingAfwijkingSec(ms, opdracht.doelTijd);
                              const isBeste = i === besteIdx && parsed.pogingen.length > 1;
                              return (
                                <li
                                  key={i}
                                  className={`flex items-center justify-between text-sm rounded-lg border px-3 py-2 ${
                                    isBeste
                                      ? 'border-green-300 bg-green-50'
                                      : 'border-gray-100 bg-gray-50'
                                  }`}
                                >
                                  <span className="font-medium text-gray-700">Poging {i + 1}</span>
                                  <span className="text-right">
                                    <span className="font-bold text-gray-900">{formatTimingMs(ms)}</span>
                                    <span className="text-gray-500 ml-2">± {afw.toFixed(2)}s</span>
                                    {isBeste ? (
                                      <span className="ml-2 text-xs font-bold text-green-700">beste</span>
                                    ) : null}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                          <div className="flex items-center gap-3 flex-wrap">
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
          );
        })}

        {/* AANTAL-OPDRACHTEN (Jenga, koe melken, …) */}
        {aantalOpdrachten.map((opdracht) => {
          const veldLabel = opdracht.veldLabel?.trim() || 'Aantal';
          return (
            <section key={opdracht.id} className="bg-white rounded-2xl shadow-sm p-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold">🔢 {opdracht.naam}</h2>
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
                  const aantal = parseAantalAntwoorden(inzending?.antwoorden);
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
                      {!inzending || aantal === null ? (
                        <p className="text-sm text-gray-400">Nog niet ingestuurd</p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">{veldLabel}</p>
                            <p className="text-2xl font-bold text-gray-900 tabular-nums">
                              {aantal.toLocaleString('nl-NL')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
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
          );
        })}

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
                          <p className="text-xs text-gray-500 mb-1">Voorbeelden</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-2xl">
                            {opdracht.voorbeeldFotoUrls.map((url, vi) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={url}
                                src={url}
                                alt={`Voorbeeld ${vi + 1}`}
                                className="w-full rounded-lg object-cover bg-gray-100"
                                style={{ aspectRatio: '4/3' }}
                              />
                            ))}
                          </div>
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
                        {new Date(melding.timestamp).toLocaleTimeString('nl-NL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold px-3 py-1 rounded-full ${
                        melding.status === 'goedgekeurd'
                          ? 'bg-green-200 text-green-800'
                          : melding.status === 'afgewezen'
                            ? 'bg-gray-200 text-gray-600'
                            : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {melding.status === 'goedgekeurd'
                        ? '✅ Goedgekeurd'
                        : melding.status === 'afgewezen'
                          ? '✗ Afgewezen'
                          : '⏳ Open'}
                    </span>
                  </div>

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

                  {melding.status === 'open' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => beoordeelFraude(melding.id, 'goedgekeurd')}
                        className="flex-1 bg-green-600 text-white font-bold rounded-xl py-2 text-sm active:bg-green-700"
                        style={{ minHeight: '44px' }}
                      >
                        ✅ Goedkeuren (+1 voor {melding.melderTeam}, −1 voor{' '}
                        {melding.beschuldigdTeam})
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

                  <button
                    type="button"
                    onClick={() => verwijderFraudeMelding(melding.id)}
                    className="mt-3 w-full border border-red-200 text-red-700 font-semibold rounded-xl py-2 text-sm bg-white hover:bg-red-50 active:bg-red-100"
                    style={{ minHeight: '44px' }}
                  >
                    Verwijderen uit database
                  </button>
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
