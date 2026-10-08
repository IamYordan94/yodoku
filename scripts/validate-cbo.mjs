// Validates Change by One word data end to end.
//
//   node scripts/validate-cbo.mjs
//
// Fails (exit 1) if:
//   - public/words-cbo.json is empty / missing a 4–7 letter bucket
//   - any cbo-pairs-{4,5,6,7}.json start/end token is not in the curated list
//   - a pair's optimal_steps does not equal the true BFS distance in the list,
//     or the pair is unsolvable within the list
//   - any of today's / the next 730 days' date-seeded picks resolves to a pair
//     with an out-of-list token or no solvable ladder
import { readFileSync } from 'node:fs';

const LENGTHS = [4, 5, 6, 7];
// Game-play move ceiling (reset threshold) — used as the BFS search depth.
const MAX_MOVES = { 4: 10, 5: 12, 6: 12, 7: 14 };
// Approved generation caps (audit decision C, 2026-10-08): every pool's
// optimal_steps must sit inside these bounds.
const PAIR_MAX_STEPS = { 4: 10, 5: 8, 6: 8, 7: 8 };
const DAYS_AHEAD = 730;

const wordsData = JSON.parse(readFileSync('public/words-cbo.json', 'utf8'));

const loadBlocklist = (path) =>
  new Set(
    readFileSync(path, 'utf8')
      .split('\n')
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean)
  );
// Tokens no generated puzzle may use, not even as a shortest-path step.
const blockedTokens = new Set([
  ...loadBlocklist('scripts/data/names-blocklist.txt'),
  ...loadBlocklist('scripts/data/prune-blocklist.txt'),
  ...loadBlocklist('scripts/data/safety-blocklist.txt'),
]);
const sets = {};
for (const len of LENGTHS) {
  const list = Array.isArray(wordsData[String(len)]) ? wordsData[String(len)] : [];
  if (list.length === 0) throw new Error(`words-cbo.json has no words for length ${len}`);
  sets[len] = new Set(list.map((w) => w.toLowerCase()));
}
console.log('words-cbo.json:', LENGTHS.map((l) => `${l}L=${sets[l].size}`).join(' '));

const pairsByLen = {};
for (const len of LENGTHS) {
  pairsByLen[len] = JSON.parse(readFileSync(`public/cbo-pairs-${len}.json`, 'utf8'));
}

function buildAdjacency(dict) {
  const set = new Set(dict);
  const adj = new Map();
  for (const word of dict) {
    const nb = [];
    for (let i = 0; i < word.length; i++) {
      for (let c = 97; c <= 122; c++) {
        const ch = String.fromCharCode(c);
        if (ch === word[i]) continue;
        const candidate = word.slice(0, i) + ch + word.slice(i + 1);
        if (set.has(candidate)) nb.push(candidate);
      }
    }
    adj.set(word, nb);
  }
  return adj;
}

function bfsDistance(start, end, adj, maxDepth) {
  if (start === end) return 0;
  const dist = new Map([[start, 0]]);
  let frontier = [start];
  let depth = 0;
  while (frontier.length && depth < maxDepth) {
    const next = [];
    for (const w of frontier) {
      for (const n of adj.get(w) || []) {
        if (n === end) return depth + 1;
        if (!dist.has(n)) {
          dist.set(n, depth + 1);
          next.push(n);
        }
      }
    }
    frontier = next;
    depth++;
  }
  return -1;
}

const adjByLen = {};
for (const len of LENGTHS) adjByLen[len] = buildAdjacency([...sets[len]]);

// --- 1. every pair token is in the curated list, and every pair is solvable ---
let checked = 0;
for (const len of LENGTHS) {
  const pairs = pairsByLen[len];
  if (!Array.isArray(pairs) || pairs.length === 0) throw new Error(`cbo-pairs-${len}.json is empty`);
  const seen = new Set();
  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i];
    const s = String(p.start_word || '').toLowerCase();
    const e = String(p.end_word || '').toLowerCase();
    const where = `cbo-pairs-${len}.json[${i}] ${s}→${e}`;
    if (!sets[len].has(s)) throw new Error(`${where}: start word not in curated list`);
    if (!sets[len].has(e)) throw new Error(`${where}: end word not in curated list`);
    if (s === e) throw new Error(`${where}: start equals end`);
    if (blockedTokens.has(s) || blockedTokens.has(e)) throw new Error(`${where}: blocked endpoint token (name/prune/safety)`);
    if (!Number.isInteger(p.optimal_steps) || p.optimal_steps < 1) throw new Error(`${where}: bad optimal_steps ${p.optimal_steps}`);
    const dist = bfsDistance(s, e, adjByLen[len], MAX_MOVES[len]);
    if (dist === -1) throw new Error(`${where}: no solvable ladder within the dictionary`);
    if (dist !== p.optimal_steps) throw new Error(`${where}: optimal_steps=${p.optimal_steps} but BFS distance=${dist}`);
    if (p.optimal_steps > PAIR_MAX_STEPS[len]) throw new Error(`${where}: optimal_steps=${p.optimal_steps} exceeds approved cap ${PAIR_MAX_STEPS[len]}`);
    if (p.optimal_steps > MAX_MOVES[len]) throw new Error(`${where}: optimal_steps exceeds max moves ${MAX_MOVES[len]}`);
    const key = s < e ? `${s}|${e}` : `${e}|${s}`;
    if (seen.has(key)) throw new Error(`${where}: duplicate pair`);
    seen.add(key);
    checked++;
  }
  console.log(`cbo-pairs-${len}.json: ${pairs.length} pairs ok (all tokens in list, all solvable)`);
}
console.log(`pair checks: ${checked} pairs validated`);

// --- 2. every date-seeded daily pick (today + future) resolves to a valid pair ---
// Replicates src/utils/cbo-dailyChallenge.ts exactly.
function dateToSeed(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (Math.imul(31, hash) + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
function seededRng(seed) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function isoUtc(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

const startDay = Date.UTC(
  new Date().getUTCFullYear(),
  new Date().getUTCMonth(),
  new Date().getUTCDate()
);
let daysChecked = 0;
for (let day = 0; day <= DAYS_AHEAD; day++) {
  const dateStr = isoUtc(new Date(startDay + day * 86400000));
  const rng = seededRng(dateToSeed(dateStr));
  for (const len of LENGTHS) {
    const pairs = pairsByLen[len];
    const idx = Math.floor(rng() * pairs.length);
    const p = pairs[idx];
    const s = String(p.start_word || '').toLowerCase();
    const e = String(p.end_word || '').toLowerCase();
    if (!sets[len].has(s) || !sets[len].has(e)) {
      throw new Error(`${dateStr} (${len}L, index ${idx}): out-of-list token ${s}→${e}`);
    }
    if (bfsDistance(s, e, adjByLen[len], MAX_MOVES[len]) === -1) {
      throw new Error(`${dateStr} (${len}L, index ${idx}): unsolvable pair ${s}→${e}`);
    }
    daysChecked++;
  }
}
console.log(`date scan: ${DAYS_AHEAD + 1} days × ${LENGTHS.length} lengths = ${daysChecked} daily picks valid`);

console.log('\nALL CHECKS PASSED');
