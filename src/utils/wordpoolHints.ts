// wordpoolHints.ts — pure progressive-hint logic for Word Pool.
//
// Each Hint reveals one more letter POSITION of a still-missing word. The old
// first stage only restated the word's length, which the player can already
// see. Positions are revealed middle-outward so partial patterns stay useful.
// No React, no storage — safe to unit-test from node.

export interface WordPoolHint {
  word: string;
  stage: number; // 1-based: number of letter positions revealed
}

/** Indices of `word` in the order they get revealed: middle, then outward. */
export function hintRevealOrder(len: number): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  const mid = Math.floor(len / 2);
  const push = (i: number) => {
    if (i >= 0 && i < len && !seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };
  push(mid);
  for (let d = 1; d <= len; d++) {
    push(mid - d);
    push(mid + d);
  }
  return order;
}

/** A masked pattern like "· R · · ·" plus how many positions are shown. */
export function maskedHint(word: string, stage: number): { masked: string; revealedCount: number } {
  const reveal = new Set(hintRevealOrder(word.length).slice(0, Math.max(1, stage)));
  const masked = word
    .split('')
    .map((ch, i) => (reveal.has(i) ? ch.toUpperCase() : '·'))
    .join(' ');
  return { masked, revealedCount: reveal.size };
}

/** The hint line for the UI — never just the (already visible) word length. */
export function wordpoolHintText(hint: WordPoolHint | null): string | null {
  if (!hint) return null;
  const { masked, revealedCount } = maskedHint(hint.word, hint.stage);
  if (revealedCount >= hint.word.length) return `The word is "${hint.word.toUpperCase()}".`;
  return `Try a ${hint.word.length}-letter word: ${masked}`;
}
