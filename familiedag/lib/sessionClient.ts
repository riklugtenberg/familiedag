/** POST zet het team-cookie (server valideert tegen teamlijst). Geen localStorage. */

export async function saveSessionTeam(teamNaam: string): Promise<boolean> {
  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ teamNaam }),
  });
  return res.ok;
}
