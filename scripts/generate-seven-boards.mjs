// Generates 60 daily boards for "7 Letters" → public/data/seven-boards.json
// Reads the hub's word database by absolute path (do NOT copy words.json here).
// Run from the output/game-seven folder:  node scripts/generate-seven-boards.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = 'C:/Users/veria/Desktop/AI STUFF DIFFERENT AGENTS/Build and Online/YODOKUAPP';
const WORDS_PATH = join(REPO_ROOT, 'public', 'data', 'words.json');

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'data', 'seven-boards.json');

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
const MIN_WORDS = 25;

// CLI: --count=N total boards to end up with, --append to keep the existing
// boards and add more instead of regenerating the file from scratch,
// --seed-base=N where to start scanning candidate seeds (defaults to the number
// of boards already present when appending, so a re-run does not rescan them).
const argv = process.argv.slice(2);
const getArg = (n, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : dflt;
};
const APPEND = argv.includes('--append');
const NUM_BOARDS = Number(getArg('count', 60));

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

function solve(letters, center, byLen) {
  const set = new Set(letters);
  const counts = {};
  for (const l of letters) counts[l] = (counts[l] ?? 0) + 1;
  const found = new Set();
  for (let len = 3; len <= 7; len++) {
    for (const w of byLen[len]) {
      if (!w.includes(center)) continue;
      const need = {};
      let ok = true;
      for (const ch of w) {
        if (!set.has(ch)) { ok = false; break; }
        need[ch] = (need[ch] ?? 0) + 1;
        if (need[ch] > counts[ch]) { ok = false; break; }
      }
      if (ok) found.add(w);
    }
  }
  return [...found].sort();
}

function scoreWord(word, letters) {
  const isPangram = word.length === 7 && new Set(word).size === 7 &&
    [...word].every((c) => letters.includes(c));
  const base = word.length === 3 ? 1 : word.length;
  return isPangram ? base + 7 : base;
}

const raw = JSON.parse(readFileSync(WORDS_PATH, 'utf-8'));
// words.json shape: { "3": [{word,pos,definition}, ...], "4": ..., ... }
const byLen = {};
for (const [len, arr] of Object.entries(raw)) {
  byLen[Number(len)] = [...new Set(arr.map((e) => e.word.toLowerCase()))];
}
console.log('Dictionary:', Object.entries(byLen).map(([l, w]) => `${l}:${w.length}`).join(' '), 'words');

// Pre-index dictionary by letter-set signature for fast candidate lookup
const boards = [];

// Append mode: start from the boards already published so a top-up only ADDS.
if (APPEND) {
  try {
    const existing = JSON.parse(readFileSync(OUT_PATH, 'utf-8'));
    for (const b of existing.boards ?? []) boards.push({ ...b, id: boards.length });
    console.log(`Append mode: keeping ${boards.length} existing boards.`);
  } catch {
    console.log('Append mode: no readable existing file, starting fresh.');
  }
}

let candidateSeed = Number(getArg('seed-base', APPEND ? boards.length : 0));

function tryMakeBoard(seedNum) {
  const rng = seedRandom(`seven-board-${seedNum}`);
  // Pick a pangram first: a random 7-distinct-letter word guarantees ≥1 pangram.
  const sevens = byLen[7];
  for (let attempt = 0; attempt < 4000; attempt++) {
    const pangramWord = sevens[Math.floor(rng() * sevens.length)];
    const uniq = [...new Set(pangramWord)];
    if (uniq.length !== 7) continue;
    const letters = uniq.slice().sort();
    const centerIdx = Math.floor(rng() * 7);
    const center = letters[centerIdx];
    const words = solve(letters, center, byLen);
    if (words.length >= MIN_WORDS) {
      const maxScore = words.reduce((s, w) => s + scoreWord(w, letters), 0);
      return {
        id: boards.length,
        letters,
        center,
        words,
        maxScore,
        tiers: {
          good: Math.ceil(maxScore * 0.15),
          solid: Math.ceil(maxScore * 0.3),
          great: Math.ceil(maxScore * 0.45),
          amazing: Math.ceil(maxScore * 0.6),
          genius: Math.ceil(maxScore * 0.8),
          queen: Math.ceil(maxScore * 1),
        },
      };
    }
  }
  return null;
}

while (boards.length < NUM_BOARDS && candidateSeed < 50000) {
  const board = tryMakeBoard(candidateSeed++);
  if (!board) continue;
  const key = board.letters.join('') + '|' + board.center;
  const dup = boards.some((b) => b.letters.join('') + '|' + b.center === key);
  if (!dup) boards.push(board);
}

if (boards.length < NUM_BOARDS) {
  console.error(`FAILED: only produced ${boards.length}/${NUM_BOARDS} boards`);
  process.exit(1);
}

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify({ version: 1, boards }, null, 2));

const minWords = Math.min(...boards.map((b) => b.words.length));
const maxWords = Math.max(...boards.map((b) => b.words.length));
const withPangram = boards.filter((b) => b.words.some((w) => new Set(w).size === 7 && w.length === 7)).length;
console.log(`Wrote ${boards.length} boards → ${OUT_PATH}`);
console.log(`Words per board: min ${minWords}, max ${maxWords}. Boards with a pangram: ${withPangram}/${boards.length}`);

// Top 3 boards by word count (for reporting)
const top3 = [...boards].sort((a, b) => b.words.length - a.words.length).slice(0, 3);
for (const b of top3) console.log(`TOP: ${b.center.toUpperCase()}+${b.letters.filter(l => l !== b.center).join('').toUpperCase()} — ${b.words.length} words`);
