# Familiedag App

Mobiel-first Next.js app voor familiedag opdrachten: quiz, muziek herkennen en foto.

## Lokaal starten

```bash
npm install
cp .env.local.example .env.local
# Vul .env.local in (zie stappen hieronder)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Vercel KV instellen

Vercel KV is een gratis Redis-compatibele key-value store.

1. Installeer de Vercel CLI: `npm i -g vercel`
2. Koppel het project: `vercel link`
3. Maak een KV database aan:
   ```bash
   vercel kv create familiedag-kv
   ```
4. Haal de environment variables op:
   ```bash
   vercel env pull .env.local
   ```
   Dit vult `KV_REST_API_URL` en `KV_REST_API_TOKEN` automatisch in.

---

## Cloudinary instellen

Cloudinary biedt een gratis tier voor foto-opslag (25 GB).

1. Maak een gratis account op [cloudinary.com](https://cloudinary.com)
2. Ga naar het dashboard en kopieer:
   - **Cloud name**
   - **API Key**
   - **API Secret**
3. Vul deze in `.env.local`:
   ```
   CLOUDINARY_CLOUD_NAME=jouw-cloud-naam
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
   ```

---

## Audio-bestanden toevoegen

Zet MP3-bestanden in `/public/audio/` en verwijs er naar in `config/opdrachten.ts`:

```
public/
  audio/
    fragment-1.mp3
    fragment-2.mp3
    fragment-3.mp3
```

In de config staat al:
```ts
audioUrl: '/audio/fragment-1.mp3',
```

Pas de bestandsnamen aan naar wens. Je kunt ook externe URLs gebruiken (bijv. `https://...`).

---

## Voorbeeldfoto toevoegen

Zet de voorbeeldfoto op:
```
public/images/voorbeeld.jpg
```

Of pas `voorbeeldFotoUrl` aan in `config/opdrachten.ts` naar een andere URL of bestandsnaam.

---

## Opdrachten aanpassen

Alles staat in `config/opdrachten.ts`:

- **`teams`** — pas teamnamen aan
- **`opdrachten`** — voeg vragen, fragmenten of foto-opdrachten toe of verwijder ze
- De `id` van een opdracht bepaalt de URL: `/opdracht/quiz-1`, `/opdracht/muziek-1`, etc.

---

## Deployen op Vercel

```bash
vercel deploy --prod
```

Na deployment zijn de QR-codes te genereren voor elke opdracht-URL, bijv.:

- `https://jouw-app.vercel.app/opdracht/quiz-1`
- `https://jouw-app.vercel.app/opdracht/muziek-1`
- `https://jouw-app.vercel.app/opdracht/foto-1`

Gebruik een gratis QR-code generator zoals [qr-code-generator.com](https://www.qr-code-generator.com) of [goqr.me](https://goqr.me).

---

## Admin-pagina

Toegankelijk via `/admin`. Pincode: **1212**

- Quiz-scores worden automatisch berekend
- Muziek-scores ken je handmatig toe (✓/✗ per fragment per team)
- Foto-scores geef je een cijfer 0–10
- De totaalstand wordt automatisch berekend
- Gebruik de **Ververs** knop om nieuwe inzendingen te laden
