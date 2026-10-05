// 7 LETTERS game logic — pure functions, no React.
// A daily board is 7 letters with one required CENTER letter. Words must be
// 3+ letters, contain the center letter, and use only the 7 given letters.

export interface SevenLettersBoard {
  id: number;
  letters: string[];   // exactly 7 distinct lowercase letters
  center: string;      // one of letters
  words: string[];     // every valid word for this board
  maxScore: number;
  tiers: {
    good: number;      // score cutoffs (35% / 60% / 80% of maxScore)
    great: number;
    genius: number;
  };
}

export interface SevenLettersGameState {
  board: SevenLettersBoard | null;
  foundWords: string[];
  score: number;
}

// ── Solver ─────────────────────────────────────────────────────────────────

/**
 * Given the 7 board letters (with duplicates ignored — boards have distinct
 * letters) and the center letter, return every word from `dictionary`
 * that is 3+ letters, contains the center, and uses only board letters.
 */
export function solveSevenBoard(
  letters: string[],
  center: string,
  dictionary: string[]
): string[] {
  const set = new Set(letters.map((l) => l.toLowerCase()));
  const counts: Record<string, number> = {};
  for (const l of set) counts[l] = (counts[l] ?? 0) + 1;

  const out: string[] = [];
  for (const raw of dictionary) {
    const w = raw.toLowerCase();
    if (w.length < 3 || w.length > 7) continue;
    if (!w.includes(center)) continue;

    const need: Record<string, number> = {};
    let ok = true;
    for (const ch of w) {
      if (!set.has(ch)) { ok = false; break; }
      need[ch] = (need[ch] ?? 0) + 1;
      if (need[ch] > (counts[ch] ?? 0)) { ok = false; break; }
    }
    if (ok) out.push(w);
  }
  return [...new Set(out)].sort();
}

// ── Scoring ────────────────────────────────────────────────────────────────

export function isPangram(word: string, board: SevenLettersBoard): boolean {
  if (word.length !== board.letters.length) return false;
  const set = new Set(board.letters);
  for (const ch of word) if (!set.has(ch)) return false;
  // boards have distinct letters, so length match + subset == uses all 7
  return true;
}

/** 3-letter word = 1 pt; 4+ letters = 1 pt/letter; pangram = +7 bonus. */
export function scoreWord(word: string, board: SevenLettersBoard): number {
  const base = word.length === 3 ? 1 : word.length;
  return isPangram(word, board) ? base + 7 : base;
}

export function maxScoreFor(words: string[], board: SevenLettersBoard): number {
  return words.reduce((sum, w) => sum + scoreWord(w, board), 0);
}

export type SevenTier =
  | 'Beginner'
  | 'Good'
  | 'Solid'
  | 'Great'
  | 'Amazing'
  | 'Genius'
  | 'Queen Bee';

export interface TierCutoffs {
  good: number;
  solid: number;
  great: number;
  amazing: number;
  genius: number;
  queen: number;
}

/**
 * The tier ladder, ascending. Six named tiers above Beginner, expressed as a
 * share of the board's maximum possible score. Richer than the original
 * Good/Great/Genius trio and closer to Spelling-Bee's climb — the top tier
 * (Queen Bee) requires every point on the board.
 */
export const TIER_LADDER: { key: keyof TierCutoffs; label: SevenTier; pct: number }[] = [
  { key: 'good', label: 'Good', pct: 0.15 },
  { key: 'solid', label: 'Solid', pct: 0.3 },
  { key: 'great', label: 'Great', pct: 0.45 },
  { key: 'amazing', label: 'Amazing', pct: 0.6 },
  { key: 'genius', label: 'Genius', pct: 0.8 },
  { key: 'queen', label: 'Queen Bee', pct: 1 },
];

/** Tier cutoffs by % of max possible score (Good 15%, Solid 30%, Great 45%, Amazing 60%, Genius 80%, Queen Bee 100%). */
export function tierCutoffs(maxScore: number): TierCutoffs {
  const at = (p: number) => Math.ceil(maxScore * p);
  return {
    good: at(0.15),
    solid: at(0.3),
    great: at(0.45),
    amazing: at(0.6),
    genius: at(0.8),
    queen: at(1),
  };
}

export function tierFor(score: number, cutoffs: TierCutoffs): SevenTier {
  let tier: SevenTier = 'Beginner';
  for (const t of TIER_LADDER) {
    if (score >= cutoffs[t.key]) tier = t.label;
  }
  return tier;
}

/** The next tier up from `score`, or null when Queen Bee is reached. */
export function nextTier(score: number, cutoffs: TierCutoffs): { label: SevenTier; pointsAway: number } | null {
  for (const t of TIER_LADDER) {
    if (score < cutoffs[t.key]) return { label: t.label, pointsAway: cutoffs[t.key] - score };
  }
  return null;
}

/**
 * Estimate how many more words the next tier needs, at the board's average
 * word value (maxScore / word count). Returns points too, so the UI can lead
 * with the exact number and offer the word count as a friendly guide.
 */
export function wordsToNextTier(
  score: number,
  board: SevenLettersBoard
): { label: SevenTier; points: number; words: number } | null {
  const next = nextTier(score, tierCutoffs(board.maxScore));
  if (!next) return null;
  const avg = board.words.length > 0 ? board.maxScore / board.words.length : 3;
  const words = Math.max(1, Math.ceil(next.pointsAway / Math.max(avg, 1)));
  return { label: next.label, points: next.pointsAway, words };
}

// ── Validation ─────────────────────────────────────────────────────────────

export function isValidWord(word: string, board: SevenLettersBoard): boolean {
  return board.words.includes(word.toLowerCase());
}

// ── Share text (same style as ORDERLE shareOrderleText) ────────────────────

const PANGRAM_EMOJI = '🟨';
const WORD_EMOJI = '🟩';

export function shareSevenText(
  foundWords: string[],
  boardNum: number,
  score: number,
  maxScore: number,
  board: SevenLettersBoard
): string {
  const pangrams = foundWords.filter((w) => isPangram(w, board));
  const grid = foundWords
    .slice()
    .sort()
    .map((w) => (isPangram(w, board) ? PANGRAM_EMOJI : WORD_EMOJI))
    .join('');
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const lines = [
    `7 LETTERS #${boardNum} ${score}/${maxScore} (${pct}%)`,
    `${board.center.toUpperCase()} + ${board.letters.filter((l) => l !== board.center).map((l) => l.toUpperCase()).join(' ')}`,
  ];
  lines.push(grid.slice(0, 60));
  if (pangrams.length > 0) lines.push(`🌟 ${pangrams.map((p) => p.toUpperCase()).join(', ')}`);
  lines.push('yodoku.app/seven — seven letters, one center');
  return lines.join('\n');
}
