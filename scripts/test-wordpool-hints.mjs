// Word Pool progressive-hint tests. Standalone (mirrors src/utils/wordpoolHints.ts).
// Prints ALL CHECKS PASSED on success.
function hintRevealOrder(len) {
  const order = [];
  const seen = new Set();
  const mid = Math.floor(len / 2);
  const push = (i) => { if (i >= 0 && i < len && !seen.has(i)) { seen.add(i); order.push(i); } };
  push(mid);
  for (let d = 1; d <= len; d++) { push(mid - d); push(mid + d); }
  return order;
}
function maskedHint(word, stage) {
  const reveal = new Set(hintRevealOrder(word.length).slice(0, Math.max(1, stage)));
  const masked = word.split('').map((ch, i) => (reveal.has(i) ? ch.toUpperCase() : '·')).join(' ');
  return { masked, revealedCount: reveal.size };
}
function wordpoolHintText(hint) {
  if (!hint) return null;
  const { masked, revealedCount } = maskedHint(hint.word, hint.stage);
  if (revealedCount >= hint.word.length) return `The word is "${hint.word.toUpperCase()}".`;
  return `Try a ${hint.word.length}-letter word: ${masked}`;
}

const assert = (cond, msg) => { if (!cond) throw new Error('FAIL: ' + msg); };

// reveal order covers every index exactly once
for (const len of [3, 4, 5, 6, 7, 12]) {
  const order = hintRevealOrder(len);
  assert(order.length === len, `order length wrong for len ${len}`);
  assert(new Set(order).size === len, `order has duplicates for len ${len}`);
  assert([...order].sort((a, b) => a - b).join(',') === Array.from({ length: len }, (_, i) => i).join(','),
    `order not a permutation for len ${len}`);
}
console.log('reveal order is a permutation for lengths 3..12');

// stage 1 reveals exactly one position, in the middle
const m1 = maskedHint('crane', 1);
assert(m1.revealedCount === 1, 'stage 1 should reveal 1 position');
assert(m1.masked === '· · A · ·', 'stage 1 mask wrong: ' + m1.masked);
assert(maskedHint('crane', 2).revealedCount === 2, 'stage 2 should reveal 2');
assert(maskedHint('crane', 5).revealedCount === 5, 'stage 5 should reveal all 5');
console.log('masks:', [1, 2, 3, 4, 5].map((s) => maskedHint('crane', s).masked).join(' | '));

// text: never plain length-only; reveals a letter; caps at full word
const t1 = wordpoolHintText({ word: 'crane', stage: 1 });
assert(t1.includes('A'), 'hint text should reveal a letter: ' + t1);
assert(!/^Try a 5-letter word\.$/.test(t1), 'hint must not be length-only');
const tFull = wordpoolHintText({ word: 'cat', stage: 4 });
assert(tFull === 'The word is "CAT".', 'full reveal wrong: ' + tFull);
assert(wordpoolHintText(null) === null, 'null hint should be null');
console.log('hint text stage 1:', t1);

// every stage up to length reveals strictly more, never fewer letters
let last = 0;
for (let s = 1; s <= 7; s++) {
  const rc = maskedHint('testing', s).revealedCount;
  assert(rc >= last, 'reveal count must not decrease');
  last = rc;
}
assert(maskedHint('testing', 7).revealedCount === 7, 'stage == length should reveal all');

console.log('\nALL CHECKS PASSED');
