// Generates word-ladder pairs for Change by One from the curated dictionary.
//
//   node scripts/gen-cbo-pairs.mjs
//
// Every pair is guaranteed solvable inside public/words-cbo.json: the shortest
// path is computed by BFS over the dictionary itself. Start/end words are drawn
// only from curated tokens that are NOT common given/surnames
// (scripts/data/names-blocklist.txt), and the reconstructed shortest path is
// rejected if any intermediate step is a name — so puzzle words stay words a
// player recognises. The audited abbreviation / foreign-word / proper-noun
// blocklist (scripts/data/prune-blocklist.txt) and the safety blocklist
// (scripts/data/safety-blocklist.txt) are applied on top: since
// build-cbo-words.mjs already removed those tokens from the dictionary they can
// never appear, but the exclusion is kept explicit so a future dictionary
// refresh cannot leak them back in. Names remain valid for MANUAL play because
// the game's dictionary file still contains them.
//
// Generation is deterministic (fixed seed) so re-runs reproduce the same pools.
//
// Step caps (audit decision C, 2026-10-08): ladders are kept short so the
// daily fits the "one minute per game" promise. 4-letter keeps its 3..10 range;
// 5/6/7-letter are capped at 8 steps (mins unchanged at 4/5/5). The caps and
// mins are the single source of truth below — edit them here and the re-run
// keeps them.
import { readFileSync, writeFileSync } from 'node:fs';

// ─── Parameters ──────────────────────────────────────────────────────────────
// Minimum / maximum number of single-letter steps for a generated pair.
// 4L: audit range 3..10 (unchanged). 5/6/7L: audit cap max 8, mins 4/5/5.
const PAIR_MIN_STEPS = { 4: 3, 5: 4, 6: 5, 7: 5 };
const PAIR_MAX_STEPS = { 4: 10, 5: 8, 6: 8, 7: 8 };
const TARGET_PER_LENGTH = 400;
const LENGTHS = [4, 5, 6, 7];
const SEED = 0x0c0d0b1a; // fixed -> reproducible pools

const wordsData = JSON.parse(readFileSync('public/words-cbo.json', 'utf8'));

const loadBlocklist = (path) =>
  new Set(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean)
  );

// A token excluded from endpoints and from every reconstructed shortest path.
const blocked = new Set([
  ...loadBlocklist('scripts/data/names-blocklist.txt'),
  ...loadBlocklist('scripts/data/prune-blocklist.txt'),
  ...loadBlocklist('scripts/data/safety-blocklist.txt'),
]);

// Deterministic PRNG (mulberry32) — [0,1) stream, reproducible across runs.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// In-place Fisher-Yates using a seeded RNG.
function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
    adj.set(word, [...new Set(nb)]);
  }
  return adj;
}

// BFS from `start`, capped at `maxDepth`, returning distance + parent maps.
function bfsFrom(start, adj, maxDepth) {
  const dist = new Map([[start, 0]]);
  const parent = new Map();
  let frontier = [start];
  let depth = 0;
  while (frontier.length && depth < maxDepth) {
    const next = [];
    for (const w of frontier) {
      for (const n of adj.get(w) || []) {
        if (!dist.has(n)) {
          dist.set(n, depth + 1);
          parent.set(n, w);
          next.push(n);
        }
      }
    }
    frontier = next;
    depth++;
  }
  return { dist, parent };
}

function shortestPath(start, end, parent) {
  const path = [end];
  let cur = end;
  while (cur !== start) {
    const p = parent.get(cur);
    if (p === undefined) return null;
    path.push(p);
    cur = p;
  }
  return path.reverse();
}

function generatePairs(length, targetCount, minSteps, maxSteps, rng) {
  const dict = [...new Set((wordsData[String(length)] || []).map((w) => w.toLowerCase()))];
  if (dict.length === 0) {
    console.log(`  No words of length ${length}, skipping.`);
    return [];
  }
  const adj = buildAdjacency(dict);
  const edgeCount = ([...adj.values()].reduce((s, n) => s + n.length, 0) / 2) | 0;
  console.log(`  ${dict.length} words, ${edgeCount} edges — generating pairs...`);

  const cleanStarts = dict.filter((w) => !blocked.has(w));
  const shuffled = shuffle(cleanStarts.slice(), rng);

  const used = new Set();
  const pairs = [];
  const searchDepth = maxSteps + 1;

  for (const start of shuffled) {
    if (pairs.length >= targetCount) break;
    const { dist, parent } = bfsFrom(start, adj, searchDepth);

    const candidates = [...dist.entries()]
      .filter(([w, d]) => w !== start && d >= minSteps && d <= maxSteps && !blocked.has(w))
      .sort(() => rng() - 0.5);

    for (const [end, d] of candidates) {
      const key = start < end ? `${start}|${end}` : `${end}|${start}`;
      if (used.has(key)) continue;
      const path = shortestPath(start, end, parent);
      // Endpoint + every shortest-path step must be a clean, unblocked token.
      if (!path || path.some((w) => blocked.has(w))) continue;
      used.add(key);
      pairs.push({ start_word: start, end_word: end, optimal_steps: d });
      break;
    }
  }
  return pairs;
}

const configs = LENGTHS.map((length) => ({
  length,
  target: TARGET_PER_LENGTH,
  min: PAIR_MIN_STEPS[length],
  max: PAIR_MAX_STEPS[length],
}));

let ok = true;
for (const { length, target, min, max } of configs) {
  console.log(`\nGenerating ${length}-letter pairs (target: ${target}, steps ${min}-${max})...`);
  const rng = mulberry32(SEED + length);
  const pairs = generatePairs(length, target, min, max, rng);
  console.log(`  Generated ${pairs.length} pairs`);
  if (pairs.length === 0) ok = false;
  writeFileSync(`public/cbo-pairs-${length}.json`, JSON.stringify(pairs, null, 2) + '\n');
  console.log(`  Saved → public/cbo-pairs-${length}.json`);
}

if (!ok) {
  console.error('\nFAILED: at least one length produced zero pairs');
  process.exit(1);
}
console.log('\nDone. Run: node scripts/validate-cbo.mjs');
