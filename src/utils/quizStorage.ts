// Quiz Master — localStorage persistence (completion + streak)

const QUIZ_DONE = 'yodoku_quiz_done';
const QUIZ_STREAK = 'yodoku_quiz_streak';

export interface QuizDone {
  date: string;
  answers: (number | null)[];
}

export function getQuizDone(date: string): QuizDone | null {
  try {
    const s = localStorage.getItem(QUIZ_DONE);
    const data: QuizDone | null = s ? (JSON.parse(s) as QuizDone) : null;
    return data && data.date === date ? data : null;
  } catch {
    return null;
  }
}

// ── In-progress quiz (resume where you left off) ────────────────────────────

const QUIZ_PROGRESS = 'yodoku_quiz_progress';

export interface QuizProgress {
  date: string;
  answers: (number | null)[];
  qIndex: number;
}

export function getQuizProgress(date: string): QuizProgress | null {
  try {
    const s = localStorage.getItem(QUIZ_PROGRESS);
    const data: QuizProgress | null = s ? (JSON.parse(s) as QuizProgress) : null;
    if (!data || data.date !== date) return null;
    if (!Array.isArray(data.answers) || data.answers.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveQuizProgress(date: string, answers: (number | null)[], qIndex: number): void {
  try {
    // Don't persist a finished quiz as "in progress" — completion owns that date.
    localStorage.setItem(QUIZ_PROGRESS, JSON.stringify({ date, answers, qIndex }));
  } catch {
    // ignore
  }
}

export function clearQuizProgress(): void {
  try {
    localStorage.removeItem(QUIZ_PROGRESS);
  } catch {
    // ignore
  }
}

export function saveQuizDone(date: string, answers: (number | null)[]): void {
  try {
    localStorage.setItem(QUIZ_DONE, JSON.stringify({ date, answers }));
  } catch {
    // ignore
  }
}

function yesterdayOf(date: string): string {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getStreak(): number {
  try {
    const s = localStorage.getItem(QUIZ_STREAK);
    return s ? ((JSON.parse(s) as { streak?: number }).streak ?? 0) : 0;
  } catch {
    return 0;
  }
}

/** Call once per completed quiz. Same-date replays don't double-count. */
export function bumpStreak(date: string): number {
  try {
    const s = localStorage.getItem(QUIZ_STREAK);
    const cur: { lastDate: string; streak: number } = s
      ? (JSON.parse(s) as { lastDate: string; streak: number })
      : { lastDate: '', streak: 0 };
    if (cur.lastDate === date) return cur.streak;
    const streak = cur.lastDate === yesterdayOf(date) ? cur.streak + 1 : 1;
    localStorage.setItem(QUIZ_STREAK, JSON.stringify({ lastDate: date, streak }));
    return streak;
  } catch {
    return 1;
  }
}
