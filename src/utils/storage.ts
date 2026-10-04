// Web storage — all state lives in localStorage.

const LM_COMPLETED = 'yodoku_lettermix_completed';
export const WP_PROGRESS = 'yodoku_wordpool_progress';
const WP_SESSION = 'yodoku_wordpool_session';
const HINT_TARGET = 'yodoku_hint_target';

export type HintTarget = { targetWord: string; hintLevel: number };
export type LetterMixCompleted = Record<string, { words: string[] }>;
export type WordPoolProgress = Record<string, number>; // categoryId -> highest unlocked level

// ── Helpers ────────────────────────────────────────────────────────────────

function letterMixKey(date: string, level: string): string {
  return `lettermix_${date}_${level}`;
}

function hintTargetKey(game: string, puzzleId: string): string {
  return `hint_${game}_${puzzleId}`;
}

function wpSessionKey(categoryId: string, levelNum: number): string {
  return `${categoryId}_${levelNum}`;
}

// ── LetterMix ──────────────────────────────────────────────────────────────

export function getLetterMixCompleted(): LetterMixCompleted {
  try {
    const s = localStorage.getItem(LM_COMPLETED);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

export function getLetterMixCompletedFor(date: string, level: string): { words: string[] } | undefined {
  return getLetterMixCompleted()[letterMixKey(date, level)];
}

export function setLetterMixCompleted(date: string, level: string, words: string[]) {
  const data = getLetterMixCompleted();
  data[letterMixKey(date, level)] = { words };
  localStorage.setItem(LM_COMPLETED, JSON.stringify(data));
}

// ── WordPool progress ───────────────────────────────────────────────────────

export function getWordPoolProgress(): WordPoolProgress {
  try {
    const s = localStorage.getItem(WP_PROGRESS);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

export function getWordPoolUnlockedLevel(categoryId: string): number {
  return getWordPoolProgress()[categoryId] ?? 1;
}

export function unlockWordPoolLevel(categoryId: string, completedLevel: number) {
  const data = getWordPoolProgress();
  const current = data[categoryId] ?? 1;
  if (completedLevel >= current) {
    data[categoryId] = completedLevel + 1;
    localStorage.setItem(WP_PROGRESS, JSON.stringify(data));
  }
}

// ── WordPool session ────────────────────────────────────────────────────────

type WordPoolSession = Record<string, string[]>;

export function getWordPoolSessionWords(categoryId: string, levelNum: number): string[] {
  try {
    const s = localStorage.getItem(WP_SESSION);
    const data: WordPoolSession = s ? JSON.parse(s) : {};
    return data[wpSessionKey(categoryId, levelNum)] ?? [];
  } catch {
    return [];
  }
}

export function saveWordPoolSessionWords(categoryId: string, levelNum: number, words: string[]) {
  try {
    const s = localStorage.getItem(WP_SESSION);
    const data: WordPoolSession = s ? JSON.parse(s) : {};
    data[wpSessionKey(categoryId, levelNum)] = words;
    localStorage.setItem(WP_SESSION, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function clearWordPoolSessionWords(categoryId: string, levelNum: number) {
  try {
    const s = localStorage.getItem(WP_SESSION);
    const data: WordPoolSession = s ? JSON.parse(s) : {};
    delete data[wpSessionKey(categoryId, levelNum)];
    localStorage.setItem(WP_SESSION, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// ── Hint target ─────────────────────────────────────────────────────────────

export async function getHintTargetAsync(game: string, puzzleId: string): Promise<HintTarget | null> {
  try {
    const s = localStorage.getItem(HINT_TARGET);
    const data: Record<string, HintTarget> = s ? JSON.parse(s) : {};
    return data[hintTargetKey(game, puzzleId)] ?? null;
  } catch {
    return null;
  }
}

export async function setHintTargetAsync(
  game: string,
  puzzleId: string,
  targetWord: string,
  hintLevel: number
): Promise<void> {
  try {
    const s = localStorage.getItem(HINT_TARGET);
    const data: Record<string, HintTarget> = s ? JSON.parse(s) : {};
    data[hintTargetKey(game, puzzleId)] = { targetWord, hintLevel };
    localStorage.setItem(HINT_TARGET, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export async function clearHintTargetAsync(game: string, puzzleId: string): Promise<void> {
  try {
    const s = localStorage.getItem(HINT_TARGET);
    const data: Record<string, HintTarget> = s ? JSON.parse(s) : {};
    delete data[hintTargetKey(game, puzzleId)];
    localStorage.setItem(HINT_TARGET, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// ── WordPool Daily ───────────────────────────────────────────────────────────

const WP_DAILY = 'yodoku_wordpool_daily';
const WP_DAILY_SESSION = 'yodoku_wordpool_daily_session';

export type WPDailyLevel = { words: string[]; hintsUsed: number };
export type WPDailyEntry = {
  levels: Record<string, WPDailyLevel>; // levelNum (string key) -> completion data
  unlockedLevel: number;                  // 1-based; > totalLevels means all done
};
type WPDailyStore = Record<string, WPDailyEntry>;

function getWPDailyStore(): WPDailyStore {
  try {
    const s = localStorage.getItem(WP_DAILY);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

export function getWordPoolDailyEntry(date: string): WPDailyEntry {
  return getWPDailyStore()[date] ?? { levels: {}, unlockedLevel: 1 };
}

export function getWordPoolDailyUnlockedLevel(date: string): number {
  return getWordPoolDailyEntry(date).unlockedLevel;
}

export function completeWordPoolDailyLevel(
  date: string,
  levelNum: number,
  words: string[],
  hintsUsed: number
): void {
  const store = getWPDailyStore();
  const entry = store[date] ?? { levels: {}, unlockedLevel: 1 };
  entry.levels[String(levelNum)] = { words, hintsUsed };
  if (levelNum >= entry.unlockedLevel) {
    entry.unlockedLevel = levelNum + 1;
  }
  store[date] = entry;
  localStorage.setItem(WP_DAILY, JSON.stringify(store));
}

export function isWordPoolDailyAllDone(date: string, totalLevels: number): boolean {
  return getWordPoolDailyUnlockedLevel(date) > totalLevels;
}

export function getWordPoolDailyCompletedDates(): string[] {
  const store = getWPDailyStore();
  return Object.keys(store).filter((d) => store[d].unlockedLevel > 1);
}

type WPDailySession = Record<string, string[]>;

export function getWordPoolDailySessionWords(date: string, levelNum: number): string[] {
  try {
    const s = localStorage.getItem(WP_DAILY_SESSION);
    const data: WPDailySession = s ? JSON.parse(s) : {};
    return data[`${date}_${levelNum}`] ?? [];
  } catch {
    return [];
  }
}

export function saveWordPoolDailySessionWords(date: string, levelNum: number, words: string[]): void {
  try {
    const s = localStorage.getItem(WP_DAILY_SESSION);
    const data: WPDailySession = s ? JSON.parse(s) : {};
    data[`${date}_${levelNum}`] = words;
    localStorage.setItem(WP_DAILY_SESSION, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function clearWordPoolDailySessionWords(date: string, levelNum: number): void {
  try {
    const s = localStorage.getItem(WP_DAILY_SESSION);
    const data: WPDailySession = s ? JSON.parse(s) : {};
    delete data[`${date}_${levelNum}`];
    localStorage.setItem(WP_DAILY_SESSION, JSON.stringify(data));
  } catch { /* ignore */ }
}
