export type QuizVraag = {
  id: number;
  vraag: string;
  opties: string[];
  correct: number; // index van het correcte antwoord
};

export type MuziekFragment = {
  id: number;
  audioUrl: string;
  artiest: string;
  titel: string;
};

export type QuizOpdracht = {
  id: string;
  type: 'quiz';
  naam: string;
  vragen: QuizVraag[];
};

export type MuziekOpdracht = {
  id: string;
  type: 'muziek';
  naam: string;
  fragmenten: MuziekFragment[];
};

export type FotoOpdracht = {
  id: string;
  type: 'foto';
  naam: string;
  voorbeeldFotoUrl: string;
  instructie: string;
};

export type Opdracht = QuizOpdracht | MuziekOpdracht | FotoOpdracht;

export const teams: string[] = [
  'Jolien',
  'Erna',
  'Jan',
  'Rik',
  'Tessa',
  'Rudi',
];

export const opdrachten: Opdracht[] = [
  // ── Opdracht 1 ──────────────────────────────────────────────────────────────
  {
    id: '1',
    type: 'quiz',
    naam: 'Quiz: Algemene Kennis',
    vragen: [
      {
        id: 1,
        vraag: 'Wat is de hoofdstad van Nederland?',
        opties: ['Rotterdam', 'Den Haag', 'Amsterdam', 'Utrecht'],
        correct: 2,
      },
      {
        id: 2,
        vraag: 'Hoeveel kleuren heeft een regenboog?',
        opties: ['5', '6', '7', '8'],
        correct: 2,
      },
      {
        id: 3,
        vraag: 'Welk dier is het snelste op land?',
        opties: ['Leeuw', 'Cheetah', 'Paard', 'Struisvogel'],
        correct: 1,
      },
    ],
  },

  // ── Opdracht 2 ──────────────────────────────────────────────────────────────
  {
    id: '2',
    type: 'quiz',
    naam: 'Quiz: Sport & Bewegen',
    vragen: [
      {
        id: 1,
        vraag: 'Hoeveel spelers staan er in een voetbalteam op het veld?',
        opties: ['9', '10', '11', '12'],
        correct: 2,
      },
      {
        id: 2,
        vraag: 'In welk land is de Olympische Spelen ooit voor het eerst gehouden?',
        opties: ['Italië', 'Griekenland', 'Egypte', 'Turkije'],
        correct: 1,
      },
      {
        id: 3,
        vraag: 'Hoeveel sets wint een tennisser in een best-of-5?',
        opties: ['2', '3', '4', '5'],
        correct: 1,
      },
    ],
  },

  // ── Opdracht 3 ──────────────────────────────────────────────────────────────
  {
    id: '3',
    type: 'quiz',
    naam: 'Quiz: Natuur & Dieren',
    vragen: [
      {
        id: 1,
        vraag: 'Hoeveel poten heeft een spin?',
        opties: ['4', '6', '8', '10'],
        correct: 2,
      },
      {
        id: 2,
        vraag: 'Welke planeet is de grootste in ons zonnestelsel?',
        opties: ['Saturnus', 'Neptunus', 'Jupiter', 'Uranus'],
        correct: 2,
      },
      {
        id: 3,
        vraag: 'Hoe noem je een groep wolven?',
        opties: ['Roedel', 'Kudde', 'Zwerm', 'Troep'],
        correct: 0,
      },
    ],
  },

  // ── Opdracht 4 ──────────────────────────────────────────────────────────────
  {
    id: '4',
    type: 'quiz',
    naam: 'Quiz: Film & TV',
    vragen: [
      {
        id: 1,
        vraag: 'In welk jaar verscheen de film Titanic?',
        opties: ['1995', '1996', '1997', '1998'],
        correct: 2,
      },
      {
        id: 2,
        vraag: 'Hoe heet de ijskoningin in de Disney-film Frozen?',
        opties: ['Anna', 'Elsa', 'Olaf', 'Kristoff'],
        correct: 1,
      },
      {
        id: 3,
        vraag: 'Welke acteur speelt Iron Man in de Marvel-films?',
        opties: ['Chris Evans', 'Chris Hemsworth', 'Robert Downey Jr.', 'Mark Ruffalo'],
        correct: 2,
      },
    ],
  },

  // ── Opdracht 5 ──────────────────────────────────────────────────────────────
  {
    id: '5',
    type: 'muziek',
    naam: 'Muziek Herkennen – Deel 1',
    fragmenten: [
      {
        id: 1,
        audioUrl: '/audio/5-fragment-1.mp3',
        artiest: 'ABBA',
        titel: 'Dancing Queen',
      },
      {
        id: 2,
        audioUrl: '/audio/5-fragment-2.mp3',
        artiest: 'Queen',
        titel: 'Bohemian Rhapsody',
      },
      {
        id: 3,
        audioUrl: '/audio/5-fragment-3.mp3',
        artiest: 'Michael Jackson',
        titel: 'Thriller',
      },
    ],
  },

  // ── Opdracht 6 ──────────────────────────────────────────────────────────────
  {
    id: '6',
    type: 'muziek',
    naam: 'Muziek Herkennen – Deel 2',
    fragmenten: [
      {
        id: 1,
        audioUrl: '/audio/6-fragment-1.mp3',
        artiest: 'Adele',
        titel: 'Rolling in the Deep',
      },
      {
        id: 2,
        audioUrl: '/audio/6-fragment-2.mp3',
        artiest: 'Ed Sheeran',
        titel: 'Shape of You',
      },
      {
        id: 3,
        audioUrl: '/audio/6-fragment-3.mp3',
        artiest: 'Whitney Houston',
        titel: 'I Will Always Love You',
      },
    ],
  },

  // ── Opdracht 7 ──────────────────────────────────────────────────────────────
  {
    id: '7',
    type: 'muziek',
    naam: 'Muziek Herkennen – Deel 3',
    fragmenten: [
      {
        id: 1,
        audioUrl: '/audio/7-fragment-1.mp3',
        artiest: 'The Beatles',
        titel: 'Let It Be',
      },
      {
        id: 2,
        audioUrl: '/audio/7-fragment-2.mp3',
        artiest: 'Madonna',
        titel: 'Like a Prayer',
      },
      {
        id: 3,
        audioUrl: '/audio/7-fragment-3.mp3',
        artiest: 'David Bowie',
        titel: 'Heroes',
      },
    ],
  },

  // ── Opdracht 8 ──────────────────────────────────────────────────────────────
  {
    id: '8',
    type: 'foto',
    naam: 'Foto: Grappige Pose',
    voorbeeldFotoUrl: '/images/voorbeeld-8.jpg',
    instructie:
      'Maak een foto waarbij jullie allemaal dezelfde grappige pose doen als op de voorbeeldfoto. Hoe gekker, hoe beter!',
  },

  // ── Opdracht 9 ──────────────────────────────────────────────────────────────
  {
    id: '9',
    type: 'foto',
    naam: 'Foto: Menselijke Piramide',
    voorbeeldFotoUrl: '/images/voorbeeld-9.jpg',
    instructie:
      'Bouw een menselijke piramide en maak er een foto van. Zorg dat iedereen in beeld staat!',
  },

  // ── Opdracht 10 ─────────────────────────────────────────────────────────────
  {
    id: '10',
    type: 'foto',
    naam: 'Foto: Creatieve Uitdaging',
    voorbeeldFotoUrl: '/images/voorbeeld-10.jpg',
    instructie:
      'Zoek samen iets in de omgeving dat de letter van jullie team vormt (bijv. een tak, stoelen, mensen) en maak er een foto van van bovenaf of van opzij.',
  },
];
