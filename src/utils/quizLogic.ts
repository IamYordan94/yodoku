// QUIZ MASTER — pure game logic (daily general-knowledge quiz)

import { seedRandom } from './dailySeed';

export const QUIZ_LAUNCH_DATE = '2026-08-22';
export const QUIZ_PER_DAY = 10;
// Difficulty ramp: 4 easy, 3 medium, 3 hard
export const RAMP: (1 | 2 | 3)[] = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3];

export interface QuizQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  answer: number;
  difficulty: 1 | 2 | 3;
  hint?: string;
  /** Optional teaching line shown when the answer is revealed (wrong answers). */
  explanation?: string;
}

export interface QuizCategory {
  id: string;
  label: string;
  emoji: string;
}

export interface QuizBank {
  version: number;
  categories: QuizCategory[];
  questions: QuizQuestion[];
}

/** Same shape as QuizQuestion; options are re-shuffled for the day. */
export type DailyQuestion = QuizQuestion;

export const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  general: { label: 'General', emoji: '🌍' },
  sports: { label: 'Sports', emoji: '⚽' },
  movies: { label: 'Movies & TV', emoji: '🎬' },
  geography: { label: 'Geography', emoji: '🗺️' },
  science: { label: 'Science', emoji: '🔬' },
  history: { label: 'History', emoji: '🏛️' },
  music: { label: 'Music', emoji: '🎵' },
  technology: { label: 'Technology', emoji: '💻' },
  food: { label: 'Food & Drink', emoji: '🍔' },
  art: { label: 'Art & Literature', emoji: '📚' },
  animals: { label: 'Animals', emoji: '🦁' },
};

const DAY_MS = 86400000;

/** Quiz number = days since launch. Same for everyone, ticks daily. */
export function getQuizNumber(dateStr: string): number {
  const utcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const days = Math.floor(
    (utcDay(new Date(dateStr + 'T00:00:00Z')) - utcDay(new Date(QUIZ_LAUNCH_DATE + 'T00:00:00Z'))) / DAY_MS
  );
  return Math.max(days, 0);
}

export function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build the daily question set. Deterministic per date — every player
 * gets the same quiz, which is the whole point (shared score).
 */
export function buildDailyQuiz(bank: QuizBank, dateStr: string): DailyQuestion[] {
  const rng = seedRandom('quizmaster:' + dateStr);
  const pools: Record<number, QuizQuestion[]> = { 1: [], 2: [], 3: [] };
  for (const q of bank.questions) {
    if (pools[q.difficulty]) pools[q.difficulty].push(q);
  }
  const picked: QuizQuestion[] = [];
  const usedCats = new Set<string>();
  for (const diff of RAMP) {
    const pool = pools[diff];
    if (pool.length === 0) continue;
    // Prefer a question from a category not yet used today (max diversity)
    const fresh = pool.filter((q) => !usedCats.has(q.category));
    const candidate = fresh.length > 0 ? fresh : pool;
    const idx = Math.floor(rng() * candidate.length);
    const q = candidate[idx];
    picked.push(q);
    usedCats.add(q.category);
    // remove the picked question so it can never repeat within the daily set
    const poolIdx = pool.indexOf(q);
    if (poolIdx !== -1) pool.splice(poolIdx, 1);
  }
  return picked.map((q) => {
    // Re-shuffle options for the day so the correct position varies.
    const optRng = seedRandom('qm-opt:' + q.id + ':' + dateStr);
    const order = seededShuffle(
      q.options.map((_, i) => i),
      optRng
    );
    return {
      ...q,
      options: order.map((i) => q.options[i]),
      answer: order.indexOf(q.answer),
    };
  });
}

export function scoreQuiz(questions: DailyQuestion[], answers: (number | null)[]): number {
  let s = 0;
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] !== null && answers[i] === questions[i].answer) s++;
  }
  return s;
}

export function verdict(score: number, total: number): string {
  const p = total === 0 ? 0 : score / total;
  if (p === 1) return 'PERFECT — you are the Quiz Master today.';
  if (p >= 0.8) return 'Excellent. The trivia gods nod approvingly.';
  if (p >= 0.6) return 'Solid. A respectable podium finish.';
  if (p >= 0.4) return 'Not bad — tomorrow is a brand-new quiz.';
  return 'Ouch. The questions won this round. Come back tomorrow.';
}

export function shareQuizText(results: (boolean | null)[], num: number, score: number, total: number): string {
  const grid = results.map((r) => (r === true ? '🟩' : r === false ? '🟥' : '⬜')).join('');
  return [`QUIZ MASTER #${num} ${score}/${total}`, grid, 'yodoku.app/quiz — new quiz every day'].join('\n');
}

