// Daily progress — "played today" signals for the hub strip.
import { getLetterMixCompletedFor, getWordPoolDailyUnlockedLevel } from './storage';
import { loadCboState } from './cbo-gameState';
import { getQuizDone } from './quizStorage';

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const PLAYED_KEYS: Record<string, string> = {
  orderle: 'yodoku_orderle_played',
  fermi: 'yodoku_fermi_played',
};

/** Call when a game is won (ORDERLE/FERMI keep no completion storage). */
export function markPlayed(game: 'orderle' | 'fermi', date: string): void {
  try {
    localStorage.setItem(PLAYED_KEYS[game], date);
  } catch {
    // ignore
  }
}

export interface HubGame {
  id: string;
  label: string;
  accent: string;
  to: string;
  played: boolean;
}

export function getTodayProgress(): HubGame[] {
  const today = todayISO();
  const lmEasy = getLetterMixCompletedFor(today, 'easy');
  const lmMed = getLetterMixCompletedFor(today, 'medium');
  const lmHard = getLetterMixCompletedFor(today, 'hard');
  const cbo = loadCboState(today);
  const cboPlayed = !!cbo && cbo.puzzles.some((p) => p.status === 'won' || p.status === 'playing');
  let sevenPlayed = false;
  try {
    const s = localStorage.getItem('yodoku_seven_letters');
    if (s) {
      const d = JSON.parse(s) as Record<string, { foundWords?: string[] }>;
      sevenPlayed = !!(d[today]?.foundWords && d[today].foundWords!.length > 0);
    }
  } catch {
    // ignore
  }
  let orderlePlayed = false;
  let fermiPlayed = false;
  try {
    orderlePlayed = localStorage.getItem(PLAYED_KEYS.orderle) === today;
    fermiPlayed = localStorage.getItem(PLAYED_KEYS.fermi) === today;
  } catch {
    // ignore
  }
  return [
    { id: 'lettermix', label: 'Clear the String', accent: '#D63B3B', to: '/lettermix', played: !!(lmEasy || lmMed || lmHard) },
    { id: 'changebyone', label: 'Change by One', accent: '#3E9FA8', to: '/changebyone', played: cboPlayed },
    { id: 'wordpool', label: 'Word Pool', accent: '#9FC3DA', to: '/wordpool', played: getWordPoolDailyUnlockedLevel(today) > 1 },
    { id: 'orderle', label: 'ORDERLE', accent: '#39c96b', to: '/orderle', played: orderlePlayed },
    { id: 'fermi', label: 'FERMI', accent: '#ff6b35', to: '/fermi', played: fermiPlayed },
    { id: 'quiz', label: 'Quiz Master', accent: '#8b5cf6', to: '/quiz', played: !!getQuizDone(today) },
    { id: 'seven', label: '7 Letters', accent: '#E7B10A', to: '/seven', played: sevenPlayed },
  ];
}
