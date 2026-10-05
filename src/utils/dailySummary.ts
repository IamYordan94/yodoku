// dailySummary.ts — one combined "everything I played today" summary.
//
// Reads whatever each game already stores (completion / in-progress / resume
// state) for TODAY and distils it into a single shareable line-up. No new
// per-game writes are required; missing data simply shows as not-played.
//
// Date keys mirror each game: Clear the String / Change by One / Word Pool /
// 7 Letters use the LOCAL day, while ORDERLE / FERMI / Quiz Master rotate on
// the UTC day.

import { getLetterMixCompletedFor, getWordPoolDailyEntry } from './storage';
import { loadCboState } from './cbo-gameState';
import { getQuizDone } from './quizStorage';
import { loadResume } from './gameResume';
import { todayISO } from './dailyProgress';
import { getTodayUTCStr } from './dailySeed';

export interface DailySummaryItem {
  id: string;
  label: string;
  short: string;
  played: boolean;
}

export interface DailySummary {
  items: DailySummaryItem[];
  playedCount: number;
  total: number;
  text: string;
}

type OrderleSaved = { won: boolean; attempts: number };
type FermiSaved = { won: boolean; attempts: number };

export function getDailySummary(): DailySummary {
  const local = todayISO();
  const utc = getTodayUTCStr();

  // Clear the String
  const lm = ['easy', 'medium', 'hard'].some((lvl) => !!getLetterMixCompletedFor(local, lvl));

  // Change by One
  let cboWon = 0;
  let cboPlaying = 0;
  const cbo = loadCboState(local);
  if (cbo) {
    for (const p of cbo.puzzles) {
      if (p.status === 'won') cboWon++;
      else if (p.status === 'playing') cboPlaying++;
    }
  }
  const cboPlayed = cboWon > 0 || cboPlaying > 0;

  // Word Pool
  const wpEntry = getWordPoolDailyEntry(local);
  const wpLevels = Object.keys(wpEntry.levels).length;

  // ORDERLE
  const orderle = loadResume<OrderleSaved>('orderle', utc);
  const orderlePlayedKey = (() => {
    try { return localStorage.getItem('yodoku_orderle_played') === local; } catch { return false; }
  })();
  const orderlePlayed = !!orderle && orderle.attempts > 0 ? true : orderlePlayedKey;

  // FERMI
  const fermi = loadResume<FermiSaved>('fermi', utc);
  const fermiPlayedKey = (() => {
    try { return localStorage.getItem('yodoku_fermi_played') === local; } catch { return false; }
  })();
  const fermiPlayed = !!fermi && fermi.attempts > 0 ? true : fermiPlayedKey;

  // Quiz Master (completion is stored per UTC day; the score needs the bank,
  // so we just report that it was played).
  const quiz = getQuizDone(utc);

  // 7 Letters
  let sevenWords = 0;
  try {
    const raw = localStorage.getItem('yodoku_seven_letters');
    if (raw) {
      const d = JSON.parse(raw) as Record<string, { foundWords?: string[] }>;
      sevenWords = d[local]?.foundWords?.length ?? 0;
    }
  } catch { /* ignore */ }

  const items: DailySummaryItem[] = [
    { id: 'lettermix', label: 'Clear the String', short: lm ? '✓ cleared' : 'not played', played: lm },
    {
      id: 'changebyone', label: 'Change by One',
      short: cboWon > 0 ? `${cboWon}/4 ladders` : cboPlaying > 0 ? 'in progress' : 'not played',
      played: cboPlayed,
    },
    { id: 'wordpool', label: 'Word Pool', short: wpLevels > 0 ? `${wpLevels} levels` : 'not played', played: wpLevels > 0 },
    {
      id: 'orderle', label: 'ORDERLE',
      short: orderle && orderle.won ? `solved in ${orderle.attempts}` : orderle && orderle.attempts > 0 ? `${orderle.attempts} swaps in` : 'not played',
      played: orderlePlayed,
    },
    {
      id: 'fermi', label: 'FERMI',
      short: fermi && fermi.won ? '✓ nailed it' : fermi && fermi.attempts > 0 ? `${fermi.attempts}/6 guesses` : 'not played',
      played: fermiPlayed,
    },
    { id: 'quiz', label: 'Quiz Master', short: quiz ? '✓ done' : 'not played', played: !!quiz },
    { id: 'seven', label: '7 Letters', short: sevenWords > 0 ? `${sevenWords} words` : 'not played', played: sevenWords > 0 },
  ];

  const played = items.filter((i) => i.played);
  const playedCount = played.length;
  const parts = played.map((i) => `${i.label} ${i.short}`.trim()).join(', ');
  const text = playedCount > 0
    ? `My Yodoku today: ${playedCount}/7 — ${parts}\nyodoku.app`
    : `I haven't played today's Yodoku yet — seven daily games, one minute each, at yodoku.app`;

  return { items, playedCount, total: items.length, text };
}
