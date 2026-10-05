// 7 Letters tier ladder tests. Standalone (mirrors sevenLettersLogic.ts) like
// scripts/test-quiz-logic.mjs. Prints ALL CHECKS PASSED on success.
const TIER_LADDER = [
  { key: 'good', label: 'Good', pct: 0.15 },
  { key: 'solid', label: 'Solid', pct: 0.3 },
  { key: 'great', label: 'Great', pct: 0.45 },
  { key: 'amazing', label: 'Amazing', pct: 0.6 },
  { key: 'genius', label: 'Genius', pct: 0.8 },
  { key: 'queen', label: 'Queen Bee', pct: 1 },
];
function tierCutoffs(maxScore) {
  const at = (p) => Math.ceil(maxScore * p);
  return { good: at(0.15), solid: at(0.3), great: at(0.45), amazing: at(0.6), genius: at(0.8), queen: at(1) };
}
function tierFor(score, cutoffs) {
  let tier = 'Beginner';
  for (const t of TIER_LADDER) if (score >= cutoffs[t.key]) tier = t.label;
  return tier;
}
function nextTier(score, cutoffs) {
  for (const t of TIER_LADDER) if (score < cutoffs[t.key]) return { label: t.label, pointsAway: cutoffs[t.key] - score };
  return null;
}
function wordsToNextTier(score, board) {
  const next = nextTier(score, tierCutoffs(board.maxScore));
  if (!next) return null;
  const avg = board.words.length > 0 ? board.maxScore / board.words.length : 3;
  const words = Math.max(1, Math.ceil(next.pointsAway / Math.max(avg, 1)));
  return { label: next.label, points: next.pointsAway, words };
}

const assert = (cond, msg) => { if (!cond) throw new Error('FAIL: ' + msg); };

// cutoffs
const c = tierCutoffs(100);
assert(JSON.stringify(c) === JSON.stringify({ good: 15, solid: 30, great: 45, amazing: 60, genius: 80, queen: 100 }),
  'tierCutoffs(100) mismatch: ' + JSON.stringify(c));
console.log('tierCutoffs(100):', JSON.stringify(c));

// strictly increasing + queen == max
let prev = -1;
for (const t of TIER_LADDER) {
  assert(c[t.key] > prev, `cutoff ${t.key} not increasing`);
  prev = c[t.key];
}
assert(c.queen === 100, 'queen cutoff must equal maxScore');

// tier boundaries
assert(tierFor(0, c) === 'Beginner', 'score 0 should be Beginner');
assert(tierFor(14, c) === 'Beginner', 'score 14 should still be Beginner');
assert(tierFor(15, c) === 'Good', 'score 15 should be Good');
assert(tierFor(30, c) === 'Solid', 'score 30 should be Solid');
assert(tierFor(44, c) === 'Solid', 'score 44 should be Solid');
assert(tierFor(45, c) === 'Great', 'score 45 should be Great');
assert(tierFor(60, c) === 'Amazing', 'score 60 should be Amazing');
assert(tierFor(80, c) === 'Genius', 'score 80 should be Genius');
assert(tierFor(99, c) === 'Genius', 'score 99 should be Genius');
assert(tierFor(100, c) === 'Queen Bee', 'score 100 should be Queen Bee');
console.log('tierFor boundaries: ok (7 tiers)');

// nextTier
assert(nextTier(0, c).label === 'Good' && nextTier(0, c).pointsAway === 15, 'nextTier(0) wrong');
assert(nextTier(100, c) === null, 'nextTier(max) must be null');

// wordsToNextTier
const board = { maxScore: 147, words: new Array(44).fill('x') };
const w = wordsToNextTier(0, board);
assert(w.label === 'Good', 'wordsToNextTier label wrong');
assert(w.points === Math.ceil(147 * 0.15), 'wordsToNextTier points wrong');
assert(w.words >= 1, 'wordsToNextTier should suggest >=1 word');
const full = wordsToNextTier(147, board);
assert(full === null, 'wordsToNextTier at max must be null');
console.log(`wordsToNextTier(0): ${w.words} words / ${w.points} pts to ${w.label}`);

// real board sanity from data
import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('public/data/seven-boards.json', 'utf8'));
assert(Array.isArray(data.boards) && data.boards.length > 0, 'no seven boards');
for (const b of data.boards.slice(0, 25)) {
  const cuts = tierCutoffs(b.maxScore);
  assert(cuts.queen === b.maxScore, `queen cutoff != maxScore for board ${b.id}`);
  assert(tierFor(b.maxScore, cuts) === 'Queen Bee', `max score should be Queen Bee for board ${b.id}`);
  assert(tierFor(0, cuts) === 'Beginner', `0 should be Beginner for board ${b.id}`);
}
console.log(`checked ${Math.min(25, data.boards.length)} real boards: Queen Bee at 100%, Beginner at 0`);

console.log('\nALL CHECKS PASSED');
