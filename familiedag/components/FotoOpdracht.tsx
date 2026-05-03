'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { FotoOpdracht as FotoOpdrachtType } from '@/config/opdrachten';

type Props = {
  opdracht: FotoOpdrachtType;
  teamNaam: string;
};

type FotoItem = {
  id: string;
  file: File;
  previewUrl: string;
};

function nieuwId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function FotoOpdracht({ opdracht, teamNaam }: Props) {
  const maxFotos = opdracht.maxFotos ?? 3;
  const [items, setItems] = useState<Array<FotoItem>>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const [submitted, setSubmitted] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const [voorbeeldFout, setVoorbeeldFout] = useState<Array<boolean>>(() =>
    opdracht.voorbeeldFotoUrls.map(() => false),
  );

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    };
  }, []);

  function verwijderFoto(id: string) {
    setItems((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
    setFout('');
  }

  function handleFotoSelectie(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (items.length >= maxFotos) return;
    const previewUrl = URL.createObjectURL(file);
    setItems((prev) => [...prev, { id: nieuwId(), file, previewUrl }]);
    setFout('');
  }

  async function handleSubmit() {
    if (items.length === 0) return;
    setBezig(true);
    setFout('');
    try {
      const urls: Array<string> = [];
      for (const item of items) {
        const formData = new FormData();
        formData.append('file', item.file);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('Upload mislukt');
        const data = (await uploadRes.json()) as { url?: string };
        if (!data.url) throw new Error('Upload mislukt');
        urls.push(data.url);
      }

      const submitRes = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamNaam,
          opdrachtId: opdracht.id,
          antwoorden: { fotoUrls: urls },
        }),
      });
      if (!submitRes.ok) throw new Error('Versturen mislukt');
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
          Jullie foto’s zijn ontvangen.
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

  const kanNogToevoegen = items.length < maxFotos;

  return (
    <div className="min-h-screen flex flex-col p-6 pb-12 bg-white max-w-lg mx-auto">
      <div className="mb-6">
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
          {teamNaam}
        </p>
        <h1 className="text-2xl font-bold mt-1">{opdracht.naam}</h1>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-5">
        <p className="text-lg text-blue-800 leading-snug">{opdracht.instructie}</p>
      </div>

      <div className="mb-6">
        <p className="text-base font-semibold mb-3 text-gray-700">
          {opdracht.voorbeeldFotoUrls.length === 1 ? 'Voorbeeldfoto:' : 'Voorbeeldfoto’s:'}
        </p>
        <div className="flex flex-col gap-3">
          {opdracht.voorbeeldFotoUrls.map((url, index) =>
            !voorbeeldFout[index] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={`Voorbeeld ${index + 1}: nep foto met geforceerd perspectief`}
                onError={() =>
                  setVoorbeeldFout((prev) => {
                    const next = [...prev];
                    next[index] = true;
                    return next;
                  })
                }
                className="w-full rounded-2xl object-cover bg-gray-100"
                style={{ aspectRatio: '4/3' }}
              />
            ) : (
              <div
                key={url}
                className="w-full rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 text-base"
                style={{ aspectRatio: '4/3' }}
              >
                Voorbeeldfoto {index + 1} ontbreekt
              </div>
            ),
          )}
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFotoSelectie}
        className="hidden"
        id="foto-input-opdracht"
      />

      <p className="text-sm font-semibold text-gray-600 mb-2">
        Jouw foto’s ({items.length}/{maxFotos})
      </p>

      {items.length > 0 && (
        <ul className="flex flex-col gap-4 mb-5">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="relative rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt={`Foto ${index + 1}`}
                className="w-full object-cover"
                style={{ aspectRatio: '4/3' }}
              />
              <div className="flex items-center justify-between px-3 py-2 bg-white border-t border-gray-100">
                <span className="text-sm font-medium text-gray-600">
                  Foto {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => verwijderFoto(item.id)}
                  className="text-sm font-semibold text-red-600 px-3 py-1 rounded-lg active:bg-red-50"
                  style={{ minHeight: '40px' }}
                >
                  Verwijderen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 mt-auto">
        {kanNogToevoegen ? (
          <label
            htmlFor="foto-input-opdracht"
            className="flex items-center justify-center gap-3 w-full bg-blue-600 text-white text-xl font-bold rounded-xl cursor-pointer active:bg-blue-700"
            style={{ minHeight: '72px', fontSize: '20px' }}
          >
            📷{' '}
            {items.length === 0
              ? 'Maak of kies een foto'
              : 'Nog een foto toevoegen'}
          </label>
        ) : (
          <p className="text-center text-sm text-gray-500">
            Maximum van {maxFotos} foto’s bereikt. Verwijder een foto om een andere te kiezen.
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={bezig || items.length === 0}
          className="w-full bg-green-600 text-white text-xl font-bold rounded-xl disabled:opacity-40 active:bg-green-700"
          style={{ minHeight: '56px' }}
        >
          {bezig ? 'Uploaden…' : 'Insturen ✓'}
        </button>
      </div>

      {fout && <p className="text-red-600 text-base mt-4">{fout}</p>}
    </div>
  );
}
