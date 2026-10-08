// Quick end-to-end sanity test for the daily quiz logic (not a test suite)
import { readFileSync } from 'node:fs';

const bank = JSON.parse(readFileSync('public/data/quiz-bank.json', 'utf8'));

// --- replicate quizLogic.ts (pure copy so the test stands alone) ---
function seedRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const RAMP = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3];
function buildDailyQuiz(bank, dateStr) {
  const rng = seedRandom('quizmaster:' + dateStr);
  const pools = { 1: [], 2: [], 3: [] };
  for (const q of bank.questions) if (pools[q.difficulty]) pools[q.difficulty].push(q);
  const picked = [];
  const usedCats = new Set();
  for (const diff of RAMP) {
    const pool = pools[diff];
    if (pool.length === 0) continue;
    const fresh = pool.filter((q) => !usedCats.has(q.category));
    const candidate = fresh.length > 0 ? fresh : pool;
    const idx = Math.floor(rng() * candidate.length);
    const q = candidate[idx];
    picked.push(q);
    usedCats.add(q.category);
    const poolIdx = pool.indexOf(q);
    if (poolIdx !== -1) pool.splice(poolIdx, 1); // never repeat within the day (matches quizLogic.ts)
  }
  return picked.map((q) => {
    const optRng = seedRandom('qm-opt:' + q.id + ':' + dateStr);
    const order = seededShuffle(q.options.map((_, i) => i), optRng);
    return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
  });
}

// --- checks ---
const cats = new Set(bank.questions.map((q) => q.category));
console.log('categories in bank:', [...cats].join(', '));
console.log('per-category counts:', cats.size, 'expected 11');
for (const c of cats) {
  const n = bank.questions.filter((q) => q.category === c).length;
  const d = [1, 2, 3].map((k) => bank.questions.filter((q) => q.category === c && q.difficulty === k).length).join('/');
  console.log(`  ${c}: ${n} questions (easy/med/hard ${d})`);
}

// difficulty balance across the whole bank
for (const d of [1, 2, 3]) {
  const n = bank.questions.filter((q) => q.difficulty === d).length;
  console.log(`difficulty ${d}: ${n}`);
}

// answer distribution sanity (should not all be the same index)
const answerSpread = [0, 0, 0, 0];
for (const q of bank.questions) answerSpread[q.answer]++;
console.log('answer index spread:', answerSpread.join('/'));

// build daily quizzes for 7 consecutive days — verify 10 questions, unique, correct answer index
for (let day = 0; day < 7; day++) {
  const d = new Date(Date.UTC(2026, 7, 23 + day));
  const dateStr = d.toISOString().slice(0, 10);
  const quiz = buildDailyQuiz(bank, dateStr);
  if (quiz.length !== 10) throw new Error(`${dateStr}: expected 10 questions, got ${quiz.length}`);
  const ids = new Set(quiz.map((q) => q.id));
  if (ids.size !== 10) throw new Error(`${dateStr}: duplicate questions in daily set`);
  for (const q of quiz) {
    if (q.answer < 0 || q.answer > 3) throw new Error(`${dateStr}: bad answer index ${q.answer}`);
    if (q.options.length !== 4) throw new Error(`${dateStr}: bad options for ${q.id}`);
  }
  const dayCats = new Set(quiz.map((q) => q.category));
  console.log(`${dateStr}: 10 questions, ${dayCats.size} distinct categories, answer ok`);
}

// full-year scan: no duplicated question may appear in any daily set (B4 regression guard)
let dupDays = 0;
for (let day = 0; day < 365; day++) {
  const d = new Date(Date.UTC(2026, 7, 23 + day));
  const dateStr = d.toISOString().slice(0, 10);
  const quiz = buildDailyQuiz(bank, dateStr);
  if (new Set(quiz.map((q) => q.id)).size !== 10) {
    dupDays++;
    console.log('DUPLICATE day found:', dateStr);
  }
}
if (dupDays > 0) throw new Error(dupDays + ' day(s) with a duplicated question in a 365-day scan');
console.log('365-day scan: 0 duplicate days ✓');

// CATEGORY_META (quiz UI) must stay in sync with the categories present in the bank
const logicSrc = readFileSync('src/utils/quizLogic.ts', 'utf8');
const metaMatch = logicSrc.match(/CATEGORY_META[^{]*\{([\s\S]*?)\n\};/);
if (!metaMatch) throw new Error('could not parse CATEGORY_META from src/utils/quizLogic.ts');
const metaKeys = [...metaMatch[1].matchAll(/([a-z]+):\s*\{/g)].map((m) => m[1]);
const bankKeys = [...cats].sort();
const missing = bankKeys.filter((c) => !metaKeys.includes(c));
const extra = metaKeys.filter((c) => !bankKeys.includes(c));
if (missing.length || extra.length) {
  throw new Error('CATEGORY_META / bank mismatch: missing=' + missing.join(',') + ' extra=' + extra.join(','));
}
console.log('CATEGORY_META sync: ' + metaKeys.length + ' categories match the bank ✓');

// deterministic: same date twice -> same quiz
const a = buildDailyQuiz(bank, '2026-08-24');
const b = buildDailyQuiz(bank, '2026-08-24');
if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('not deterministic');
console.log('deterministic: same date -> identical quiz ✓');

// sample print of today's quiz
const today = new Date().toISOString().slice(0, 10);
console.log('\nSample daily quiz for', today, ':');
for (const q of buildDailyQuiz(bank, today)) {
  console.log(` [${q.category}/${q.difficulty}] ${q.question}`);
  console.log(`   correct: ${q.options[q.answer]}`);
}

// ── explanations: schema + coverage for the next 30 scheduled days ──────────
const explained = bank.questions.filter((q) => q.explanation !== undefined);
for (const q of explained) {
  if (typeof q.explanation !== 'string' || !q.explanation.trim()) {
    throw new Error('bad explanation for ' + q.id);
  }
}
console.log(`explanations present: ${explained.length}/${bank.questions.length}`);
const missingExplanations = new Set();
let coveredNext30 = 0;
for (let day = 0; day < 30; day++) {
  const now = new Date();
  const dt = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + day);
  const dateStr = new Date(dt).toISOString().slice(0, 10);
  for (const q of buildDailyQuiz(bank, dateStr)) {
    const full = bank.questions.find((x) => x.id === q.id);
    if (full && full.explanation) coveredNext30++;
    else missingExplanations.add(q.id);
  }
}
if (missingExplanations.size > 0) {
  throw new Error('next-30-day questions missing explanations: ' + [...missingExplanations].join(', '));
}
// schema stays backward-compatible: explanation is optional, every other field unchanged
for (const q of bank.questions) {
  if (typeof q.id !== 'string' || typeof q.question !== 'string' || !Array.isArray(q.options) || q.options.length !== 4) {
    throw new Error('question shape broke for ' + q.id);
  }
}
console.log(`explanation coverage: all next-30-day scheduled questions explained (${coveredNext30} slots) ✓`);

console.log('\nALL CHECKS PASSED');
