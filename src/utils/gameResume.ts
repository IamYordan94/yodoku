// gameResume.ts — lightweight per-game, per-daily-period in-progress storage.
//
// One entry per game (keyed by game id), stamped with the daily period it
// belongs to. Loading with a different date returns null, so a stale save can
// never leak into a new day's puzzle. Purely additive — games that already keep
// their own state (Change by One, Word Pool, 7 Letters) are untouched.

const STORE_KEY = 'yodoku_resume_v1';

interface Entry<T> {
  d: string;   // daily period key (YYYY-MM-DD)
  t: number;   // updatedAt epoch ms
  s: T;        // game-specific state
}

type Store = Record<string, Entry<unknown>>;

function read(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // ignore (private mode / quota)
  }
}

/** Persist in-progress state for `game` on daily period `date`. */
export function saveResume<T>(game: string, date: string, state: T): void {
  const store = read();
  store[game] = { d: date, t: Date.now(), s: state };
  write(store);
}

/** Read in-progress state for `game` — null unless it matches `date`. */
export function loadResume<T>(game: string, date: string): T | null {
  const entry = read()[game];
  if (!entry || entry.d !== date) return null;
  return entry.s as T;
}

/** True when there is in-progress state for exactly this daily period. */
export function hasResume(game: string, date: string): boolean {
  const entry = read()[game];
  return !!entry && entry.d === date;
}

/** Drop the saved state for `game` (optionally only if it matches `date`). */
export function clearResume(game: string, date?: string): void {
  const store = read();
  const entry = store[game];
  if (!entry) return;
  if (date && entry.d !== date) return;
  delete store[game];
  write(store);
}
