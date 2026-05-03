export type QuizVraagMeerkeuze = {
  id: number;
  vraag: string;
  opties: Array<string>;
  correct: number; // index van het correcte antwoord
  /** Optioneel: afbeelding uit `public/` (bv. `/images/quiz.png`). */
  afbeeldingSrc?: string;
  /** Alleen voor admin: referentie-antwoord of toelichting (niet naar teams). */
  antwoordJury?: string;
};

export type QuizVraagOpen = {
  id: number;
  type: 'open';
  vraag: string;
  /** Optioneel: regel direct boven het invoerveld. */
  regelBovenInvoer?: string;
  /** Optioneel: afbeelding uit `public/` (bv. `/images/quiz.png`). */
  afbeeldingSrc?: string;
  /** Alleen voor admin: referentie-antwoord (niet naar teams). */
  antwoordJury?: string;
};

export type QuizVraag = QuizVraagMeerkeuze | QuizVraagOpen;

export type MuziekFragment = {
  id: number;
  /** Pad onder `public/`, bv. `/audio/o4-f1.mp3` */
  audioSrc: string;
  /** Startpunt in seconden in het audiobestand; bij een voorgesneden fragment meestal 0 */
  startTijd: number;
  /** Optioneel: stoppunt in seconden in hetzelfde bestand (relatief tot startTijd voor de afspeelduur) */
  eindTijd?: number;
  /** Alleen voor de admin — nooit naar client sturen */
  artiest?: string;
  titel?: string;
};

export type QuizOpdracht = {
  id: string;
  type: 'quiz';
  naam: string;
  /** Optioneel; wordt onder de titel op het startscherm en bij de quiz getoond */
  ondertitel?: string;
  vragen: QuizVraag[];
};

export type MuziekOpdracht = {
  id: string;
  type: 'muziek';
  naam: string;
  fragmenten: MuziekFragment[];
};

export type GeluidFragment = {
  id: number;
  /** Pad onder `public/` of absolute URL */
  audioSrc: string;
  startTijd: number;
  eindTijd?: number;
  /** Alleen admin — referentie-antwoord (niet naar teams). */
  antwoordJury: string;
};

export type GeluidOpdracht = {
  id: string;
  type: 'geluid';
  naam: string;
  ondertitel?: string;
  fragmenten: Array<GeluidFragment>;
};

/** Client: zonder antwoordJury op fragmenten. */
export type GeluidOpdrachtClient = Omit<GeluidOpdracht, 'fragmenten'> & {
  fragmenten: Array<Omit<GeluidFragment, 'antwoordJury'>>;
};

export type FotoOpdracht = {
  id: string;
  type: 'foto';
  naam: string;
  /** Paden onder `public/` (bv. `/images/voorbeeld.png`). */
  voorbeeldFotoUrls: Array<string>;
  instructie: string;
  /** Maximaal aantal uploads (standaard 3) */
  maxFotos?: number;
};

export type TimingOpdracht = {
  id: string;
  type: 'timing';
  naam: string;
  /** Doeltijd in seconden */
  doelTijd: number;
  /** Maximaal aantal pogingen (standaard 3) */
  maxPogingen?: number;
};

export type EmojiVraag = {
  id: number;
  emoji: string;
  vraagLabel: string; // bijv. "Welke film?" of "Welk liedje?"
  antwoord: string;   // alleen voor admin
};

export type EmojiOpdracht = {
  id: string;
  type: 'emoji';
  naam: string;
  ondertitel?: string;
  vragen: EmojiVraag[];
};

/** Placeholder tot de opdracht is ingevuld; geen inzending. */
export type GeplandeOpdracht = {
  id: string;
  type: 'gepland';
  naam: string;
};

/** Referentiepunt voor admin (afstand in km); wordt niet naar teams gestuurd. */
export type KaartVraagConfig = {
  id: number;
  vraag: string;
  lat: number;
  lng: number;
  /** Kort label in admin, bijv. stadnaam. */
  referentie: string;
};

export type KaartOpdracht = {
  id: string;
  type: 'kaart';
  naam: string;
  ondertitel?: string;
  vragen: Array<KaartVraagConfig>;
};

/** Client: alleen vraagteksten, geen referentiecoördinaten. */
export type KaartOpdrachtClient = Omit<KaartOpdracht, 'vragen'> & {
  vragen: Array<{ id: number; vraag: string }>;
};

export type Opdracht =
  | QuizOpdracht
  | MuziekOpdracht
  | GeluidOpdracht
  | FotoOpdracht
  | TimingOpdracht
  | EmojiOpdracht
  | KaartOpdracht
  | GeplandeOpdracht;

export const teams: Array<string> = [
  'Christel',
  'Kim',
  'Mariet',
  'Ben',
  'Jolien',
];

export const opdrachten: Opdracht[] = [
  // ── Opdracht 1 ──────────────────────────────────────────────────────────────
  {
    id: '1',
    type: 'quiz',
    naam: 'Quiz: Familie Lugtenberg',
    vragen: [
      {
        id: 1,
        vraag: 'In welk jaar zijn opa en oma getrouwd?',
        opties: ['1949', '1933', '1950', '1947'],
        correct: 0,
        antwoordJury: '1949',
      },
      {
        id: 2,
        vraag: 'Wie is het 5e kleinkind van opa en oma Lugtenberg?',
        opties: ['Christel', 'Hilde', 'Frank', 'Ben', 'Susan', 'Karin'],
        correct: 3,
        antwoordJury: 'Ben (5e kleinkind)',
      },
      {
        id: 3,
        vraag:
          'Wie heeft de groepsapp van de familie Lugtenberg aangemaakt en in welk jaartal?',
        opties: ['Erna in 2016', 'Jolien in 2017', 'Susan in 2017', 'Bennie in 1945'],
        correct: 0,
        antwoordJury: 'Erna in 2016',
      },
      {
        id: 4,
        vraag:
          'Christel, Ben en Erna stapten alle drie in het huwelijksbootje. Hoeveel jaren zijn zij al getrouwd?',
        opties: ['49 jaar', '50 jaar', '51 jaar', '52 jaar'],
        correct: 2,
        antwoordJury: '51 jaar',
      },
      {
        id: 5,
        vraag: 'Hoeveel m² grond heeft de Brandweg 17 inclusief weiland?',
        opties: ['2850 m²', '3975 m²', '4520 m²', '5100 m²'],
        correct: 1,
        antwoordJury: '3975 m²',
      },
      {
        id: 6,
        vraag: 'Van wanneer tot wanneer zijn dit jaar de pompdagen?',
        opties: [
          '19 t/m 23 augustus',
          '18 t/m 22 augustus',
          '12 t/m 16 augustus',
          '13 t/m 17 augustus',
        ],
        correct: 0,
        antwoordJury: '19 t/m 23 augustus',
      },
      {
        id: 7,
        vraag:
          'Hectare, wat is dat? Ik praat alleen in bundes. Hoe vaak was Coen slecht op een familiedag?',
        opties: ['1 keer', '2 keer', '4 keer', 'te vaak'],
        correct: 3,
        antwoordJury: 'Te vaak',
      },
    ],
  },

  // ── Opdracht 2 ──────────────────────────────────────────────────────────────
  {
    id: '2',
    type: 'muziek',
    naam: 'Muziek Herkennen',
    fragmenten: [
      {
        id: 1,
        audioSrc: '/audio/o2-f1.mp3',
        startTijd: 0,
        eindTijd: 5,
        artiest: 'Suzan en Freek',
        titel: 'Als het avond is',
      },
      {
        id: 2,
        audioSrc: '/audio/o4-f2.mp3',
        startTijd: 0,
        eindTijd: 3,
        artiest: 'Vader Abraham',
        titel: "'t Smurfenlied",
      },
      {
        id: 3,
        audioSrc: '/audio/o4-f3.mp3',
        startTijd: 0,
        eindTijd: 15,
        artiest: 'Gebroeders Ko',
        titel: "Toeter op m'n waterscooter",
      },
      {
        id: 4,
        audioSrc: '/audio/o4-f4.mp4',
        startTijd: 0,
        eindTijd: 13,
        artiest: 'Bankzitters',
        titel: 'Cupido',
      },
      {
        id: 5,
        audioSrc: '/audio/o4-f5.mp4',
        startTijd: 0,
        eindTijd: 13,
        artiest: 'Tino Martin',
        titel: 'Zij weet het',
      },
    ],
  },

  // ── Opdracht 3 ──────────────────────────────────────────────────────────────
  {
    id: '3',
    type: 'foto',
    naam: 'Nep-foto challenge',
    voorbeeldFotoUrls: [
      '/images/nep-foto-voorbeeld-opdracht3.png',
      '/images/o3-voorbeeld-geforceerd-perspectief-blaas.png',
      '/images/o3-voorbeeld-geforceerd-perspectief-trap.png',
    ],
    maxFotos: 3,
    instructie:
      'Maak een foto van iemand of meerdere mensen binnen je team, met een nep foto. Hieronder vind je voorbeelden. Kies daarna welke foto’s je wilt insturen — je kunt tot 3 foto’s uploaden. Het team met de meest bijzondere foto krijgt een puntje.',
  },

  // ── Opdracht 4 ──────────────────────────────────────────────────────────────
  {
    id: '4',
    type: 'quiz',
    naam: 'Pubquiz: rondje wereld',
    ondertitel: 'Nieuws, sport en snufjes — typ je antwoord; de jury keurt na afloop goed.',
    vragen: [
      {
        id: 1,
        type: 'open',
        vraag: 'Welk land hoort bij deze vlag?',
        afbeeldingSrc: '/images/pubquiz-vlag-sri-lanka.svg',
        antwoordJury: 'Sri Lanka',
      },
      {
        id: 2,
        type: 'open',
        vraag: 'Hoe heet de Nederlandse minister-president (mei 2026)?',
        antwoordJury: 'Dick Schoof',
      },
      {
        id: 3,
        type: 'open',
        vraag:
          'Het WK voetbal voor mannen in 2026 wordt in hoeveel verschillende landen gespeeld? (alleen het getal)',
        antwoordJury: '3 (Verenigde Staten, Canada, Mexico)',
      },
      {
        id: 4,
        type: 'open',
        vraag: 'In welke stad werd het Eurovisie Songfestival 2025 gehouden?',
        antwoordJury: 'Bazel (Basel; St. Jakobshalle)',
      },
      {
        id: 5,
        vraag:
          'Welk EU-land trad op 1 januari 2026 toe tot het eurogebied (als eenentwintigste lid)?',
        opties: ['Roemenië', 'Polen', 'Hongarije', 'Bulgarije'],
        correct: 3,
        antwoordJury: 'Bulgarije',
      },
      {
        id: 6,
        type: 'open',
        vraag: 'Welk dier staat centraal in het logo van het WNF (Wereld Natuur Fonds)?',
        antwoordJury: 'De reuzenpanda (panda)',
      },
      {
        id: 7,
        type: 'open',
        vraag: 'Hoeveel horizontale banen (strepen) telt de vlag van de Verenigde Staten?',
        antwoordJury: '13 (dertien strepen)',
      },
      {
        id: 8,
        type: 'open',
        vraag: 'Welke drie kleuren heeft de vlag van Estland?',
        antwoordJury: 'Blauw, zwart, wit (boven naar beneden)',
      },
      {
        id: 9,
        type: 'open',
        vraag: 'Hoe noem je een tijdvak van duizend jaar?',
        antwoordJury: 'Millennium',
      },
      {
        id: 10,
        type: 'open',
        vraag:
          'Welke rivier is doorgaans de langste van Europa die volledig op het continent stroomt?',
        antwoordJury: 'De Wolga (Volga)',
      },
      {
        id: 11,
        type: 'open',
        vraag:
          'Welk land werd in 2024 Europees kampioen voetbal bij de mannen?',
        antwoordJury: 'Spanje (finale tegen Engeland)',
      },
    ],
  },

  // ── Opdracht 5 ──────────────────────────────────────────────────────────────
  {
    id: '5',
    type: 'timing',
    naam: 'Timing Challenge',
    doelTijd: 30,
    maxPogingen: 3,
  },

  // ── Opdracht 6 ──────────────────────────────────────────────────────────────
  {
    id: '6',
    type: 'emoji',
    naam: 'Emoji-raadsel',
    ondertitel: 'Type het antwoord — geen hints!',
    vragen: [
      { id: 1, emoji: '🦁 👑', vraagLabel: 'Welke film?', antwoord: 'The Lion King' },
      { id: 2, emoji: '❄️ 👸 ⛄', vraagLabel: 'Welke film?', antwoord: 'Frozen' },
      { id: 3, emoji: '🍟 🍔 🍕 🤤', vraagLabel: 'Welke land?', antwoord: 'Hongarije' },
      { id: 4, emoji: '🐟 🌊 🔍', vraagLabel: 'Welke film?', antwoord: 'Finding Nemo' },
      { id: 5, emoji: '👊 🤫', vraagLabel: 'Welke film?', antwoord: 'Fight Club' },
      { id: 6, emoji: '👑 🐉', vraagLabel: 'Welke serie?', antwoord: 'Game of Thrones' },
      { id: 7, emoji: '👹 🚰', vraagLabel: 'Welke stad is dit?', antwoord: 'Helsinki' },
      { id: 8, emoji: 'B 🦷', vraagLabel: 'Welk technologie is dit?', antwoord: 'Bluetooth' },
      { id: 9, emoji: '🫵 📺', vraagLabel: 'Welk platform is dit?', antwoord: 'YouTube' },
      { id: 10, emoji: '🚫🔑', vraagLabel: 'Welk merk is dit?', antwoord: 'Nokia' },
    ],
  },

  // ── Opdracht 7 ─────────────────────────────────────────────────────────────
  {
    id: '7',
    type: 'kaart',
    naam: 'Nederland op de kaart',
    ondertitel: 'Vijf bijzondere plekken — zet per vraag een stip op de kaart (zonder labels). De jury kiest wie het dichtst zit.',
    vragen: [
      {
        id: 1,
        vraag: 'Waar ligt Poepershoek?',
        referentie: 'Poepershoek',
        lat: 52.67,
        lng: 6.01972,
      },
      {
        id: 2,
        vraag: 'Waar ligt de P.C. Hooftstraat?',
        referentie: 'P.C. Hooftstraat (Amsterdam)',
        lat: 52.3597,
        lng: 4.8797,
      },
      {
        id: 3,
        vraag: 'Waar ligt Nooitgedacht?',
        referentie: 'Nooitgedacht',
        lat: 52.97389,
        lng: 6.66361,
      },
      {
        id: 4,
        vraag: 'Waar ligt Sexbierum?',
        referentie: 'Sexbierum',
        lat: 53.21806,
        lng: 5.48333,
      },
      {
        id: 5,
        vraag: 'Waar ligt Venray?',
        referentie: 'Venray (centrum)',
        lat: 51.52563,
        lng: 5.9737,
      },
    ],
  },

  // ── Opdracht 8 ─────────────────────────────────────────────────────────────
  {
    id: '8',
    type: 'geluid',
    naam: 'Raad het geluid',
    ondertitel: 'Korte fragmenten — typ wat je denkt te horen. De jury keurt goed/fout.',
    fragmenten: [
      {
        id: 1,
        audioSrc: '/audio/o8-f1.mp3',
        startTijd: 60,
        eindTijd: 65,
        antwoordJury:
          'Klikken met een pen',
      },
      {
        id: 2,
        audioSrc: '/audio/o8-f1.mp3',
        startTijd: 180,
        eindTijd: 185,
        antwoordJury: 'Papier knippen',
      },
      {
        id: 3,
        audioSrc: '/audio/o8-f1.mp3',
        startTijd: 230,
        eindTijd: 235,
        antwoordJury: 'Slapende kat (snurken / kat die slaapt)',
      },
      {
        id: 4,
        audioSrc: '/audio/o8-knokkels.mp3',
        startTijd: 0,
        eindTijd: 12,
        antwoordJury: 'Knokkels kraken / knakken met de knokkels',
      },
      {
        id: 5,
        audioSrc: '/audio/o8-ov.mp3',
        startTijd: 0,
        eindTijd: 15,
        antwoordJury: 'OV-chipkaart inchecken / inchecken in bus of trein (OV)',
      },
    ],
  },
];
