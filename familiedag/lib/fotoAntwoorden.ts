/** Ondersteunt oude inzendingen (`fotoUrl`) en nieuwe (`fotoUrls`). */

export function fotoUrlsFromAntwoorden(antwoorden: unknown): Array<string> {
  if (!antwoorden || typeof antwoorden !== 'object') return [];
  const o = antwoorden as Record<string, unknown>;
  if (Array.isArray(o.fotoUrls)) {
    return o.fotoUrls.filter((u): u is string => typeof u === 'string');
  }
  if (typeof o.fotoUrl === 'string') return [o.fotoUrl];
  return [];
}
