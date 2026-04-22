import { teams } from '@/config/opdrachten';

/** Naam van de cookie waarin alleen het gekozen team staat (geen Redis voor sessie). */
export const TEAM_COOKIE_NAME = 'familiedag_team';

export function getTeamFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const prefix = `${TEAM_COOKIE_NAME}=`;
  const parts = document.cookie.split(';').map((c) => c.trim());

  for (const part of parts) {
    if (!part.startsWith(prefix)) continue;
    const raw = part.slice(prefix.length);
    let decoded: string;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      return null;
    }
    return teams.includes(decoded) ? decoded : null;
  }

  return null;
}
