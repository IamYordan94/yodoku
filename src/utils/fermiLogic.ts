// FERMI game logic — ported from DailyBrain logic.js

export interface FermiPuzzle {
  category: string;
  units: string;
  prompt: string;
  answer: number;
  reveal: string;
  citation: string;
  difficulty: string;
}

export interface FermiGuess {
  guess: number;
  fb: FermiFeedback;
}

export interface FermiFeedback {
  direction: 'lower' | 'higher' | null;
  times: string | null;
  color: 'green' | 'yellow' | 'orange' | 'red';
  win: boolean;
}

export interface FermiState {
  puzzle: FermiPuzzle | null;
  guesses: FermiGuess[];
  attempts: number;
  maxAttempts: number;
  won: boolean;
  over: boolean;
}

const DAY_MS = 86400000;

// UTC day from Date or ISO string
export function utcDay(s: Date | string): number {
  if (s instanceof Date) {
    return Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return Date.UTC(1970, 0, 1);
}

// Deterministic puzzle index from date
export function puzzleIndex(launchISO: string, count: number, now: Date = new Date()): number {
  const days = Math.floor((utcDay(now) - utcDay(launchISO)) / DAY_MS);
  return ((days % count) + count) % count;
}

// Format large numbers nicely
export function formatNumber(x: number): string {
  if (x >= 1e12) return trimNum(x / 1e12) + ' trillion';
  if (x >= 1e9) return trimNum(x / 1e9) + ' billion';
  if (x >= 1e6) return trimNum(x / 1e6) + ' million';
  if (x >= 1e3) return trimNum(x / 1e3) + ' thousand';
  return String(trimNum(x));
}

function trimNum(x: number): string {
  // Values of 1 or more keep the existing two-decimal rounding.
  if (Math.abs(x) >= 1) return String(Math.round(x * 100) / 100);
  // Sub-1 values must keep significant digits instead of collapsing to "0"
  // (e.g. the red-light wavelength 7e-7). Show up to 10 decimal places, then
  // fall back to exponential notation for anything still smaller.
  const fixed = Number(x.toFixed(10));
  if (fixed !== 0) return String(fixed);
  return x.toExponential();
}

export function fermiColor(guess: number, answer: number): 'green' | 'yellow' | 'orange' | 'red' {
  const ratio = guess / answer;
  if (Math.abs(ratio - 1) <= 0.05) return 'green';
  if (ratio >= 0.5 && ratio <= 2) return 'yellow';
  if (ratio >= 0.1 && ratio <= 10) return 'orange';
  return 'red';
}

export function fermiFeedback(guess: number, answer: number): FermiFeedback {
  const ratio = guess / answer;
  const win = Math.abs(ratio - 1) <= 0.05;
  if (win) return { direction: null, times: null, color: 'green', win: true };
  let direction: 'lower' | 'higher';
  let x: number;
  if (ratio > 1) {
    direction = 'lower';
    x = ratio;
  } else {
    direction = 'higher';
    x = 1 / ratio;
  }
  let times: string;
  if (x >= 1000) times = '1,000×';
  else if (x >= 100) times = '100×';
  else if (x >= 10) times = '10×';
  else if (x >= 3) times = '3×';
  else if (x >= 1.5) times = '1.5×';
  else times = 'under 1.5×';
  return { direction, times, color: fermiColor(guess, answer), win: false };
}

export function initFermiState(puzzle: FermiPuzzle): FermiState {
  return {
    puzzle,
    guesses: [],
    attempts: 0,
    maxAttempts: 6,
    won: false,
    over: false,
  };
}

const EMOJI = { green: '🟩', yellow: '🟨', orange: '🟧', red: '🟥' };

export function shareFermiText(guesses: FermiGuess[], puzzleNum: number, score: string, prompt: string): string {
  const line = guesses.map((g) => EMOJI[g.fb.color]).join('');
  return [
    `FERMI #${puzzleNum} ${score}`,
    prompt,
    line,
    'yodoku.app/fermi — guess the number, learn the scale',
  ].join('\n');
}
