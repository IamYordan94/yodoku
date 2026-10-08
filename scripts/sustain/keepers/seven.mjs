// scripts/sustain/keepers/seven.mjs
//
// 7 Letters (game 7) serves boards on a `days % boards.length` rotation, so N
// boards = a repeat every N days (target 180 = ~6 months). Boards are generated
// from the curated standard by scripts/generate-seven-boards.mjs, which is
// deterministic and supports --append / --count / --seed-base.
//
// Usage: node scripts/sustain/keepers/seven.mjs [--apply] [--target=180]

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { p, readJson, log, arg } from '../lib.mjs';

export const game = '7 Letters';
const FILE = () => p('public', 'data', 'seven-boards.json');
const MIN_WORDS = 25;

export function topUp({ dryRun = true, target = Number(arg('target', 180)) } = {}) {
  const data = readJson(FILE());
  const boards = data.boards ?? [];
  const before = boards.length;
  if (before >= target) {
    return { ok: true, added: 0, note: `${before} boards (target ${target}) — runway ${before} days, nothing to do` };
  }
  if (dryRun) {
    return { ok: true, added: 0, note: `would grow ${before} → ${target} boards (runway ${before} → ${target} days)` };
  }

  const file = FILE();
  const backup = fs.readFileSync(file, 'utf8');
  const res = spawnSync(process.execPath,
    [p('scripts', 'generate-seven-boards.mjs'), '--append', `--count=${target}`],
    { cwd: p(), encoding: 'utf8', timeout: 600000 });
  if (res.status !== 0) {
    fs.writeFileSync(file, backup, 'utf8');
    return { ok: false, added: 0, note: `generator failed (exit ${res.status}): ${(res.stderr || res.stdout || '').trim().slice(-300)}` };
  }

  const after = readJson(file).boards ?? [];
  const keys = new Set();
  const dupes = [];
  const thin = [];
  for (const b of after) {
    const key = `${[...b.letters].sort().join('')}|${b.center}`;
    if (keys.has(key)) dupes.push(key);
    keys.add(key);
    if ((b.words?.length ?? 0) < MIN_WORDS) thin.push(key);
  }

  if (dupes.length) {
    fs.writeFileSync(file, backup, 'utf8');
    return { ok: false, added: 0, note: `generator produced ${dupes.length} duplicate board(s) — restored the file` };
  }

  const idsOk = after.every((b, i) => b.id === i);
  return {
    ok: thin.length === 0 && idsOk,
    added: after.length - before,
    note: `${before} → ${after.length} boards (runway ${after.length} days)`
      + (idsOk ? '' : ' BUT board ids are not sequential')
      + (thin.length ? ` BUT ${thin.length} board(s) have fewer than ${MIN_WORDS} words` : ''),
  };
}

if (process.argv[1]?.endsWith('seven.mjs')) {
  const dryRun = !arg('apply');
  const res = topUp({ dryRun });
  log(`${dryRun ? '[dry-run] ' : ''}seven: ${res.ok ? 'ok' : 'FAILED'} — ${res.note}`);
  if (!res.ok) process.exit(1);
}
