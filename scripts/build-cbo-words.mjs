// Builds public/words-cbo.json (Change by One dictionary + Clear the String
// fallback dictionary) from the curated common-English list.
//
//   node scripts/build-cbo-words.mjs
//
// Source: scripts/data/english-common.txt (see scripts/data/PROVENANCE.md).
// Output shape: { "3": ["ace", ...], "4": [...], ..., "8": [...] } — the same
// shape cbo-words.ts already consumes.
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'scripts/data/english-common.txt';
const OUT = 'public/words-cbo.json';
const MIN_LEN = 3;
const MAX_LEN = 8;

const words = readFileSync(SRC, 'utf8')
  .split(/\r?\n/)
  .map((w) => w.trim().toLowerCase())
  .filter((w) => /^[a-z]+$/.test(w) && w.length >= MIN_LEN && w.length <= MAX_LEN);

const byLen = {};
for (const w of words) (byLen[w.length] ||= []).push(w);

// dedupe + sort each bucket for a stable, diff-friendly file
const out = {};
let total = 0;
for (let len = MIN_LEN; len <= MAX_LEN; len++) {
  const bucket = [...new Set(byLen[len] || [])].sort();
  out[len] = bucket;
  total += bucket.length;
}

writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');

console.log(`Wrote ${OUT}`);
for (let len = MIN_LEN; len <= MAX_LEN; len++) {
  console.log(`  ${len}-letter: ${out[len].length}`);
}
console.log(`  total: ${total} unique words`);
