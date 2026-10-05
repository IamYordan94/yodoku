// Game logic for Change by One

/**
 * BFS shortest path from start to end using the given dictionary.
 * Returns the full path (including start and end) or [] if unreachable.
 * Uses letter-substitution buckets for O(n·L·26) adjacency — fast even
 * for 10k+ word dictionaries.
 */
export function calculateOptimalPath(
  start: string,
  end: string,
  dictionary: string[],
  maxDepth = 20
): string[] {
  const s = start.toLowerCase();
  const e = end.toLowerCase();
  if (s === e) return [s];

  // Build adjacency via substitution buckets
  const wordSet = new Set(dictionary);
  const adj = new Map<string, string[]>();
  for (const word of dictionary) {
    const neighbors: string[] = [];
    for (let i = 0; i < word.length; i++) {
      for (let code = 97; code <= 122; code++) {
        const ch = String.fromCharCode(code);
        if (ch === word[i]) continue;
        const candidate = word.slice(0, i) + ch + word.slice(i + 1);
        if (wordSet.has(candidate)) neighbors.push(candidate);
      }
    }
    adj.set(word, neighbors);
  }

  // BFS
  const queue: [string, string[]][] = [[s, [s]]];
  const visited = new Set([s]);
  while (queue.length > 0) {
    const [word, path] = queue.shift()!;
    if (path.length > maxDepth) continue;
    for (const next of (adj.get(word) ?? [])) {
      if (!visited.has(next)) {
        const newPath = [...path, next];
        if (next === e) return newPath;
        visited.add(next);
        queue.push([next, newPath]);
      }
    }
  }
  return [];
}

export function hasOneLetterDifference(word1: string, word2: string): boolean {
  if (word1.length !== word2.length) return false;
  let diffs = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) {
      diffs++;
      if (diffs > 1) return false;
    }
  }
  return diffs === 1;
}

export function validateCboWord(
  word: string,
  previousWord: string,
  isValidWord: (w: string) => boolean,
  usedWords: string[] = []
): { isValid: boolean; error?: string } {
  const w = word.toLowerCase();

  if (!isValidWord(w)) {
    return { isValid: false, error: 'Not a word you can use here — try another.' };
  }
  if (w.length !== previousWord.length) {
    return { isValid: false, error: 'Word must be the same length.' };
  }
  if (!hasOneLetterDifference(previousWord, w)) {
    return { isValid: false, error: 'Must change exactly one letter.' };
  }
  if (usedWords.includes(w)) {
    return { isValid: false, error: 'Word already used in this chain.' };
  }
  return { isValid: true };
}

/** Returns any valid one-letter-change neighbor, excluding used words. */
export function getAnyValidNeighbor(
  currentWord: string,
  allWords: string[],
  usedWords: string[] = []
): string | null {
  const usedSet = new Set(usedWords.map((w) => w.toLowerCase()));
  for (const w of allWords) {
    if (w === currentWord) continue;
    if (usedSet.has(w)) continue;
    if (hasOneLetterDifference(currentWord, w)) return w;
  }
  return null;
}

/** Returns the index of a letter that differs from the target, for a "try changing letter N" hint. */
export function getDifferingLetterIndex(currentWord: string, targetWord: string): number | null {
  if (currentWord.length !== targetWord.length) return null;
  for (let i = 0; i < currentWord.length; i++) {
    if (currentWord[i] !== targetWord[i]) return i;
  }
  return null;
}

