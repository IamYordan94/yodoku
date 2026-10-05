// Pure logic for Clear the String (LetterMix) — extracted so it can be unit
// tested without React. No DOM / no React imports here.

/** True when `word` can be spelled from the multiset of `availableLetters`. */
export function canFormFromLetters(availableLetters: string, word: string): boolean {
  const counts: Record<string, number> = {};
  for (const ch of availableLetters) counts[ch] = (counts[ch] || 0) + 1;
  for (const ch of word) {
    if (!counts[ch]) return false;
    counts[ch]--;
  }
  return true;
}

/**
 * A guess is accepted when it is a real English word OR a common English word OR
 * one of the puzzle's own solution words. Solutions are always accepted so a
 * published puzzle can never reject its own answer.
 */
export function isAcceptedGuess(
  word: string,
  opts: {
    isValidDictionaryWord: (w: string) => boolean;
    isCommonWord: (w: string) => boolean;
    solutionWords: string[];
  }
): boolean {
  const w = word.toLowerCase();
  if (opts.solutionWords.includes(w)) return true;
  return opts.isValidDictionaryWord(w) || opts.isCommonWord(w);
}

/**
 * True while at least one word can still be formed from the remaining letters
 * that has NOT already been found — either a remaining solution word or any
 * other valid dictionary word. This is what the "Stuck!" screen must test:
 * claiming "can't form any more words" is only honest when this is false.
 */
export function hasFormableWord(
  availableLetters: string,
  foundWords: string[],
  solutionWords: string[],
  getWordsByLength: (len: number) => string[]
): boolean {
  if (availableLetters.length < 2) return false;
  const avail = new Int16Array(26);
  for (const ch of availableLetters) {
    const c = ch.charCodeAt(0) - 97;
    if (c >= 0 && c < 26) avail[c]++;
  }
  const found = new Set(foundWords);
  const fits = (word: string): boolean => {
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
