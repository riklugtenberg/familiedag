'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { FotoOpdracht as FotoOpdrachtType } from '@/config/opdrachten';

type Props = {
  opdracht: FotoOpdrachtType;
  teamNaam: string;
};

export default function FotoOpdracht({ opdracht, teamNaam }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bestand, setBestand] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const [voorbeeldFout, setVoorbeeldFout] = useState(false);

  function handleFotoSelectie(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBestand(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFout('');
  }

  async function handleSubmit() {
    if (!bestand) return;
    setBezig(true);
    setFout('');
    try {
      const formData = new FormData();
      formData.append('file', bestand);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Upload mislukt');
      const { url: fotoUrl } = await uploadRes.json();

      const submitRes = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamNaam,
          opdrachtId: opdracht.id,
          antwoorden: { fotoUrl },
        }),
      });
      if (!submitRes.ok) throw new Error('Versturen mislukt');
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
          Jullie foto is ontvangen.
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
      </div>

      {/* Voorbeeldfoto */}
      <div className="mb-5">
        <p className="text-base font-semibold mb-3 text-gray-700">Voorbeeldfoto:</p>
        {!voorbeeldFout ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={opdracht.voorbeeldFotoUrl}
            alt="Voorbeeldfoto"
            onError={() => setVoorbeeldFout(true)}
            className="w-full rounded-2xl object-cover bg-gray-100"
            style={{ aspectRatio: '4/3' }}
          />
        ) : (
          <div
            className="w-full rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 text-base"
            style={{ aspectRatio: '4/3' }}
          >
            Voorbeeldfoto ontbreekt
          </div>
        )}
      </div>

      {/* Instructie */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
        <p className="text-lg text-blue-800 leading-snug">{opdracht.instructie}</p>
      </div>

      {/* Camera input (altijd aanwezig) */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFotoSelectie}
        className="hidden"
        id="camera-input"
      />

      {!previewUrl ? (
        <label
          htmlFor="camera-input"
          className="flex items-center justify-center gap-3 w-full bg-blue-600 text-white text-xl font-bold rounded-xl cursor-pointer active:bg-blue-700"
          style={{ minHeight: '72px', fontSize: '20px' }}
        >
          📷 Maak een foto
        </label>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-base font-semibold text-gray-700">Jouw foto:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Jouw foto"
            className="w-full rounded-2xl object-cover"
            style={{ aspectRatio: '4/3' }}
          />
          <div className="flex gap-3">
            <label
              htmlFor="camera-input"
              className="flex-1 flex items-center justify-center bg-gray-100 text-gray-700 text-base font-semibold rounded-xl cursor-pointer active:bg-gray-200"
              style={{ minHeight: '56px' }}
            >
              Opnieuw
            </label>
            <button
              onClick={handleSubmit}
              disabled={bezig}
              className="flex-2 bg-green-600 text-white text-xl font-bold rounded-xl disabled:opacity-40 active:bg-green-700"
              style={{ minHeight: '56px' }}
            >
              {bezig ? 'Uploaden…' : 'Insturen ✓'}
            </button>
          </div>
        </div>
      )}

      {fout && <p className="text-red-600 text-base mt-4">{fout}</p>}
    </div>
  );
}
