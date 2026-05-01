'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { opdrachten } from '@/config/opdrachten';
import { getStaticQrBaseUrl } from '@/lib/qrBaseUrl';

const QR_IDS = Array.from({ length: 12 }, (_, i) => String(i + 1));

const typeEmoji: Record<string, string> = {
  quiz: '📝',
  muziek: '🎵',
  foto: '📷',
  timing: '⏱',
  emoji: '🔤',
  gepland: '📋',
};

const typeKleur: Record<string, string> = {
  quiz: 'bg-blue-50 border-blue-200',
  muziek: 'bg-purple-50 border-purple-200',
  foto: 'bg-green-50 border-green-200',
  timing: 'bg-amber-50 border-amber-200',
  emoji: 'bg-pink-50 border-pink-200',
  gepland: 'bg-gray-50 border-gray-200',
};

function opdrachtVoorId(id: string) {
  return opdrachten.find((o) => o.id === id);
}

export default function QRPagina() {
  const [baseUrl, setBaseUrl] = useState(() => getStaticQrBaseUrl());

  useEffect(() => {
    if (baseUrl) return;
    setBaseUrl(
      typeof window !== 'undefined'
        ? window.location.origin.replace('192.168.137.1', '192.168.2.11')
        : ''
    );
  }, [baseUrl]);

  return (
    <div className="qr-a4-root min-h-screen bg-white p-6 print:p-0 print:min-h-0">
      <div className="text-center mb-8 qr-screen-only">
        <h1 className="text-3xl font-bold text-gray-900">Familiedag Lugtenbergjes – QR Codes</h1>
        <p className="text-base text-gray-500 mt-2">
          Scan een QR-code met je telefoon om de opdracht te openen
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {getStaticQrBaseUrl() ? (
            <>
              Vaste print-URL: <span className="font-mono">{getStaticQrBaseUrl()}</span>
            </>
          ) : (
            <>
              Lokaal: URL uit de adresbalk. Voor vaste codes: zet{' '}
              <code className="text-xs bg-gray-100 px-1 rounded">NEXT_PUBLIC_APP_URL</code> vóór
              build/deploy.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="mt-4 bg-gray-900 text-white font-semibold rounded-xl px-6 py-3 text-base active:bg-gray-700"
        >
          Printen (1 code per A4)
        </button>
      </div>

      {/* Scherm: grid. Print: elke .qr-a4-page = eigen A4 (zie globals.css) */}
      <div className="qr-a4-pages grid grid-cols-2 gap-4 max-w-3xl mx-auto sm:grid-cols-3 md:grid-cols-4">
        {QR_IDS.map((id) => {
          const opdracht = opdrachtVoorId(id);
          const type = opdracht?.type ?? 'gepland';
          const url = baseUrl ? `${baseUrl}/opdracht/${id}` : '';
          const label = `Opdracht ${id}`;

          return (
            <div
              key={id}
              className={`qr-a4-page flex flex-col items-center justify-start border-2 rounded-2xl p-4
                print:border-0 print:rounded-none print:shadow-none print:bg-white
                ${typeKleur[type] ?? typeKleur.gepland}`}
            >
              <div
                className="w-8 h-8 rounded-full bg-gray-800 text-white text-sm font-bold flex items-center justify-center mb-3
                  print:hidden"
              >
                {id}
              </div>

              {baseUrl ? (
                <>
                  <div className="print:hidden">
                    <QRCodeSVG value={url} size={140} bgColor="#ffffff" fgColor="#1a1a1a" />
                  </div>
                  <div className="hidden print:block">
                    <QRCodeSVG value={url} size={260} bgColor="#ffffff" fgColor="#1a1a1a" />
                  </div>
                </>
              ) : (
                <div className="w-[140px] h-[140px] print:w-[260px] print:h-[260px] bg-gray-100 rounded-lg animate-pulse print:animate-none" />
              )}

              <div className="mt-3 text-center w-full print:mt-6">
                <p className="text-lg print:text-3xl print:mb-2">{typeEmoji[type]}</p>
                <p className="text-base font-bold text-gray-900 mt-1 print:text-2xl print:mt-0 print:tracking-tight">
                  {label}
                </p>
                <p className="text-xs text-gray-400 mt-1 print:hidden break-all">{url}</p>
              </div>

              <p className="hidden print:block text-center text-[11px] text-gray-400 mt-8 max-w-md leading-snug">
                Familiedag Lugtenbergjes – scan met de camera-app van je telefoon
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
