/**
 * Vaste basis-URL voor QR-codes op `/qr`.
 * Zet in productie in `.env`: NEXT_PUBLIC_APP_URL=https://jouw-domein.nl (geen slash aan het eind).
 * Lokaal leeg laten: dan wordt `window.location.origin` gebruikt.
 */
export function getStaticQrBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return raw.replace(/\/$/, '');
}
