// scripts/rebalance-lettermix.mjs
//
// One-time content fix (2026-10-08): every Clear the String puzzle from
// today onward had been generated from the old 15 MB words.json dictionary,
// whose entries include non-words ("ignobly", "aplasia", "hyalite", "zel",
// "vau"). Players were asked to find 9 words of 7-8 letters that a human can
// never think of — the hard tier was effectively unbeatable, and even easy
// tiers served junk ("bac", "leno", "gonad").
//
// This script regenerates ONLY the entries dated today or later, using the
// curated common-English pool (public/words-cbo.json minus the name
// blocklist) via the repo's own deterministic generator. Every entry dated
// before today is kept byte-identical — the game is a calendar and past days
// must never change under players who already played them.
//
//   node scripts/rebalance-lettermix.mjs           # dry run (prints samples)
//   node scripts/rebalance-lettermix.mjs --apply   # write the file
//
// The generation itself stays seeded per (date, level), so the new puzzles
// are deterministic and the sustain keeper's append mode keeps working.

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { generateOne, loadPools } from './generateLetterMixPuzzles.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, '..', 'public', 'data', 'lettermix-puzzles.json');
const FROM = (process.argv.find((a) => a.startsWith('--from='))?.slice(7))
  || new Date().toISOString().slice(0, 10);
const APPLY = process.argv.includes('--apply');

const BANDS = { easy: [5, 3, 5], medium: [7, 5, 7], hard: [9, 7, 8] };

const puzzles = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
const pools = loadPools();
const curated = new Set(Object.values(pools).flat());

let replaced = 0;
let kept = 0;
const out = [];

for (const p of puzzles) {
  if (p.date >= FROM) {
    const fresh = generateOne(p.date, p.level, pools);
    if (!fresh) throw new Error(`generator produced nothing for ${p.date} ${p.level}`);
    const [count, minLen, maxLen] = BANDS[p.level];
    if (fresh.solutionWords.length !== count) throw new Error(`word count ${p.date} ${p.level}`);
    if (new Set(fresh.solutionWords).size !== fresh.solutionWords.length) throw new Error(`duplicate word in ${p.date} ${p.level}`);
    for (const w of fresh.solutionWords) {
      if (!curated.has(w)) throw new Error(`not a curated word: ${w} (${p.date} ${p.level})`);
      if (w.length < minLen || w.length > maxLen) throw new Error(`length out of band: ${w}`);
    }
    out.push({ date: p.date, level: p.level, scrambledLetters: fresh.scrambledLetters, solutionWords: fresh.solutionWords });
    replaced += 1;
  } else {
    out.push(p);
    kept += 1;
  }
}

// Past entries must be a leading prefix and byte-identical after re-serialisation.
const pastSame = JSON.stringify(out.slice(0, kept)) === JSON.stringify(puzzles.slice(0, kept));
if (!pastSame) throw new Error('past entries would change — aborting');

const after = out.filter((p) => p.date >= FROM);
const stillJunk = after.flatMap((p) => p.solutionWords).filter((w) => !curated.has(w));
console.log(`rebalance: ${replaced} entries regenerated (>= ${FROM}), ${kept} kept, past identical: ${pastSame}`);
console.log(`post-check: ${stillJunk.length} non-curated solution words remain from ${FROM} onward`);

const samples = out.filter((p) => p.date === FROM).sort((a, b) => a.level.localeCompare(b.level));
for (const s of samples) console.log(`  ${s.date} ${s.level}: ${s.solutionWords.join(', ')}`);

if (APPLY) {
  fs.writeFileSync(FILE, JSON.stringify(out, null, 2) + '\n');
  console.log(`written: ${FILE}`);
} else {
  console.log('[dry-run] pass --apply to write the file');
}
