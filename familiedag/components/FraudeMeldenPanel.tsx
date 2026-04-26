'use client';

import { useState, useRef, useEffect } from 'react';
import { teams } from '@/config/opdrachten';

type FotoItem = { id: string; file: File; previewUrl: string };

function nieuwId() {
  return Math.random().toString(36).slice(2, 10);
}

type Props = {
  melderTeam: string;
};

export default function FraudeMeldenPanel({ melderTeam }: Props) {
  const [open, setOpen] = useState(false);
  const [beschuldigdTeam, setBeschuldigdTeam] = useState('');
  const [fotos, setFotos] = useState<FotoItem[]>([]);
  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;
  const [bezig, setBezig] = useState(false);
  const [verstuurd, setVerstuurd] = useState(false);
  const [fout, setFout] = useState('');

  useEffect(() => {
    return () => fotosRef.current.forEach((f) => URL.revokeObjectURL(f.previewUrl));
  }, []);

  const andereTeams = teams.filter((t) => t !== melderTeam);

  function handleFotoSelectie(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFotos((prev) => [...prev, { id: nieuwId(), file, previewUrl: URL.createObjectURL(file) }]);
    setFout('');
  }

  function verwijderFoto(id: string) {
    setFotos((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  }

  async function handleVerstuur() {
    if (!beschuldigdTeam || fotos.length === 0) return;
    setBezig(true);
    setFout('');
    try {
      const urls: string[] = [];
      for (const item of fotos) {
        const formData = new FormData();
        formData.append('file', item.file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload mislukt');
        const data = (await res.json()) as { url?: string };
        if (!data.url) throw new Error('Upload mislukt');
        urls.push(data.url);
      }

      const res = await fetch('/api/fraude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ melderTeam, beschuldigdTeam, fotoUrls: urls }),
      });
      if (!res.ok) throw new Error('Versturen mislukt');
      setVerstuurd(true);
    } catch {
      setFout('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setBezig(false);
    }
  }

  function reset() {
    fotosRef.current.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setFotos([]);
    setBeschuldigdTeam('');
    setVerstuurd(false);
    setFout('');
    setOpen(false);
  }

  return (
    <div className="mt-8 w-full">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-red-200 bg-red-50 text-red-700 font-bold rounded-2xl py-4 text-lg active:bg-red-100"
          style={{ minHeight: '64px' }}
        >
          🚨 Fraude melden
        </button>
      ) : (
        <div className="border-2 border-red-300 bg-red-50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-red-800">🚨 Fraude melden</h2>
            <button
              onClick={reset}
              className="text-red-400 text-2xl font-bold px-2 active:text-red-600"
              aria-label="Sluiten"
            >
              ✕
            </button>
          </div>

          {verstuurd ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <span className="text-5xl">📩</span>
              <p className="text-green-700 font-bold text-lg text-center">Melding verstuurd!</p>
              <p className="text-sm text-gray-500 text-center">
                De jury beoordeelt de melding. Als die goedgekeurd wordt krijgt {beschuldigdTeam} een strafpunt en jullie een bonuspunt.
              </p>
              <button
                onClick={reset}
                className="mt-2 bg-red-600 text-white font-bold rounded-xl px-6 py-3 active:bg-red-700"
              >
                Sluiten
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-red-700 mb-4 leading-snug">
                Alleen de hoofdcoach mag zijn telefoon gebruiken. Betrap je iemand anders? Meld het hier.
              </p>

              {/* Team selectie */}
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Welk team speelt vals?
              </label>
              <div className="flex flex-wrap gap-2 mb-5">
                {andereTeams.map((team) => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => setBeschuldigdTeam(team)}
                    className={`px-4 py-2 rounded-xl border-2 font-semibold text-base transition-colors ${
                      beschuldigdTeam === team
                        ? 'border-red-500 bg-red-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 active:bg-gray-50'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    {team}
                  </button>
                ))}
              </div>

              {/* Foto upload */}
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bewijsfoto's ({fotos.length})
              </label>

              {fotos.length > 0 && (
                <ul className="flex flex-col gap-3 mb-3">
                  {fotos.map((item, i) => (
                    <li key={item.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt={`Foto ${i + 1}`}
                        className="w-16 h-16 object-cover rounded-lg bg-gray-100 shrink-0"
                      />
                      <span className="text-sm text-gray-600 flex-1">Foto {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => verwijderFoto(item.id)}
                        className="text-sm font-semibold text-red-600 px-3 py-1 rounded-lg active:bg-red-50"
                        style={{ minHeight: '40px' }}
                      >
                        Verwijder
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <input
                type="file"
                accept="image/*"
                capture="environment"
                id="fraude-foto-input"
                className="hidden"
                onChange={handleFotoSelectie}
              />
              <label
                htmlFor="fraude-foto-input"
                className="flex items-center justify-center gap-2 w-full bg-white border-2 border-red-300 text-red-700 font-bold rounded-xl cursor-pointer active:bg-red-50 mb-4"
                style={{ minHeight: '52px' }}
              >
                📷 {fotos.length === 0 ? 'Foto toevoegen' : 'Nog een foto'}
              </label>

              {fout && <p className="text-red-600 text-sm mb-3">{fout}</p>}

              <button
                type="button"
                onClick={handleVerstuur}
                disabled={bezig || !beschuldigdTeam || fotos.length === 0}
                className="w-full bg-red-600 text-white text-lg font-bold rounded-xl disabled:opacity-40 active:bg-red-700"
                style={{ minHeight: '56px' }}
              >
                {bezig ? 'Uploaden…' : '🚨 Melding versturen'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
