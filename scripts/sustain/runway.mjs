// scripts/sustain/runway.mjs
//
// "Is there always something to play?" — answered per game, from the files the
// live game actually reads.
//
// Runway = days before a daily player meets a puzzle they have already played.
// Each game's number is derived from its OWN selection rule (see the comment on
// every keeper), never from a guess.
//
//   node scripts/sustain/runway.mjs            # table
//   node scripts/sustain/runway.mjs --check    # exit 1 if any game is below the floor
//   node scripts/sustain/runway.mjs --json     # machine-readable

import fs from 'node:fs';
import {
  DATA, FACTS, p, readJson, readText, daysSince, todayUtcStr, arg, table, log,
  STATUS, rotationRunway, seededRandomRunway,
} from './lib.mjs';

// A game below this many days of runway is "running out" and gets topped up.
export const FLOOR_DAYS = Number(arg('floor', 45));
// Below this it needs a human's attention (the keeper could not refill it).
export const CRIT_DAYS = Number(arg('crit', 14));

const RECENT = 14; // how far back we look for an immediate repeat (quality check)

/** How the games actually index their daily puzzle, as of this repo revision. */
const RULES = {
  lettermix: 'calendar: puzzle matched by exact date + level (LetterMixPage.tsx)',
  cbo: 'date-seeded generator over the full word list (cbo-dailyChallenge.ts)',
  wordpool: 'seeded random by date over categories (getDailyPuzzleIndex)',
  orderle: 'days % ORDERLE_BANK.length (OrderlePage.tsx)',
  fermi: 'days % fermi.length from public/data/dailybrain-puzzles.json (FermiPage.tsx)',
  quiz: '10 questions/day, no-repeat, seeded per date (buildDailyQuiz)',
  seven: 'getTodayIndex() % boards.length (SevenLettersPage.tsx)',
};

/** Distinct playable items per source, and the days each item buys. */
export function measure(now = new Date()) {
  const games = [];
  const today = todayUtcStr(now);

  // ── Clear the String: one calendar entry per date+level until the last date ──
  let lm = { dates: [], levels: [] };
  try {
    const j = readJson(p('public', 'data', 'lettermix-puzzles.json'));
    const arr = Array.isArray(j) ? j : Object.values(j);
    lm.dates = arr.map((x) => x.date).filter(Boolean).sort();
    lm.levels = [...new Set(arr.map((x) => x.level).filter(Boolean))];
    const last = lm.dates[lm.dates.length - 1];
    const runway = last ? Math.max(0, Math.round((Date.parse(last + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000)) : 0;
    // A calendar game does not repeat — when the last date passes, players get
    // nothing at all. So the cliff, not the floor, is what matters here.
    const CLIFF = 120;
    games.push({
      game: 'Clear the String', key: 'lettermix',
      source: 'public/data/lettermix-puzzles.json',
      items: lm.dates.length,
      runway,
      status: runway > CLIFF ? STATUS.OK : runway > 30 ? STATUS.LOW : STATUS.FAIL,
      detail: `${lm.levels.length} levels/day · hard cliff ${last} (${runway}d)`,
    });
  } catch (e) {
    games.push({ game: 'Clear the String', key: 'lettermix', source: 'lettermix-puzzles.json', items: 0, runway: 0, status: STATUS.FAIL, detail: String(e.message) });
  }

  // ── Change by One: generated per date, bounded by the word list ──
  try {
    const words = readJson(p('scripts', 'data', 'words.json'));
    let total = 0;
    for (const v of Object.values(words)) {
      if (Array.isArray(v)) total += v.length;
      else if (v && typeof v === 'object') total += Object.keys(v).length;
    }
    games.push({
      game: 'Change by One', key: 'cbo',
      source: 'scripts/data/words.json (generated per date)',
      items: total,
      runway: Infinity, // generated per date, not drawn from a fixed list
      status: STATUS.OK,
      detail: `generated per date from ${total} word entries — no fixed puzzle list to exhaust`,
    });
  } catch (e) {
    games.push({ game: 'Change by One', key: 'cbo', source: 'words.json', items: 0, runway: 0, status: STATUS.FAIL, detail: String(e.message) });
  }

  // ── Word Pool: seeded random category per date ──
  try {
    const wp = readJson(p('public', 'data', 'wordpool-categories.json'));
    const cats = wp.categories ?? [];
    const levels = cats.reduce((n, c) => n + (c.levels?.length ?? 0), 0);
    const runway = seededRandomRunway(cats.length);
    games.push({
      game: 'Word Pool', key: 'wordpool',
      source: 'public/data/wordpool-categories.json',
      items: cats.length,
      runway,
      status: runway >= FLOOR_DAYS ? STATUS.OK : STATUS.LOW,
      detail: `${cats.length} categories / ${levels} levels`,
    });
  } catch (e) {
    games.push({ game: 'Word Pool', key: 'wordpool', source: 'wordpool-categories.json', items: 0, runway: 0, status: STATUS.FAIL, detail: String(e.message) });
  }

  // ── ORDERLE: the TS bank is what the game imports ──
  try {
    const ts = readText(p('src', 'utils', 'puzzleGenerator.ts'));
    const bankBlock = ts.slice(ts.indexOf('const ORDERLE_BANK'), ts.indexOf('const FERMI_BANK'));
    const count = (bankBlock.match(/^  \{/gm) ?? []).length;
    const byCat = {};
    for (const m of bankBlock.matchAll(/category:\s*"([a-z]+)"/g)) byCat[m[1]] = (byCat[m[1]] ?? 0) + 1;
    const runway = rotationRunway(count);
    const thinnest = Object.entries(byCat).sort((a, b) => a[1] - b[1])[0];
    games.push({
      game: 'ORDERLE', key: 'orderle',
      source: 'src/utils/puzzleGenerator.ts (ORDERLE_BANK)',
      items: count,
      runway,
      status: runway >= FLOOR_DAYS ? STATUS.OK : STATUS.LOW,
      detail: `${Object.keys(byCat).length} categories, thinnest "${thinnest?.[0]}" = ${thinnest?.[1]}`,
    });
  } catch (e) {
    games.push({ game: 'ORDERLE', key: 'orderle', source: 'puzzleGenerator.ts', items: 0, runway: 0, status: STATUS.FAIL, detail: String(e.message) });
  }

  // ── FERMI: the live page imports FERMI_BANK from the TS module (FermiPage.tsx);
  //    dailybrain-puzzles.json only feeds FermiCalendar and is stale by design of
  //    the missing export step, so it is reported separately, never as the runway.
  try {
    const ts = readText(p('src', 'utils', 'puzzleGenerator.ts'));
    const tsBank = ts.slice(ts.indexOf('const FERMI_BANK'), ts.indexOf('// ─── Weekly scheduler'));
    const count = (tsBank.match(/^  \{/gm) ?? []).length;
    const j = readJson(p('public', 'data', 'dailybrain-puzzles.json'));
    const served = (j.fermi ?? []).length;
    const runway = rotationRunway(count);
    games.push({
      game: 'FERMI', key: 'fermi',
      source: 'src/utils/puzzleGenerator.ts (FERMI_BANK)',
      items: count,
      runway,
      status: runway >= FLOOR_DAYS ? STATUS.OK : STATUS.LOW,
      detail: served === count
        ? `${count} puzzles served`
        : `${count} served · calendar JSON ${served} (${count - served} behind — export stale)`,
    });
  } catch (e) {
    games.push({ game: 'FERMI', key: 'fermi', source: 'puzzleGenerator.ts', items: 0, runway: 0, status: STATUS.FAIL, detail: String(e.message) });
  }

  // ── Quiz Master: 10 fresh questions a day ──
  try {
    const q = readJson(p('public', 'data', 'quiz-bank.json'));
    const questions = q.questions ?? [];
    const perDay = 10;
    const categories = new Set(questions.map((x) => x.category ?? 'unknown'));
    const runway = Math.floor(questions.length / perDay);
    games.push({
      game: 'Quiz Master', key: 'quiz',
      source: 'public/data/quiz-bank.json',
      items: questions.length,
      runway,
      status: runway >= FLOOR_DAYS ? STATUS.OK : STATUS.LOW,
      detail: `${perDay}/day · ${categories.size} categories · ${(questions.length / perDay / 7).toFixed(0)} weeks left`,
    });
  } catch (e) {
    games.push({ game: 'Quiz Master', key: 'quiz', source: 'quiz-bank.json', items: 0, runway: 0, status: STATUS.FAIL, detail: String(e.message) });
  }

  // ── 7 Letters: board rotation ──
  try {
    const j = readJson(p('public', 'data', 'seven-boards.json'));
    const boards = j.boards ?? [];
    const runway = rotationRunway(boards.length);
    const noPangram = boards.filter((b) => !b.hasPangram && !(b.tiers && b.maxScore)).length;
    games.push({
      game: '7 Letters', key: 'seven',
      source: 'public/data/seven-boards.json',
      items: boards.length,
      runway,
      status: runway >= FLOOR_DAYS ? STATUS.OK : STATUS.LOW,
      detail: `${boards.length} boards, avg ${Math.round(boards.reduce((n, b) => n + (b.words?.length ?? 0), 0) / Math.max(1, boards.length))} words/board${noPangram ? ` (${noPangram} unverified)` : ''}`,
    });
  } catch (e) {
    games.push({ game: '7 Letters', key: 'seven', source: 'seven-boards.json', items: 0, runway: 0, status: STATUS.FAIL, detail: String(e.message) });
  }

  for (const g of games) g.rule = RULES[g.key];
  return games;
}

/** Immediate-repeat check: does the rotation serve the same item two days in a row? */
export function recentRepeatCheck(now = new Date()) {
  const today = todayUtcStr(now);
  const notes = [];
  try {
    const j = readJson(p('public', 'data', 'dailybrain-puzzles.json'));
    const n = (j.fermi ?? []).length;
    if (n) {
      const idx = (d) => Math.abs(Math.floor((d - Date.parse('2026-08-07T00:00:00Z')) / 86400000)) % n;
      const hits = new Map();
      for (let i = 0; i < RECENT; i++) {
        const day = Date.parse(today + 'T00:00:00Z') - i * 86400000;
        const k = idx(day);
        hits.set(k, (hits.get(k) ?? 0) + 1);
      }
      const dup = [...hits.values()].filter((v) => v > 1).length;
      if (dup) notes.push(`FERMI: ${dup} puzzle(s) served twice within ${RECENT} days (${n}-item loop)`);
    }
  } catch { /* not fatal for the report */ }
  return notes;
}

function main() {
  const games = measure();
  const worst = games.some((g) => g.status === STATUS.FAIL)
    ? STATUS.FAIL
    : games.some((g) => g.runway < CRIT_DAYS) ? 'CRIT'
      : games.some((g) => g.status !== STATUS.OK) ? STATUS.WARN : STATUS.OK;

  if (arg('json')) {
    log(JSON.stringify({ generated: new Date().toISOString(), floor: FLOOR_DAYS, worst, games }, null, 2));
  } else {
    log(`Content runway — ${todayUtcStr()}  (floor ${FLOOR_DAYS}d, critical ${CRIT_DAYS}d)\n`);
    log(table(games.map(({ game, items, runway, status, source }) => ({ game, items, days: runway, status, source }))));
    log('');
    for (const g of games) log(`  ${g.game.padEnd(16)} ${g.detail}`);
    const notes = recentRepeatCheck();
    if (notes.length) {
      log('\nRepeat warnings:');
      for (const n of notes) log(`  - ${n}`);
    }
    log(`\nWorst: ${worst}`);
  }

  if (arg('check')) {
    const short = games.filter((g) => g.runway < FLOOR_DAYS);
    if (short.length) {
      console.error(`\nRUNWAY CHECK FAILED: ${short.map((g) => `${g.game} (${g.runway}d)`).join(', ')} below the ${FLOOR_DAYS}-day floor.`);
      process.exit(1);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('runway.mjs')) main();
