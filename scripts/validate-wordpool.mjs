// Validates Word Pool category data end to end.
//
//   node scripts/validate-wordpool.mjs
//
// Fails (exit 1) if any of these do not hold for public/data/wordpool-categories.json:
//   - top-level shape is { categories: [...] } with exactly 45 categories
//   - every category has an id, a name and exactly 6 levels (level numbers 1..6)
//   - every level has a name and a words array
//   - every word is a single lowercase alphabetic token, 3-8 characters, [a-z] only
//   - every word is in the curated list (scripts/data/english-common.txt)
//   - no word is in names-blocklist / prune-blocklist / safety-blocklist
//   - every level has >= 4 words and no more than the per-level cap
//   - no duplicate word within a level
import { readFileSync } from 'node:fs';

const CAP = { 1: 12, 2: 12, 3: 10, 4: 8, 5: 7, 6: 6 };
const CATEGORY_COUNT = 45;
const TOKEN = /^[a-z]{3,8}$/;

const readSet = (path) =>
  new Set(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean)
  );

const common = readSet('scripts/data/english-common.txt');
const names = readSet('scripts/data/names-blocklist.txt');
const prune = readSet('scripts/data/prune-blocklist.txt');
// safety-blocklist.txt is a single space-separated line
const safety = new Set(
  readFileSync('scripts/data/safety-blocklist.txt', 'utf8')
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
);

const fail = (msg) => { throw new Error(msg); };

const data = JSON.parse(readFileSync('public/data/wordpool-categories.json', 'utf8'));
if (!data || typeof data !== 'object' || !Array.isArray(data.categories)) {
  fail('wordpool-categories.json: expected { categories: [...] }');
}
const cats = data.categories;
if (cats.length !== CATEGORY_COUNT) {
  fail(`expected ${CATEGORY_COUNT} categories, found ${cats.length}`);
}

let levelCount = 0;
let wordCount = 0;
for (const cat of cats) {
  if (typeof cat.id !== 'string' || !cat.id) fail('category missing string id');
  if (typeof cat.name !== 'string' || !cat.name) fail(`category ${cat.id} missing string name`);
  if (!Array.isArray(cat.levels) || cat.levels.length !== 6) {
    fail(`category ${cat.id}: expected 6 levels, found ${cat.levels?.length}`);
  }
  const levelNumbers = new Set();
  for (const level of cat.levels) {
    const where = `${cat.id} L${level.level}`;
    if (!Number.isInteger(level.level) || level.level < 1 || level.level > 6) {
      fail(`${where}: level number must be an integer 1..6`);
    }
    if (levelNumbers.has(level.level)) fail(`${where}: duplicate level number`);
    levelNumbers.add(level.level);
    if (typeof level.name !== 'string' || !level.name) fail(`${where}: missing level name`);
    if (!Array.isArray(level.words)) fail(`${where}: words must be an array`);

    const cap = CAP[level.level];
    if (level.words.length < 4) fail(`${where}: has ${level.words.length} words (minimum 4)`);
    if (level.words.length > cap) fail(`${where}: has ${level.words.length} words (cap ${cap})`);

    const seen = new Set();
    for (const word of level.words) {
      if (typeof word !== 'string') fail(`${where}: non-string word ${JSON.stringify(word)}`);
      if (!TOKEN.test(word)) fail(`${where}: "${word}" is not a single lowercase [a-z] token of length 3-8`);
      if (!common.has(word)) fail(`${where}: "${word}" is not in english-common.txt`);
      if (names.has(word)) fail(`${where}: "${word}" is in names-blocklist`);
      if (prune.has(word)) fail(`${where}: "${word}" is in prune-blocklist`);
      if (safety.has(word)) fail(`${where}: "${word}" is in safety-blocklist`);
      if (seen.has(word)) fail(`${where}: duplicate word "${word}"`);
      seen.add(word);
    }
    wordCount += level.words.length;
    levelCount++;
  }
}

console.log(`categories: ${cats.length} x 6 levels = ${levelCount} levels`);
console.log(`words: ${wordCount} (all typeable, in-bar, non-blocked, within caps)`);
console.log('\nALL CHECKS PASSED');
