// Generates daily boards for "7 Letters" → public/data/seven-boards.json
//
// Answer universe = scripts/data/english-common.txt (the shared curated standard)
// MINUS scripts/data/names-blocklist.txt (a name is never a puzzle answer).
// Earlier revisions solved against public/data/words.json — a 15 MB uncurated
// dictionary full of non-words — which is why ~58% of board answers were junk.
// Every board is pangram-seeded: its letters come from a curated 7-letter word
// with 7 distinct letters, so at least one pangram always exists.
//
// Run from the repo root:  node scripts/generate-seven-boards.mjs
// CLI: --count=N total boards (default 180), --append to keep existing boards
// and add more, --seed-base=N where to start scanning seeds (append defaults to
// the number of boards already present, so a top-up does not rescan them).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const OUT_PATH = join(__dirname, '..', 'public', 'data', 'seven-boards.json');

const MIN_WORDS = 25;
const DEFAULT_COUNT = 180;
// Fixed base seed → fully deterministic generation (no Math.random anywhere).
const BASE_SEED = 0;

const argv = process.argv.slice(2);
const getArg = (n, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : dflt;
};
const APPEND = argv.includes('--append');
const NUM_BOARDS = Number(getArg('count', DEFAULT_COUNT));

// Same mulberry32 PRNG family as the repo's dailySeed.ts (deterministic)
function seedRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Curated word universe ──────────────────────────────────────────────────
function readList(file) {
  return readFileSync(join(DATA_DIR, file), 'utf-8')
    .split(/\r?\n/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const names = new Set(readList('names-blocklist.txt'));
const universe = [
  ...new Set(
    readList('english-common.txt').filter(
      (w) => /^[a-z]+$/.test(w) && w.length >= 3 && w.length <= 7 && !names.has(w)
    )
  ),
];

const byLen = {};
for (const w of universe) (byLen[w.length] ??= []).push(w);
console.log(
  'Curated universe:',
  Object.entries(byLen).map(([l, w]) => `${l}:${w.length}`).join(' '),
  `= ${universe.length} words (names excluded)`
);

// Pangram seeds: curated words with exactly 7 distinct letters.
const pangramSeeds = (byLen[7] ?? []).filter((w) => new Set(w).size === 7);
if (pangramSeeds.length === 0) {
  console.error('FAILED: no 7-distinct-letter curated words to seed from');
  process.exit(1);
}

function solve(letters, center) {
  const counts = {};
  for (const l of letters) counts[l] = (counts[l] ?? 0) + 1;
  const found = new Set();
  for (let len = 3; len <= 7; len++) {
    for (const w of byLen[len] ?? []) {
      if (!w.includes(center)) continue;
      const need = {};
      let ok = true;
      for (const ch of w) {
        if (!(ch in counts)) { ok = false; break; }
        need[ch] = (need[ch] ?? 0) + 1;
        if (need[ch] > counts[ch]) { ok = false; break; }
      }
      if (ok) found.add(w);
    }
  }
  return [...found].sort();
}

function isPangram(word, letters) {
  return word.length === 7 && new Set(word).size === 7 && [...word].every((c) => letters.includes(c));
}

/** Mirrors scoreWord() in src/utils/sevenLettersLogic.ts exactly. */
function scoreWord(word, letters) {
  const base = word.length === 3 ? 1 : word.length;
  return isPangram(word, letters) ? base + 7 : base;
}

function tierBlock(maxScore) {
  const at = (p) => Math.ceil(maxScore * p);
  return { good: at(0.15), solid: at(0.3), great: at(0.45), amazing: at(0.6), genius: at(0.8), queen: at(1) };
}

// ── Generation ─────────────────────────────────────────────────────────────
const boards = [];

if (APPEND) {
  try {
    const existing = JSON.parse(readFileSync(OUT_PATH, 'utf-8'));
    for (const b of existing.boards ?? []) boards.push({ ...b, id: boards.length });
    console.log(`Append mode: keeping ${boards.length} existing boards.`);
  } catch {
    console.log('Append mode: no readable existing file, starting fresh.');
  }
}

let candidateSeed = Number(getArg('seed-base', APPEND ? boards.length : BASE_SEED));
const SEED_LIMIT = 200000;

function tryMakeBoard(seedNum) {
  const rng = seedRandom(`seven-board-${seedNum}`);
  const pangramWord = pangramSeeds[Math.floor(rng() * pangramSeeds.length)];
  const letters = [...new Set(pangramWord)].sort();
  // Evaluate every center; keep only boards rich enough to play.
  const perCenter = letters.map((center) => ({ center, words: solve(letters, center) }));
  const qualifying = perCenter.filter((c) => c.words.length >= MIN_WORDS);
  if (qualifying.length === 0) return null;
  const pick = qualifying[Math.floor(rng() * qualifying.length)];
  const maxScore = pick.words.reduce((s, w) => s + scoreWord(w, letters), 0);
  return { letters, center: pick.center, words: pick.words, maxScore };
}

while (boards.length < NUM_BOARDS && candidateSeed < SEED_LIMIT) {
  const board = tryMakeBoard(candidateSeed++);
  if (!board) continue;
  const key = board.letters.join('') + '|' + board.center;
  if (boards.some((b) => b.letters.join('') + '|' + b.center === key)) continue;
  boards.push({
    id: boards.length,
    letters: board.letters,
    center: board.center,
    words: board.words,
    maxScore: board.maxScore,
    tiers: tierBlock(board.maxScore),
  });
}

if (boards.length < NUM_BOARDS) {
  console.error(`FAILED: only produced ${boards.length}/${NUM_BOARDS} boards (scanned ${candidateSeed} seeds)`);
  process.exit(1);
}

// ── Self-checks (fail loudly rather than ship bad data) ────────────────────
const universeSet = new Set(universe);
for (const b of boards) {
  if (b.id !== boards.indexOf(b)) { console.error('FAILED: id mismatch at ' + b.id); process.exit(1); }
  if (b.letters.length !== 7 || new Set(b.letters).size !== 7) { console.error(`FAILED: board ${b.id} letters not 7 distinct`); process.exit(1); }
  if (!b.letters.includes(b.center)) { console.error(`FAILED: board ${b.id} center not on board`); process.exit(1); }
  let pangrams = 0;
  for (const w of b.words) {
    if (!universeSet.has(w)) { console.error(`FAILED: board ${b.id} word "${w}" not in curated universe`); process.exit(1); }
    if (!w.includes(b.center)) { console.error(`FAILED: board ${b.id} word "${w}" missing center`); process.exit(1); }
    const counts = {};
    for (const l of b.letters) counts[l] = (counts[l] ?? 0) + 1;
    const need = {};
    let ok = true;
    for (const ch of w) { if (!(ch in counts)) { ok = false; break; } need[ch] = (need[ch] ?? 0) + 1; if (need[ch] > counts[ch]) { ok = false; break; } }
    if (!ok) { console.error(`FAILED: board ${b.id} word "${w}" not formable from letters`); process.exit(1); }
    if (isPangram(w, b.letters)) pangrams++;
  }
  if (pangrams < 1) { console.error(`FAILED: board ${b.id} has no pangram`); process.exit(1); }
  const recomputed = b.words.reduce((s, w) => s + scoreWord(w, b.letters), 0);
  if (recomputed !== b.maxScore) { console.error(`FAILED: board ${b.id} maxScore ${b.maxScore} != recomputed ${recomputed}`); process.exit(1); }
}

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify({ version: 1, boards }, null, 2));

const counts = boards.map((b) => b.words.length).sort((a, b) => a - b);
const scores = boards.map((b) => b.maxScore).sort((a, b) => a - b);
const withPangram = boards.filter((b) => b.words.some((w) => isPangram(w, b.letters))).length;
console.log(`Wrote ${boards.length} boards → ${OUT_PATH}`);
console.log(`Words/board: min ${counts[0]}, median ${counts[Math.floor(counts.length / 2)]}, max ${counts[counts.length - 1]}`);
console.log(`maxScore range: ${scores[0]}–${scores[scores.length - 1]}. Boards with a pangram: ${withPangram}/${boards.length}`);
