// Generates word-ladder pairs for Change by One from the curated dictionary.
//
//   node scripts/gen-cbo-pairs.mjs
//
// Every pair is guaranteed solvable inside public/words-cbo.json: the shortest
// path is computed by BFS over the dictionary itself. Start/end words are drawn
// only from curated tokens that are NOT common given/surnames
// (scripts/data/names-blocklist.txt), and the reconstructed shortest path is
// rejected if any intermediate step is a name — so puzzle words stay words a
// player recognises. Names remain valid for MANUAL play because the game's
// dictionary file still contains them.
import { readFileSync, writeFileSync } from 'node:fs';

const wordsData = JSON.parse(readFileSync('public/words-cbo.json', 'utf8'));
const nameBlocklist = new Set(
  readFileSync('scripts/data/names-blocklist.txt', 'utf8')
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
);

const MAX_MOVES = { 4: 10, 5: 12, 6: 12, 7: 14 };

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

function generatePairs(length, targetCount, minSteps, maxSteps) {
  const dict = [...new Set((wordsData[String(length)] || []).map((w) => w.toLowerCase()))];
  if (dict.length === 0) {
    console.log(`  No words of length ${length}, skipping.`);
    return [];
  }
  const adj = buildAdjacency(dict);
  const edgeCount = [...adj.values()].reduce((s, n) => s + n.length, 0) / 2 | 0;
  console.log(`  ${dict.length} words, ${edgeCount} edges — generating pairs...`);

  const cleanStarts = dict.filter((w) => !nameBlocklist.has(w));
  const shuffled = cleanStarts.slice().sort(() => Math.random() - 0.5);

  const used = new Set();
  const pairs = [];
  const searchDepth = maxSteps + 1;

  for (const start of shuffled) {
    if (pairs.length >= targetCount) break;
    const { dist, parent } = bfsFrom(start, adj, searchDepth);

    const candidates = [...dist.entries()]
      .filter(([w, d]) => w !== start && d >= minSteps && d <= maxSteps && !nameBlocklist.has(w))
      .sort(() => Math.random() - 0.5);

    for (const [end, d] of candidates) {
      const key = start < end ? `${start}|${end}` : `${end}|${start}`;
      if (used.has(key)) continue;
      const path = shortestPath(start, end, parent);
      if (!path || path.some((w) => nameBlocklist.has(w))) continue;
      used.add(key);
      pairs.push({ start_word: start, end_word: end, optimal_steps: d });
      break;
    }
  }
  return pairs;
}

const configs = [
  { length: 4, target: 400, min: 3, max: MAX_MOVES[4] },
  { length: 5, target: 400, min: 4, max: MAX_MOVES[5] },
  { length: 6, target: 400, min: 5, max: MAX_MOVES[6] },
  { length: 7, target: 400, min: 5, max: MAX_MOVES[7] },
];

let ok = true;
for (const { length, target, min, max } of configs) {
  console.log(`\nGenerating ${length}-letter pairs (target: ${target})...`);
  const pairs = generatePairs(length, target, min, max);
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
