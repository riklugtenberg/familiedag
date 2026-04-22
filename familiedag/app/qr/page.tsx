'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { opdrachten } from '@/config/opdrachten';

const typeEmoji: Record<string, string> = {
  quiz: '📝',
  muziek: '🎵',
  foto: '📷',
};

const typeKleur: Record<string, string> = {
  quiz: 'bg-blue-50 border-blue-200',
  muziek: 'bg-purple-50 border-purple-200',
  foto: 'bg-green-50 border-green-200',
};

export default function QRPagina() {
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin.replace('192.168.137.1', '192.168.2.11'));
  }, []);

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Print header */}
      <div className="text-center mb-8 print:mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Familiedag Lugtenbergjes – QR Codes</h1>
        <p className="text-base text-gray-500 mt-2">
          Scan een QR-code met je telefoon om de opdracht te openen
        </p>
        <p className="text-sm text-gray-400 mt-1 print:hidden">
          Basis-URL: {baseUrl || '…'}
        </p>
        <button
          onClick={() => window.print()}
          className="mt-4 bg-gray-900 text-white font-semibold rounded-xl px-6 py-3 text-base active:bg-gray-700 print:hidden"
        >
          🖨 Printen
        </button>
      </div>

      {/* QR grid */}
      <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto sm:grid-cols-3 md:grid-cols-4 print:grid-cols-4 print:gap-3">
        {opdrachten.map((opdracht) => {
          const url = `${baseUrl}/opdracht/${opdracht.id}`;
          return (
            <div
              key={opdracht.id}
              className={`flex flex-col items-center border-2 rounded-2xl p-4 print:rounded-xl print:p-3 ${typeKleur[opdracht.type]}`}
            >
              {/* Nummer badge */}
              <div className="w-8 h-8 rounded-full bg-gray-800 text-white text-sm font-bold flex items-center justify-center mb-3 print:mb-2">
                {opdracht.id}
              </div>

              {/* QR code */}
              {baseUrl ? (
                <QRCodeSVG
                  value={url}
                  size={140}
                  bgColor="transparent"
                  fgColor="#1a1a1a"
                  className="print:w-28 print:h-28"
                />
              ) : (
                <div className="w-[140px] h-[140px] bg-gray-100 rounded-lg animate-pulse" />
              )}

              {/* Label */}
              <div className="mt-3 text-center print:mt-2">
                <p className="text-lg print:text-base">{typeEmoji[opdracht.type]}</p>
                <p className="text-sm font-bold text-gray-800 leading-tight mt-1 print:text-xs">
                  {opdracht.naam}
                </p>
                <p className="text-xs text-gray-400 mt-1 print:hidden break-all">
                  /opdracht/{opdracht.id}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Print-only footer */}
      <p className="hidden print:block text-center text-xs text-gray-400 mt-6">
        Familiedag Lugtenbergjes – scan de QR-code met de camera-app van je telefoon
      </p>
    </div>
  );
}
