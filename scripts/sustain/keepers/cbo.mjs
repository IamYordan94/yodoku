// scripts/sustain/keepers/cbo.mjs
//
// Change by One (game 2) does not ship a puzzle list at all: cbo-dailyChallenge.ts
// derives the day's start/end word pairs from the hub dictionary at runtime, with
// a date seed. There is nothing to top up — so this keeper's job is the opposite:
// prove the dictionary it generates from is deep enough per word length, and
// fail loudly if it ever thins out or is missing (that is the only way this game
// can run out of content).
//
// It also checks the legacy generator's input, public/words-cbo.json, which the
// current pipeline no longer uses — reporting it rather than silently ignoring it.
//
// Usage: node scripts/sustain/keepers/cbo.mjs

import fs from 'node:fs';
import { p, readJson, log, arg, table } from '../lib.mjs';

export const game = 'Change by One';
// Lengths the game can build a ladder from; below the bar a day's puzzle may not
// be constructible.
const MIN_PER_LENGTH = 300;
const LENGTHS = [3, 4, 5, 6, 7, 8];

export function check() {
  const file = p('scripts', 'data', 'words.json');
  if (!fs.existsSync(file)) {
    return { ok: false, rows: [], note: 'scripts/data/words.json is missing — Change by One cannot generate a puzzle' };
  }
  const words = readJson(file);
  const rows = [];
  let worst = null;
  for (const len of LENGTHS) {
    const bucket = words[String(len)];
    const n = Array.isArray(bucket) ? bucket.length : 0;
    rows.push({ length: len, words: n, status: n >= MIN_PER_LENGTH ? 'OK' : 'THIN' });
    if (!worst || n < worst.n) worst = { len, n };
  }
  const legacy = fs.existsSync(p('public', 'words-cbo.json'));
  return {
    ok: rows.every((r) => r.status === 'OK'),
    rows,
    note: `thinnest length ${worst.len} = ${worst.n} words (bar ${MIN_PER_LENGTH}); `
      + `legacy public/words-cbo.json ${legacy ? 'present' : 'absent (unused by the live generator)'}`,
  };
}

if (process.argv[1]?.endsWith('cbo.mjs')) {
  const res = check();
  if (arg('json')) log(JSON.stringify(res, null, 2));
  else {
    log(table(res.rows));
    log(`${res.ok ? 'OK' : 'FAILED'} — ${res.note}`);
  }
  if (!res.ok) process.exit(1);
}
