// ORDERLE game logic — ported from DailyBrain logic.js

export interface OrderlePuzzle {
  category: string;
  rule: string;
  items: string[];
  reveal: string;
  citation: string;
  difficulty: string;
  reverse?: boolean;
}

export interface OrderleFeedback {
  state: 'green' | 'yellow';
  arrow: 'earlier' | 'later' | null;
}

export interface OrderleState {
  puzzle: OrderlePuzzle | null;
  items: number[];
  answer: number[];
  labels: string[];
  current: number[];
  attempts: number;
  maxAttempts: number;
  won: boolean;
  over: boolean;
  selected: number;
  history: OrderleFeedback[][];
  optimal: number;
}

// Deterministic RNG
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Minimum swaps = n - cycles
export function orderleOptimalMoves(current: number[], answer: number[]): number {
  const n = current.length;
  if (n === 0) return 0;
  const dest = new Array(n);
  for (let i = 0; i < n; i++) dest[i] = answer.indexOf(current[i]);
  const seen = new Array(n).fill(false);
  let cycles = 0;
  for (let i = 0; i < n; i++) {
    if (seen[i]) continue;
    cycles++;
    let j = i;
    while (!seen[j]) {
      seen[j] = true;
      j = dest[j];
    }
  }
  return n - cycles;
}

// Feedback: green if correct, yellow + arrow for direction
export function orderleFeedback(current: number[], answer: number[]): OrderleFeedback[] {
  const pos: Record<number, number> = {};
  answer.forEach((id, i) => {
    pos[id] = i;
  });
  return current.map((id, i) => {
    if (id === answer[i]) return { state: 'green', arrow: null };
    return {
      state: 'yellow',
      arrow: pos[id] < i ? 'earlier' : 'later',
    };
  });
}

export function isOrderleWin(fb: OrderleFeedback[]): boolean {
  return fb.every((f) => f.state === 'green');
}

// Init state from a puzzle
export function initOrderleState(puzzle: OrderlePuzzle, seedIndex: number): OrderleState {
  const labels = [...puzzle.items];
  const items = puzzle.items.map((_, i) => i);
  // `reverse` is retired: every ORDERLE_BANK item is authored in its correct
  // forward order, so the accepted answer is always the list as written. The
  // optional flag on the interface is kept only so older serialised data still
  // type-checks -- nothing in the bank sets it, so no answer is silently inverted.
  const answer = [...items];
  const maxAttempts = puzzle.items.length;
  const current = seededShuffle([...items], seedIndex * 7919 + 17);
  const optimal = orderleOptimalMoves(current, answer);

  return {
    puzzle,
    items,
    answer,
    labels,
    current,
    attempts: 0,
    maxAttempts,
    won: false,
    over: false,
    selected: -1,
    history: [],
    optimal,
  };
}

// Share emoji
const EMOJI = { green: '🟩', yellow: '🟨' };

export function shareOrderleText(rows: OrderleFeedback[][], puzzleNum: number, score: string, rule: string, optimal: number): string {
  const lines = rows.map((fb) => fb.map((f) => EMOJI[f.state]).join(''));
  return [
    `ORDERLE #${puzzleNum} ${score}`,
    `${rule} · optimal ${optimal}`,
    ...lines,
    'yodoku.app/orderle — put it in order, learn why',
  ].join('\n');
}
