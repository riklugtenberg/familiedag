export type QuizVraag = {
  id: number;
  vraag: string;
  opties: string[];
  correct: number; // index van het correcte antwoord
};

export type MuziekFragment = {
  id: number;
  /** Pad onder `public/`, bv. `/audio/o4-f1.mp3` */
  audioSrc: string;
  /** Startpunt in seconden in het audiobestand; bij een voorgesneden fragment meestal 0 */
  startTijd: number;
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

export type FotoOpdracht = {
  id: string;
  type: 'foto';
  naam: string;
  voorbeeldFotoUrl: string;
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

export type Opdracht = QuizOpdracht | MuziekOpdracht | FotoOpdracht | TimingOpdracht | EmojiOpdracht;

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
    naam: 'Boerelijke breinbrekers',
    ondertitel: 'Raadsels voor wie verder denkt dan de wei lang is',
    vragen: [
      {
        id: 1,
        vraag:
          'Een boer heeft 17 schapen. Op 9 na gaan ze allemaal dood. Hoeveel blijven er over?',
        opties: ['8', '9', '17', '0'],
        correct: 1,
      },
      {
        id: 2,
        vraag: 'Wat kan door een weiland reizen zonder ooit te bewegen?',
        opties: ['Wind', 'Schaduw', 'Een geluid', 'Een weg'],
        correct: 2,
      },
      {
        id: 3,
        vraag:
          'Een haan legt een ei precies op de nok van het dak van de schuur. Naar welke kant rolt het ei?',
        opties: ['Links', 'Rechts', 'Naar de zon', 'Geen enkele kant'],
        correct: 3,
      },
      {
        id: 4,
        vraag: 'Hoe verder je kijkt, hoe minder je ziet. Wat is het?',
        opties: ['Mist', 'Donker', 'De horizon', 'Afstand'],
        correct: 3,
      },
      {
        id: 5,
        vraag:
          'Een boer heeft één lucifer. Hij komt in een donkere schuur met een olielamp, een houtkachel en een kaars. Wat steekt hij als eerste aan?',
        opties: ['De lamp', 'De kachel', 'De kaars', 'De lucifer'],
        correct: 3,
      },
      {
        id: 6,
        vraag:
          'Wat wordt van jou, gebruikt door anderen, maar zie je zelf zelden?',
        opties: ['Je stem', 'Je naam', 'Je gezicht', 'Je schaduw'],
        correct: 1,
      },
      {
        id: 7,
        vraag: 'Welke maand heeft 28 dagen?',
        opties: ['Februari', 'Alleen schrikkeljaar', 'December', 'Alle maanden'],
        correct: 3,
      },
      {
        id: 8,
        vraag:
          'Een boer kijkt uit het raam en ziet 6 koeien in een weiland. Terwijl hij kijkt, lopen er 4 weg. Hoeveel koeien ziet hij nog?',
        opties: ['2', '4', '6', '10'],
        correct: 2,
      },
      {
        id: 9,
        vraag: 'Hoe kan iemand acht dagen niet slapen?',
        opties: ['Door koffie', 'Door medicijnen', 'Dat kan niet', 'Hij slaapt ’s nachts'],
        correct: 3,
      },
      {
        id: 10,
        vraag:
          'Wat heeft wortels die niemand ziet, groeit hoger dan bomen, stijgt nooit op, maar lijkt toch te groeien?',
        opties: ['Mais', 'Een berg', 'Een wolk', 'Een schuur'],
        correct: 1,
      },
      {
        id: 11,
        vraag: 'Wat wordt natter hoe meer het droogt?',
        opties: ['Modder', 'Een handdoek', 'Gras', 'Een spons'],
        correct: 1,
      },
      {
        id: 12,
        vraag:
          'Je gooit mij weg als je me nodig hebt, en haalt me terug als je me niet meer nodig hebt. Wat ben ik?',
        opties: ['Een visnet', 'Een anker', 'Een emmer', 'Een laars'],
        correct: 1,
      },
    ],
  },

  // ── Opdracht 3 ──────────────────────────────────────────────────────────────
  {
    id: '3',
    type: 'foto',
    naam: 'Nep-foto challenge',
    voorbeeldFotoUrl: '/images/nep-foto-voorbeeld-opdracht3.png',
    maxFotos: 3,
    instructie:
      'Maak een foto van iemand of meerdere mensen binnen je team, met een nep foto. Hieronder vind je een voorbeeld. Je kunt tot 3 foto’s uploaden. Het team met de meest bijzondere foto krijgt een puntje.',
  },

  // ── Opdracht 4 ──────────────────────────────────────────────────────────────
  {
    id: '4',
    type: 'muziek',
    naam: 'Muziek Herkennen',
    fragmenten: [
      {
        id: 1,
        audioSrc: '/audio/audio-1.mp3',
        startTijd: 30,
        artiest: 'The Beatles',
        titel: 'Let It Be',
      },
      {
        id: 2,
        audioSrc: '/audio/o4-f2.mp3',
        startTijd: 0,
        artiest: 'Marco Borsato',
        titel: 'Dromen zijn bedrog',
      },
      {
        id: 3,
        audioSrc: '/audio/o4-f3.mp3',
        startTijd: 0,
        artiest: 'Queen',
        titel: 'Bohemian Rhapsody',
      },
      {
        id: 4,
        audioSrc: '/audio/o4-f4.mp3',
        startTijd: 0,
        artiest: 'a-ha',
        titel: 'Take On Me',
      },
      {
        id: 5,
        audioSrc: '/audio/o4-f5.mp3',
        startTijd: 0,
        artiest: 'Toto',
        titel: 'Africa',
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
      { id: 1,  emoji: '🦁 👑 🌍',       vraagLabel: 'Welke film?',        antwoord: 'The Lion King' },
      { id: 2,  emoji: '❄️ 👸 ⛄',        vraagLabel: 'Welke film?',        antwoord: 'Frozen' },
      { id: 3,  emoji: '🕷️ 🕸️ 🗽',      vraagLabel: 'Welke superheld?',   antwoord: 'Spider-Man' },
      { id: 4,  emoji: '🐟 🌊 🔍',        vraagLabel: 'Welke film?',        antwoord: 'Finding Nemo' },
      { id: 5,  emoji: '🧙‍♂️ ⚡ 📚',     vraagLabel: 'Welke boekenreeks?', antwoord: 'Harry Potter' },
      { id: 6,  emoji: '🍕 🐢 🥋',        vraagLabel: 'Welke serie?',       antwoord: 'Ninja Turtles' },
      { id: 7,  emoji: '🌺 🌊 🏝️',       vraagLabel: 'Welke film?',        antwoord: 'Moana' },
      { id: 8,  emoji: '🏎️ ⚡ 🏁',       vraagLabel: 'Welke film?',        antwoord: 'Cars' },
      { id: 9,  emoji: '👶 🦈 🎵',        vraagLabel: 'Welk liedje?',       antwoord: 'Baby Shark' },
      { id: 10, emoji: '🤖 🗑️ ❤️',       vraagLabel: 'Welke film?',        antwoord: 'WALL-E' },
    ],
  },
];
