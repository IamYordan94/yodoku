// 7 Letters board validator — asserts every shipped board against the curated standard.
// Standalone like scripts/test-seven-tiers.mjs. Prints ALL CHECKS PASSED on success.
//
//   node scripts/test-seven-boards.mjs
//
// Checks: 180 boards, sequential ids 0..179, every word in the curated universe
// (english-common.txt minus names-blocklist.txt), every word contains the center,
// every word is formable from the board's letters, >=1 pangram per board, no
// duplicate boards, and maxScore == a recomputed score.
// Stats: words/board (min/median/max), maxScore range, and the share of boards a
// player using only very common words (wordfreq zipf >= 4) can still reach
// Good (15%) and Solid (30%) on. The last stat needs `uv` + wordfreq.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BOARDS_PATH = join(ROOT, 'public', 'data', 'seven-boards.json');

const assert = (cond, msg) => { if (!cond) throw new Error('FAIL: ' + msg); };

function readList(rel) {
  return readFileSync(join(ROOT, 'scripts', 'data', rel), 'utf-8')
    .split(/\r?\n/).map((s) => s.trim().toLowerCase()).filter(Boolean);
}
const names = new Set(readList('names-blocklist.txt'));
const universe = new Set(
  readList('english-common.txt').filter((w) => /^[a-z]+$/.test(w) && w.length >= 3 && w.length <= 7 && !names.has(w))
);

function isPangram(word, letters) {
  return word.length === 7 && new Set(word).size === 7 && [...word].every((c) => letters.includes(c));
}
function scoreWord(word, letters) {
  const base = word.length === 3 ? 1 : word.length;
  return isPangram(word, letters) ? base + 7 : base;
}
function formable(word, letters) {
  const counts = {};
  for (const l of letters) counts[l] = (counts[l] ?? 0) + 1;
  const need = {};
  for (const ch of word) {
    if (!(ch in counts)) return false;
    need[ch] = (need[ch] ?? 0) + 1;
    if (need[ch] > counts[ch]) return false;
  }
  return true;
}

const data = JSON.parse(readFileSync(BOARDS_PATH, 'utf-8'));
const boards = data.boards;

// ── Structural assertions ──────────────────────────────────────────────────
assert(Array.isArray(boards), 'boards is not an array');
assert(boards.length === 180, `expected 180 boards, got ${boards.length}`);

const keys = new Set();
for (let i = 0; i < boards.length; i++) {
  const b = boards[i];
  assert(b.id === i, `board at index ${i} has id ${b.id}`);
  assert(Array.isArray(b.letters) && b.letters.length === 7 && new Set(b.letters).size === 7,
    `board ${b.id}: letters must be 7 distinct`);
  assert(b.letters.includes(b.center), `board ${b.id}: center "${b.center}" not among letters`);
  assert(Array.isArray(b.words) && b.words.length > 0, `board ${b.id}: no words`);
  let pangrams = 0;
  for (const w of b.words) {
    assert(universe.has(w), `board ${b.id}: word "${w}" not in curated universe`);
    assert(w.includes(b.center), `board ${b.id}: word "${w}" missing center`);
    assert(formable(w, b.letters), `board ${b.id}: word "${w}" not formable from letters`);
    if (isPangram(w, b.letters)) pangrams++;
  }
  assert(pangrams >= 1, `board ${b.id}: no pangram`);
  const rec = b.words.reduce((s, w) => s + scoreWord(w, b.letters), 0);
  assert(rec === b.maxScore, `board ${b.id}: maxScore ${b.maxScore} != recomputed ${rec}`);
  const key = [...b.letters].sort().join('') + '|' + b.center;
  assert(!keys.has(key), `duplicate board ${key}`);
  keys.add(key);
}
console.log('structure: 180 boards, ids 0..179, all words curated + centered + formable, >=1 pangram, maxScore exact, 0 duplicate boards');

// ── Stats ──────────────────────────────────────────────────────────────────
const wc = boards.map((b) => b.words.length).sort((a, b) => a - b);
const ms = boards.map((b) => b.maxScore).sort((a, b) => a - b);
const median = (a) => a[Math.floor(a.length / 2)];
console.log(`words/board: min ${wc[0]}, median ${median(wc)}, max ${wc[wc.length - 1]}`);
console.log(`maxScore: min ${ms[0]}, median ${median(ms)}, max ${ms[ms.length - 1]}`);
const pangramCount = boards.reduce((n, b) => n + b.words.filter((w) => isPangram(w, b.letters)).length, 0);
console.log(`pangrams: ${pangramCount} total, every board has >=1`);

// ── Common-words-only reachability (wordfreq zipf >= 4) ────────────────────
const py = `
import json, sys, math
from wordfreq import zipf_frequency
data = json.load(open(sys.argv[1], encoding='utf-8'))
good = solid = 0
shares = []
for b in data['boards']:
    letters = set(b['letters'])
    def score(w):
        pan = len(w) == 7 and set(w) == letters
        base = 1 if len(w) == 3 else len(w)
        return base + 7 if pan else base
    common = sum(score(w) for w in b['words'] if zipf_frequency(w, 'en') >= 4)
    g = math.ceil(b['maxScore'] * 0.15)
    s = math.ceil(b['maxScore'] * 0.30)
    good += 1 if common >= g else 0
    solid += 1 if common >= s else 0
    shares.append(common / b['maxScore'])
n = len(data['boards'])
print(json.dumps({"n": n, "good": good, "solid": solid,
                  "avgShare": sum(shares) / n, "minShare": min(shares), "maxShare": max(shares)}))
`;
const pyRes = spawnSync('uv', ['run', '--with', 'wordfreq', 'python', '-', BOARDS_PATH], {
  input: py, encoding: 'utf-8', timeout: 180000,
});
if (pyRes.status === 0 && pyRes.stdout.trim()) {
  const r = JSON.parse(pyRes.stdout.trim());
  const pct = (x) => `${((x / r.n) * 100).toFixed(1)}%`;
  console.log(`common-words-only (zipf>=4): Good reachable on ${r.good}/${r.n} (${pct(r.good)}), Solid on ${r.solid}/${r.n} (${pct(r.solid)})`);
  console.log(`common-word score share: avg ${(r.avgShare * 100).toFixed(0)}%, min ${(r.minShare * 100).toFixed(0)}%, max ${(r.maxShare * 100).toFixed(0)}%`);
} else {
  console.log('common-words-only reachability: SKIPPED (uv + wordfreq unavailable)');
  console.log((pyRes.stderr || '').trim().split('\n').slice(-2).join(' | '));
}

console.log('\nALL CHECKS PASSED');
