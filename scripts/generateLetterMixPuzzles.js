/**
 * Clear the String puzzle generator
 * Pick N random words, shuffle letters, player finds words by clicking letters in any order.
 * Win = find all N solution words. Stuck = can't form more words but letters remain.
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const LEVELS = ['easy', 'medium', 'hard'];

// Bands eased 2026-10-08 (vocabulary audit, docs/vocab-audit/01-clear-the-string.md):
// 5/7/9 words -> 4/5/6; the minLen 4 floor excludes the 3-letter abbreviation
// class ('jai', 'mus', 'abc'); hard was 76.5 taps = 61s of pure typing minimum.
export const CONFIG = {
  easy: { targetWords: 4, minLen: 4, maxLen: 5 },
  medium: { targetWords: 5, minLen: 5, maxLen: 6 },
  hard: { targetWords: 6, minLen: 6, maxLen: 7 },
};

// NOTE: the old module-level used-words set was removed 2026-10-08 - it made
// generation order-dependent (the same date produced different words depending
// on what had been generated before). Each generateOne call now owns a fresh set.

// No longer needed - we just shuffle, don't verify formability

export function seedRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    const t = h;
    h = Math.imul(h ^ (t >>> 15), 4294967296 + 1);
    h = Math.imul(h ^ (h << 13), 1 | 0);
    return ((h ^ (t >>> 16)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickWords(wordsByLen, config, rand, used = new Set()) {
  const words = [];
  const { targetWords, minLen, maxLen } = config;

  while (words.length < targetWords) {
    const len = minLen + Math.floor(rand() * (maxLen - minLen + 1));
    const bucket = wordsByLen[String(len)];
    if (!bucket || bucket.length === 0) return null;

    // Try to find an unused word. `used` is fresh per generateOne call, so the
    // result for a (date, level) never depends on generation history.
    let w = null;
    for (let attempts = 0; attempts < 100; attempts++) {
      const candidate = bucket[Math.floor(rand() * bucket.length)];
      if (!used.has(candidate)) {
        w = candidate;
        used.add(candidate);
        break;
      }
    }

    // Extremely unlikely with the curated pool sizes - fall back to a repeat
    // rather than failing the puzzle.
    if (!w) {
      w = bucket[Math.floor(rand() * bucket.length)];
      used.add(w);
    }

    words.push(w);
  }

  return words;
}

export function generateOne(dateStr, level, wordsByLen) {
  const config = CONFIG[level];
  const rand = seedRandom(dateStr + '-' + level);

  const used = new Set();
  const words = pickWords(wordsByLen, config, rand, used);
  if (!words || words.length === 0) return null;
  
  // Concatenate and shuffle - no need to verify formability
  const concatenated = words.join('');
  const shuffled = shuffle(concatenated.split(''), rand).join('');
  
  return { 
    date: dateStr, 
    level, 
    scrambledLetters: shuffled, 
    solutionWords: words // Renamed from 'words' for clarity
  };
}

/**
 * Curated common-English pool (public/words-cbo.json, built by
 * scripts/build-cbo-words.mjs from scripts/data/english-common.txt).
 *
 * The old 15 MB words.json dictionary is packed with non-words ("ignobly",
 * "hyalite", "zel", "vau") — drawing solutions from it produced puzzles nobody
 * could beat. Every solution word must be a word a player recognises, so the
 * pool is the curated list minus the given-name/surname blocklist.
 */
export function loadPools() {
  const wordsPath = join(__dirname, '..', 'public', 'words-cbo.json');
  const data = JSON.parse(readFileSync(wordsPath, 'utf-8'));
  const nameBlocklist = new Set(
    readFileSync(join(__dirname, 'data', 'names-blocklist.txt'), 'utf-8')
      .split(/\r?\n/)
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean)
  );

  const wordsByLen = {};
  for (const key of Object.keys(data)) {
    const n = parseInt(key, 10);
    if (n < 3 || n > 9) continue;
    const entries = data[key];
    if (!Array.isArray(entries)) continue;
    wordsByLen[key] = entries
      .map((w) => String(w).toLowerCase())
      .filter((w) => w.length === n && !nameBlocklist.has(w));
  }
  return wordsByLen;
}

function main() {
  const wordsByLen = loadPools();
  console.log('Loaded words by length:', Object.keys(wordsByLen).map((k) => `${k}:${wordsByLen[k].length}`).join(', '));

  // CLI:
  //   --from=YYYY-MM-DD  --to=YYYY-MM-DD   range to cover
  //   --append                              keep the published puzzles untouched and
  //                                         generate only the dates that are missing
  //
  // Append is the ONLY safe way to extend this file. Regenerating the whole range
  // looks deterministic but is not: word picks index into the CURRENT curated pool
  // (public/words-cbo.json), and that pool gets rebuilt (pruning, rebuilds), so a
  // full re-run can silently rewrite history. Published puzzles are treated as
  // immutable; quality rebalances go through scripts/rebalance-lettermix.mjs.
  const argv = process.argv.slice(2);
  const getArg = (n, dflt) => {
    const hit = argv.find((a) => a.startsWith(`--${n}=`));
    return hit ? hit.slice(n.length + 3) : dflt;
  };
  const APPEND = argv.includes('--append');
  const endDate = new Date(getArg('to', '2026-12-31'));

  const outPath = join(__dirname, '..', 'public', 'data', 'lettermix-puzzles.json');
  let publishedRaw = null;
  let published = [];
  const publishedKeys = new Set();
  if (APPEND) {
    try {
      publishedRaw = readFileSync(outPath, 'utf-8');
      published = JSON.parse(publishedRaw);
      for (const p of published) publishedKeys.add(`${p.date}|${p.level}`);
      console.log(`Append mode: keeping ${published.length} published puzzles as-is.`);
    } catch (e) {
      console.warn(`Append mode: could not read the existing file (${e.message}) — starting fresh.`);
      publishedRaw = null;
    }
  }

  // Where to start generating: after the last published date when appending.
  const publishedDates = published.map((p) => p.date).filter(Boolean).sort();
  const genFrom = APPEND && publishedDates.length
    ? new Date(new Date(publishedDates[publishedDates.length - 1] + 'T00:00:00Z').getTime() + 86400000)
    : new Date(getArg('from', '2025-01-01'));
  const days = Math.ceil((endDate - genFrom) / (24 * 60 * 60 * 1000)) + 1;
  console.log(`Generating ${days} day(s) from ${genFrom.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}.`);

  const puzzles = [];
  for (let d = 0; d < days; d++) {
    // Walk the range with pure UTC arithmetic. Using local setDate() instead lets
    // daylight-saving transitions repeat or skip a calendar day — the reason two
    // dates in the published file carry 6 entries instead of 3.
    const date = new Date(genFrom.getTime() + d * 86400000);
    const dateStr = date.toISOString().slice(0, 10);

    for (const level of LEVELS) {
      if (publishedKeys.has(`${dateStr}|${level}`)) continue;
      const puzzle = generateOne(dateStr, level, wordsByLen);
      if (puzzle) {
        puzzles.push(puzzle);
      } else {
        console.warn(`No puzzle for ${dateStr} ${level}`);
      }
    }
  }

  if (APPEND && publishedRaw) {
    // Splice the new entries in before the closing bracket so every published
    // entry keeps its exact original bytes.
    const closeIdx = publishedRaw.lastIndexOf(']');
    if (closeIdx === -1) throw new Error('existing puzzles file has no closing bracket');
    const head = publishedRaw.slice(0, closeIdx).replace(/\s*$/, '');
    const body = JSON.stringify(puzzles, null, 2).replace(/^\[/, '').replace(/\]\s*$/, '').replace(/\s*$/, '');
    const merged = puzzles.length ? `${head},\n${body}\n]\n` : publishedRaw;
    JSON.parse(merged); // refuse to write anything that is not valid JSON
    writeFileSync(outPath, merged);
    console.log(`Appended ${puzzles.length} puzzles → ${outPath} (${published.length} published entries untouched)`);
  } else {
    writeFileSync(outPath, JSON.stringify(puzzles, null, 2));
    console.log(`Generated ${puzzles.length} puzzles → ${outPath}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
