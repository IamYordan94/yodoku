// Standalone sanity test for Clear the String (LetterMix) word logic.
//
//   node scripts/test-lettermix-logic.mjs
//
// Replicates src/utils/lettermixLogic.ts (pure copy so the test stands alone,
// same pattern as scripts/test-quiz-logic.mjs) and exercises it against the real
// puzzle + dictionary data.
import { readFileSync } from 'node:fs';

// --- pure copy of src/utils/lettermixLogic.ts ---
function canFormFromLetters(availableLetters, word) {
  const counts = {};
  for (const ch of availableLetters) counts[ch] = (counts[ch] || 0) + 1;
  for (const ch of word) {
    if (!counts[ch]) return false;
    counts[ch]--;
  }
  return true;
}
function isAcceptedGuess(word, { isValidDictionaryWord, isCommonWord, solutionWords }) {
  const w = word.toLowerCase();
  if (solutionWords.includes(w)) return true;
  return isValidDictionaryWord(w) || isCommonWord(w);
}
function hasFormableWord(availableLetters, foundWords, solutionWords, getWordsByLength) {
  if (availableLetters.length < 2) return false;
  const avail = new Int16Array(26);
  for (const ch of availableLetters) {
    const c = ch.charCodeAt(0) - 97;
    if (c >= 0 && c < 26) avail[c]++;
  }
  const found = new Set(foundWords);
  const fits = (word) => {
    const need = new Int16Array(26);
    for (let i = 0; i < word.length; i++) {
      const c = word.charCodeAt(i) - 97;
      if (c < 0 || c > 25) return false;
      if (++need[c] > avail[c]) return false;
    }
    return true;
  };
  for (const w of solutionWords) if (!found.has(w) && fits(w)) return true;
  const maxLen = availableLetters.length;
  for (let len = 2; len <= maxLen; len++) {
    const words = getWordsByLength(len);
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (!found.has(w) && fits(w)) return true;
    }
  }
  return false;
}

// --- real data ---
const puzzles = JSON.parse(readFileSync('public/data/lettermix-puzzles.json', 'utf8'));
const wordsJson = JSON.parse(readFileSync('public/data/words.json', 'utf8'));
const common = JSON.parse(readFileSync('public/words-cbo.json', 'utf8'));

const dictionary = new Set();
for (const key of Object.keys(wordsJson)) {
  for (const entry of wordsJson[key]) {
    const w = entry.word && entry.word.toLowerCase();
    if (w) dictionary.add(w);
  }
}
const commonSet = new Set();
const commonByLen = {};
for (const key of Object.keys(common)) {
  const len = Number(key);
  const arr = [];
  for (const w of common[key]) {
    const lw = w.toLowerCase();
    commonSet.add(lw);
    arr.push(lw);
  }
  commonByLen[len] = arr;
}
const wordsByLen = {};
for (const key of Object.keys(wordsJson)) {
  wordsByLen[key] = wordsJson[key].map((e) => e.word.toLowerCase());
}
const getWordsByLength = (len) => [...(wordsByLen[String(len)] || []), ...(commonByLen[len] || [])];

console.log(`dictionary words.json: ${dictionary.size}, curated common: ${commonSet.size}`);

// --- 1. acceptance: common words that were previously rejected now pass ---
if (!commonSet.has('hands')) throw new Error('curated list must contain "hands" (was rejected before)');
if (!commonSet.has('flood')) throw new Error('curated list must contain "flood"');
// the Change by One junk words must be gone from the curated dictionary
for (const w of ['wran', 'aani', 'aaru', 'adad']) {
  if (commonSet.has(w)) throw new Error(`curated list must not contain junk word "${w}"`);
}
console.log('curated list: hands/flood present, wran/aani/aaru/adad removed ✓');

// HANDS is NOT in words.json at all — acceptance must therefore come from the
// curated list, which is exactly the union the page now performs.
if (dictionary.has('hands')) throw new Error('premise changed: words.json now contains hands');
console.log('words.json missing "hands" — accepted via curated list only ✓');

const accept = (w, solutions = [], dict = dictionary) =>
  isAcceptedGuess(w, {
    isValidDictionaryWord: (x) => dict.has(x),
    isCommonWord: (x) => commonSet.has(x),
    solutionWords: solutions,
  });

if (!accept('hands')) throw new Error('HANDS must be accepted');
if (!accept('flood')) throw new Error('FLOOD must be accepted');
if (accept('zzqx')) throw new Error('total garbage ZZQX must be rejected');
// Even if words.json failed to load, the curated list alone must accept common
// words (the actual failure mode players hit).
if (!accept('hands', [], new Set())) throw new Error('HANDS must still be accepted without words.json');
if (accept('wran', [], new Set())) throw new Error('WRAN must be rejected without words.json');
// puzzle solutions are always accepted, even if absent from every dictionary
if (!accept('zzzzsol', ['zzzzsol'])) throw new Error('puzzle solution must always be accepted');
console.log('acceptance: HANDS/FLOOD accepted, garbage rejected, solutions always accepted ✓');

// --- 2. stuck detection is honest and counter-consistent ---
const stuck = (letters, found, solutions) => !hasFormableWord(letters, found, solutions, getWordsByLength);

const p = puzzles.find((q) => q.level === 'easy') || puzzles[0];
const letters = p.scrambledLetters.split('');
if (stuck(letters.join(''), [], p.solutionWords)) {
  throw new Error('a fresh puzzle must never be "stuck"');
}
console.log(`fresh puzzle ${p.date}/${p.level}: not stuck ✓`);

// Regression: after finding the first solution word the pool still has letters
// and plenty of formable words, so the stuck screen must NOT fire.
const firstSolution = p.solutionWords.find((w) => canFormFromLetters(letters.join(''), w));
if (!firstSolution) throw new Error('puzzle data invalid: no solution formable');
const remaining = letters.join('');
const consumed = firstSolution; // simulate the letters the found word would remove
const poolAfter = (() => {
  const counts = {};
  for (const ch of remaining) counts[ch] = (counts[ch] || 0) + 1;
  for (const ch of consumed) counts[ch]--;
  return Object.entries(counts).flatMap(([ch, n]) => Array(n).fill(ch)).join('');
})();
if (stuck(poolAfter, [firstSolution], p.solutionWords)) {
  throw new Error(`falsely stuck after finding "${firstSolution}" (the reported bug)`);
}
console.log(`after finding "${firstSolution}": not stuck ✓ (counter bug regression guard)`);

// With a single leftover letter there is nothing to form.
if (!stuck('a', [], p.solutionWords)) throw new Error('a single letter must be stuck');
console.log('one leftover letter: stuck ✓');

// --- 3. "canFormFromLetters" itself ---
if (!canFormFromLetters('hands', 'hands')) throw new Error('canFormFromLetters exact match failed');
if (canFormFromLetters('hand', 'hands')) throw new Error('canFormFromLetters must respect letter counts');
if (!canFormFromLetters('dhansx', 'hands')) throw new Error('canFormFromLetters should ignore extra letters');
console.log('canFormFromLetters ✓');

console.log('\nALL CHECKS PASSED');
