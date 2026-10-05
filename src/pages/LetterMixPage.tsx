import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWordDatabase } from '../hooks/useWordDatabase';
import ShareCardModal from '../components/ShareCardModal';
import { getTodayDateStr } from '../utils/dailySeed';
import {
  loadEnglishCommon,
  isCommonEnglishWord,
  getCommonEnglishWordsByLength,
} from '../utils/englishWords';
import { canFormFromLetters, isAcceptedGuess, hasFormableWord } from '../utils/lettermixLogic';
import {
  setLetterMixCompleted,
  getLetterMixCompletedFor,
  getHintTargetAsync,
  setHintTargetAsync,
  clearHintTargetAsync,
} from '../utils/storage';

type Puzzle = { date: string; level: string; scrambledLetters: string; solutionWords: string[] };
const LEVELS = ['easy', 'medium', 'hard'] as const;
type LayoutContextType = { setResetHandler: (handler: (() => void) | null) => void };

// ─── Results panel ────────────────────────────────────────────────────────────

function ResultsPanel({
  puzzle, foundWords, foundSolution, hintsUsed, onShare, onShareCard, shared, onReset, onNextLevel,
}: {
  puzzle: Puzzle;
  foundWords: string[];
  onShareCard: () => void;
  foundSolution: string[];
  hintsUsed: number;
  onShare: () => void;
  shared: boolean;
  onReset: () => void;
  onNextLevel: ((level: string) => void) | null;
}) {
  const bonusWords = foundWords.filter(w => !puzzle.solutionWords.includes(w));
  const stars = hintsUsed === 0 ? 3 : hintsUsed <= 2 ? 2 : 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded p-6 space-y-5 text-center"
      style={{
        background: 'var(--lm-surface)',
        border: '1px solid var(--lm-border)',
        borderBottom: '3px solid var(--lm-border-dark)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div className="space-y-1">
        <p className="text-2xl m-0">🎉</p>
        <h2 className="text-base font-black uppercase tracking-widest m-0"
          style={{ color: 'var(--lm-accent)', fontFamily: "'JetBrains Mono', monospace" }}>
          String Cleared!
        </h2>
        <p className="text-xs font-bold mt-2 px-4 py-2 rounded-lg" style={{
          background: '#d9f24b', color: '#141414', border: '2px solid #141414',
          display: 'inline-block', transform: 'rotate(0.5deg)', fontFamily: "'JetBrains Mono', monospace",
        }}>
          💡 Every string has multiple solution paths — finding a different one is the replay hook.
        </p>
        <p className="text-xs font-semibold m-0" style={{ color: 'var(--lm-text-muted)' }}>
          {puzzle.date} · {puzzle.level}
        </p>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-center gap-6 py-3"
        style={{ borderTop: '1px solid var(--lm-border)', borderBottom: '1px solid var(--lm-border)' }}>
        <div className="text-center">
          <p className="text-xl font-black m-0" style={{ letterSpacing: '0.1em' }}>
            {[1,2,3].map(i => (
              <span key={i} style={{ color: i <= stars ? '#D63B3B' : 'var(--lm-border-dark)', fontSize: '18px' }}>★</span>
            ))}
          </p>
          <p className="text-xs font-semibold m-0" style={{ color: 'var(--lm-text-muted)' }}>Rating</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black m-0" style={{ color: 'var(--lm-text)' }}>{foundWords.length}</p>
          <p className="text-xs font-semibold m-0" style={{ color: 'var(--lm-text-muted)' }}>Words found</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black m-0" style={{ color: 'var(--lm-accent)' }}>{hintsUsed}</p>
          <p className="text-xs font-semibold m-0" style={{ color: 'var(--lm-text-muted)' }}>Hints used</p>
        </div>
      </div>

      {/* Solution words */}
      <div className="text-left space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest m-0"
          style={{ color: 'var(--lm-text-faint)', fontFamily: "'JetBrains Mono', monospace" }}>
          Solution words
        </p>
        <div className="flex flex-wrap gap-2">
          {foundSolution.map((w, i) => (
            <span key={i} className="px-3 py-1 rounded text-sm font-bold uppercase"
              style={{
                background: 'rgba(214,59,59,0.10)', border: '1px solid rgba(214,59,59,0.35)',
                color: 'var(--lm-accent)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em',
              }}>
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* Bonus words */}
      {bonusWords.length > 0 && (
        <div className="text-left space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest m-0"
            style={{ color: 'var(--lm-text-faint)', fontFamily: "'JetBrains Mono', monospace" }}>
            Bonus words ({bonusWords.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {bonusWords.map((w, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-xs font-semibold uppercase"
                style={{ background: 'var(--lm-key-face)', border: '1px solid var(--lm-border)', color: 'var(--lm-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-center flex-wrap pt-1">
        <button onClick={onShare}
          className="px-5 py-2 rounded text-sm font-black text-white transition-colors"
          style={{ background: 'var(--lm-accent)', border: '1px solid var(--lm-accent-dark)', borderBottom: '3px solid var(--lm-accent-side)', fontFamily: "'JetBrains Mono', monospace" }}>
          {shared ? '✓ Copied!' : 'Share result'}
        </button>
        <button onClick={onShareCard}
          className="px-5 py-2 rounded text-sm font-black text-white transition-colors"
          style={{ background: '#D63B3B', border: '1px solid var(--lm-accent-dark)', borderBottom: '3px solid var(--lm-accent-side)', fontFamily: "'JetBrains Mono', monospace" }}>
          Share card
        </button>
        {onNextLevel && (
          <button onClick={() => onNextLevel('medium')}
            className="px-5 py-2 rounded text-sm font-black transition-colors"
            style={{ background: 'var(--lm-key-face)', border: '1px solid var(--lm-border)', borderBottom: '3px solid var(--lm-border-dark)', color: 'var(--lm-text)' }}>
            Try Medium →
          </button>
        )}
        <button onClick={onReset}
          className="px-5 py-2 rounded text-sm font-semibold transition-colors"
          style={{ background: 'var(--lm-key-face)', border: '1px solid var(--lm-border)', color: 'var(--lm-text-muted)' }}>
          Play again
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LetterMixPage() {
  const { date: dateParam, level: levelParam } = useParams();
  const navigate = useNavigate();
  const { setResetHandler } = useOutletContext<LayoutContextType>();
  const puzzleDate = dateParam ?? getTodayDateStr();
  const level: (typeof LEVELS)[number] =
    levelParam && LEVELS.includes(levelParam as (typeof LEVELS)[number])
      ? (levelParam as (typeof LEVELS)[number])
      : 'easy';

  const { isLoading: dbLoading, isValidWord, getWordsByLength } = useWordDatabase();

  const [commonLoading, setCommonLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    loadEnglishCommon()
      .catch(() => {})
      .finally(() => { if (mounted) setCommonLoading(false); });
    return () => { mounted = false; };
  }, []);

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [puzzleLoaded, setPuzzleLoaded] = useState(false);
  const [letters, setLetters] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [shared, setShared] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    setPuzzleLoaded(false);
    setFoundWords([]);
    setSelectedIndices([]);
    setMessage(null);
    setHint(null);
    setHintsUsed(0);
    setShared(false);

    fetch('/data/lettermix-puzzles.json')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: Puzzle[]) => {
        let p = data.find(q => q.date === puzzleDate && q.level === level) ?? null;
        if (!p && data.length > 0) p = data.find(q => q.level === level) ?? data[0];
        setPuzzle(p);
        const completed = p ? getLetterMixCompletedFor(p.date, p.level) : undefined;
        if (completed && p) { setFoundWords(completed.words); setLetters([]); }
        else setLetters(p?.scrambledLetters.split('') ?? []);
        setPuzzleLoaded(true);
      })
      .catch(() => setPuzzleLoaded(true));
  }, [puzzleDate, level]);

  const selectedWord = selectedIndices.map(i => letters[i]).join('').toLowerCase();

  const handleLetterClick = (index: number) => {
    setSelectedIndices(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    setMessage(null);
  };

  const handleSubmit = () => {
    if (!selectedWord || selectedWord.length < 2) { setMessage({ text: 'Select at least 2 letters', type: 'error' }); return; }
    const accepted = puzzle
      ? isAcceptedGuess(selectedWord, {
          isValidDictionaryWord: isValidWord,
          isCommonWord: isCommonEnglishWord,
          solutionWords: puzzle.solutionWords,
        })
      : isValidWord(selectedWord) || isCommonEnglishWord(selectedWord);
    if (!accepted) { setMessage({ text: 'Not a word we recognize — try another.', type: 'error' }); return; }
    if (foundWords.includes(selectedWord)) { setMessage({ text: 'Already found', type: 'error' }); return; }
    setFoundWords(prev => [...prev, selectedWord]);
    setLetters(prev => prev.filter((_, i) => !selectedIndices.includes(i)));
    setSelectedIndices([]);
    setMessage({ text: `Found: ${selectedWord}`, type: 'success' });
  };

  const handleClear = () => { setSelectedIndices([]); setMessage(null); };

  const handleReset = useCallback(() => {
    if (puzzle) {
      setLetters(puzzle.scrambledLetters.split(''));
      setFoundWords([]);
      setSelectedIndices([]);
      setMessage(null);
      setHint(null);
      setHintsUsed(0);
      setShared(false);
      clearHintTargetAsync('lettermix', `${puzzle.date}_${puzzle.level}`);
    }
  }, [puzzle]);

  const foundSolutionWords = puzzle ? foundWords.filter(w => puzzle.solutionWords.includes(w)) : [];
  const isWon = !!(puzzle && foundSolutionWords.length === puzzle.solutionWords.length);

  useEffect(() => {
    if (isWon && puzzle) setLetterMixCompleted(puzzle.date, puzzle.level, foundWords);
  }, [isWon, puzzle, foundWords]);

  useEffect(() => {
    if (!puzzle || foundWords.length === 0) return;
    (async () => {
      const puzzleId = `${puzzle.date}_${puzzle.level}`;
      const target = await getHintTargetAsync('lettermix', puzzleId);
      if (target && foundWords.includes(target.targetWord)) await clearHintTargetAsync('lettermix', puzzleId);
    })();
  }, [puzzle, foundWords]);

  // "Stuck" is only honest when NO remaining valid word can be formed from the
  // leftover letters. The previous check probed a hard-coded list of 2-letter
  // words, but the dictionary has no 2-letter entries, so that escape hatch was
  // dead: the screen fired as soon as the remaining solution words were
  // unformable — even while words were found/listed and bonus words were still
  // playable. That was the counter inconsistency players saw.
  const isStuck = useMemo(() => {
    if (isWon || letters.length < 2) return false;
    return !hasFormableWord(
      letters.join(''),
      foundWords,
      puzzle?.solutionWords ?? [],
      (len) => [...getWordsByLength(len), ...getCommonEnglishWordsByLength(len)]
    );
  }, [letters, puzzle, foundWords, isWon, getWordsByLength]);

  useEffect(() => { setResetHandler(() => handleReset); return () => setResetHandler(null); }, [setResetHandler, handleReset]);

  const getHint = async () => {
    if (!puzzle || puzzle.solutionWords.length === 0) return;
    const puzzleId = `${puzzle.date}_${puzzle.level}`;
    const remainingLetters = letters.join('');
    const unseenSolution = puzzle.solutionWords.filter(w => !foundWords.includes(w));
    if (unseenSolution.length === 0) { setHint('You found all solution words!'); return; }

    let targetWord: string;
    const stored = await getHintTargetAsync('lettermix', puzzleId);
    if (stored && unseenSolution.includes(stored.targetWord)) {
      targetWord = stored.targetWord;
    } else {
      const formable = unseenSolution.find(w => canFormFromLetters(remainingLetters, w));
      targetWord = formable ?? unseenSolution.slice().sort((a, b) => a.length - b.length)[0];
    }

    let hintLevel = stored?.targetWord === targetWord ? stored.hintLevel : 1;
    let hintText: string;
    if (hintLevel === 1) hintText = `Look for a ${targetWord.length}-letter word.`;
    else if (hintLevel === 2) hintText = `Look for a ${targetWord.length}-letter word starting with "${targetWord[0].toUpperCase()}".`;
    else if (hintLevel === 3) hintText = `Look for a ${targetWord.length}-letter word starting with "${targetWord.slice(0, 2).toUpperCase()}".`;
    else hintText = `The word is "${targetWord.toUpperCase()}".`;

    setHint(hintText);
    setHintsUsed(prev => prev + 1);
    await setHintTargetAsync('lettermix', puzzleId, targetWord, Math.min(hintLevel + 1, 4));
  };

  const handleShare = () => {
    if (!puzzle) return;
    const bonusCount = foundWords.filter(w => !puzzle.solutionWords.includes(w)).length;
    const stars = hintsUsed === 0 ? '★★★' : hintsUsed <= 2 ? '★★☆' : '★☆☆';
    const text = [
      `Clear the String — ${puzzle.date} (${puzzle.level})`,
      `${stars}  Found all ${foundSolutionWords.length} solution words!`,
      bonusCount > 0 ? `+${bonusCount} bonus word${bonusCount !== 1 ? 's' : ''}` : '',
      hintsUsed > 0 ? `💡 ${hintsUsed} hint${hintsUsed !== 1 ? 's' : ''} used` : '',
      'yodoku.app',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const switchLevel = (newLevel: (typeof LEVELS)[number]) => {
    if (dateParam) navigate(`/lettermix/play/${puzzleDate}/${newLevel}`);
    else navigate(`/lettermix/play/${newLevel}`);
  };

  // ── Loading states ───────────────────────────────────────────────────────
  if (dbLoading || !puzzleLoaded || commonLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-sm font-semibold" style={{ color: 'var(--lm-text-muted)' }}>Loading puzzle…</div>
      </div>
    );
  }
  if (!puzzle) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-sm text-center" style={{ color: 'var(--lm-text-muted)' }}>
          Could not load puzzles. Check that <code style={{ color: 'var(--lm-accent)' }}>/data/lettermix-puzzles.json</code> is available.
        </p>
        <Link to="/lettermix" className="px-4 py-2 font-bold text-sm text-white rounded"
          style={{ background: 'var(--lm-accent)', textDecoration: 'none' }}>Try again</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Rules modal */}
      <AnimatePresence>
        {rulesOpen && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
              onClick={() => setRulesOpen(false)} />
            <motion.div key="sheet" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed z-50 bottom-0 left-0 right-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">
              <div className="w-full sm:max-w-md p-6 max-h-[85dvh] overflow-y-auto"
                style={{ background: 'var(--lm-surface)', border: '1px solid var(--lm-border)', borderBottom: '3px solid var(--lm-border-dark)', borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-black uppercase tracking-widest"
                    style={{ color: 'var(--lm-accent)', fontFamily: "'JetBrains Mono', monospace" }}>How to play</h2>
                  <button onClick={() => setRulesOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded text-lg leading-none"
                    style={{ border: '1px solid var(--lm-border)', color: 'var(--lm-text-muted)', background: 'var(--lm-key-face)' }}>✕</button>
                </div>
                <ol className="space-y-4 list-none m-0 p-0">
                  {['A string of scrambled letters hides several solution words. Find them all to clear the string.',
                    'Tap letters to select them in any order, then press Submit. Any valid English word is accepted.',
                    'Matched letters disappear. The order you remove words matters — some letters are shared.',
                    'Stuck? Press Hint for a progressive clue about a remaining solution word.']
                    .map((text, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="font-black w-5 flex-shrink-0 mt-0.5"
                          style={{ color: 'var(--lm-accent)', fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>
                        <span style={{ color: 'var(--lm-text-muted)', lineHeight: '1.6' }}>{text}</span>
                      </li>
                    ))}
                </ol>
                <button onClick={() => setRulesOpen(false)}
                  className="mt-6 w-full py-3 text-sm font-black uppercase tracking-widest text-white rounded"
                  style={{ background: 'var(--lm-accent)', border: '1px solid var(--lm-accent-dark)', borderBottom: '3px solid var(--lm-accent-side)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Got it — let&apos;s play
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Game header */}
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--lm-text-faint)', fontFamily: "'JetBrains Mono', monospace" }}>
              {puzzle.date} · {puzzle.level}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--lm-text-muted)' }}>Hidden Words:</span>
              <div className="flex gap-1">
                {Array.from({ length: puzzle.solutionWords.length }).map((_, i) => (
                  <span key={i} className="text-base"
                    style={{ color: i < foundSolutionWords.length ? 'var(--lm-accent)' : 'var(--lm-border-dark)' }}>
                    {i < foundSolutionWords.length ? '●' : '○'}
                  </span>
                ))}
              </div>
              <span className="text-xs font-black"
                style={{ color: 'var(--lm-accent)', fontFamily: "'JetBrains Mono', monospace" }}>
                Found {foundSolutionWords.length} of {puzzle.solutionWords.length}
              </span>
            </div>
            <div className="text-xs font-semibold" style={{ color: 'var(--lm-text-faint)', fontFamily: "'JetBrains Mono', monospace" }}>
              {puzzle.solutionWords.length} words —{' '}
              {Object.entries(
                puzzle.solutionWords.reduce((acc, w) => { acc[w.length] = (acc[w.length] || 0) + 1; return acc; }, {} as Record<number, number>)
              ).sort(([a], [b]) => Number(a) - Number(b)).map(([len, count]) => `${count}×${len}L`).join(' · ')}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setRulesOpen(true)}
              className="px-2.5 py-1 text-xs font-bold rounded"
              style={{ background: 'var(--lm-key-face)', border: '1px solid var(--lm-border)', borderBottom: '2px solid var(--lm-border-dark)', color: 'var(--lm-text-muted)', boxShadow: '0 2px 0 var(--lm-key-side)' }}>
              ?
            </button>
            <button onClick={getHint}
              className="px-2.5 py-1 text-xs font-bold rounded"
              style={{ background: 'var(--lm-key-face)', border: '1px solid var(--lm-border)', borderBottom: '2px solid var(--lm-accent-dark)', color: 'var(--lm-accent)', boxShadow: '0 2px 0 var(--lm-key-side)', fontFamily: "'JetBrains Mono', monospace" }}>
              Hint {hintsUsed > 0 ? `(${hintsUsed})` : ''}
            </button>
          </div>
        </div>

        {/* Level selector */}
        <div className="flex gap-2 mb-3">
          {LEVELS.map(l => (
            <button key={l} onClick={() => switchLevel(l)}
              className="px-3 py-1.5 text-sm font-bold capitalize rounded"
              style={l === puzzle.level
                ? { background: 'var(--lm-accent)', color: '#fff', border: '1px solid var(--lm-accent-dark)', borderBottom: '2px solid var(--lm-accent-side)', boxShadow: '0 2px 0 var(--lm-accent-side)', fontFamily: "'JetBrains Mono', monospace" }
                : { background: 'var(--lm-key-face)', color: 'var(--lm-text-muted)', border: '1px solid var(--lm-border)', borderBottom: '2px solid var(--lm-border-dark)', boxShadow: '0 2px 0 var(--lm-key-side)' }}>
              {l}
            </button>
          ))}
        </div>

        {hint && (
          <div className="flex items-center justify-between gap-2 mb-2 px-3 py-2 rounded text-sm font-semibold"
            style={{ background: 'rgba(214,59,59,0.06)', border: '1px solid rgba(214,59,59,0.25)', color: 'var(--lm-accent)' }}>
            <span>💡 {hint}</span>
            <button onClick={() => setHint(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isWon ? (
            <motion.div key="win" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ResultsPanel
                puzzle={puzzle}
                foundWords={foundWords}
                foundSolution={foundSolutionWords}
                hintsUsed={hintsUsed}
                onShare={handleShare}
                onShareCard={() => setCardOpen(true)}
                shared={shared}
                onReset={handleReset}
                onNextLevel={level === 'easy' ? () => switchLevel('medium') : level === 'medium' ? () => switchLevel('hard') : null}
              />
            </motion.div>
          ) : isStuck ? (
            <motion.div key="stuck" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded p-6 text-center space-y-4"
              style={{ background: 'rgba(214,59,59,0.06)', border: '1px solid rgba(214,59,59,0.4)', borderBottom: '3px solid rgba(214,59,59,0.5)' }}>
              <p className="text-xl font-black" style={{ color: 'var(--lm-accent)' }}>Stuck!</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--lm-text-muted)' }}>
                Can&apos;t form any more words from the remaining letters. Found {foundSolutionWords.length} of {puzzle.solutionWords.length} hidden words
                {foundWords.length > foundSolutionWords.length ? ` (${foundWords.length} words found in total)` : ''}.
              </p>
              <button onClick={handleReset} className="px-5 py-2 rounded text-sm font-black text-white"
                style={{ background: 'var(--lm-accent)', border: '1px solid var(--lm-accent-dark)', borderBottom: '2px solid var(--lm-accent-side)' }}>
                Reset Puzzle
              </button>
            </motion.div>
          ) : (
            <motion.div key="game" className="space-y-4">
              <div className="flex flex-wrap gap-2 min-h-[3rem]">
                <AnimatePresence>
                  {letters.map((letter, i) => (
                    <motion.button key={`${i}-${letter}`} layout
                      initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                      onClick={() => handleLetterClick(i)}
                      className={`lettermix-key ${selectedIndices.includes(i) ? 'lettermix-key-selected' : ''}`}>
                      {letter.toUpperCase()}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-2.5 text-lg font-mono font-semibold rounded"
                  style={{ background: 'var(--lm-surface)', border: '1px solid var(--lm-border)', borderBottom: '2px solid var(--lm-border-dark)', color: selectedWord ? 'var(--lm-text)' : 'var(--lm-text-faint)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>
                  {selectedWord.toUpperCase() || '_ _ _'}
                </div>
                <button onClick={handleSubmit} data-haptic
                  className="px-4 py-2 rounded text-sm font-black text-white"
                  style={{ background: 'var(--lm-accent)', border: '1px solid var(--lm-accent-dark)', borderBottom: '3px solid var(--lm-accent-side)', boxShadow: '0 3px 0 var(--lm-accent-side)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em' }}
                  onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 0 var(--lm-accent-side)'; }}
                  onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 3px 0 var(--lm-accent-side)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 3px 0 var(--lm-accent-side)'; }}>
                  Submit
                </button>
                <button onClick={handleClear} data-haptic
                  className="px-4 py-2 rounded text-sm font-semibold"
                  style={{ background: 'var(--lm-key-face)', border: '1px solid var(--lm-border)', borderBottom: '3px solid var(--lm-border-dark)', boxShadow: '0 3px 0 var(--lm-key-side)', color: 'var(--lm-text-muted)' }}
                  onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 0 var(--lm-key-side)'; }}
                  onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 3px 0 var(--lm-key-side)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 3px 0 var(--lm-key-side)'; }}>
                  Clear
                </button>
              </div>

              {message && (
                <p className="text-sm font-bold"
                  style={{ color: message.type === 'success' ? '#059669' : 'var(--lm-accent)' }}>
                  {message.text}
                </p>
              )}

              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--lm-text-faint)', fontFamily: "'JetBrains Mono', monospace" }}>Found words</p>
                <div className="flex flex-wrap gap-2">
                  {foundWords.map((w, i) => (
                    <span key={i} className="px-3 py-1 rounded text-sm font-bold uppercase"
                      style={{ background: 'rgba(214,59,59,0.08)', border: '1px solid rgba(214,59,59,0.3)', color: 'var(--lm-accent)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <ShareCardModal
        open={cardOpen}
        onClose={() => setCardOpen(false)}
        options={{
          gameId: `lettermix-${puzzle?.date ?? ''}-${puzzle?.level ?? ''}`,
          title: 'Clear the String',
          accentColor: '#D63B3B',
          lines: puzzle
            ? [
                `${puzzle.date} (${puzzle.level})`,
                `${hintsUsed === 0 ? '★★★' : hintsUsed <= 2 ? '★★☆' : '★☆☆'} Found all ${foundSolutionWords.length} solution words!`,
                foundWords.filter((w) => !puzzle.solutionWords.includes(w)).length > 0
                  ? `+${foundWords.filter((w) => !puzzle.solutionWords.includes(w)).length} bonus words`
                  : '',
              ].filter(Boolean)
            : [],
        }}
        shareText={puzzle
          ? [
              `Clear the String — ${puzzle.date} (${puzzle.level})`,
              `${hintsUsed === 0 ? '★★★' : hintsUsed <= 2 ? '★★☆' : '★☆☆'}  Found all ${foundSolutionWords.length} solution words!`,
              foundWords.filter((w) => !puzzle.solutionWords.includes(w)).length > 0
                ? `+${foundWords.filter((w) => !puzzle.solutionWords.includes(w)).length} bonus word${foundWords.filter((w) => !puzzle.solutionWords.includes(w)).length !== 1 ? 's' : ''}`
                : '',
              hintsUsed > 0 ? `💡 ${hintsUsed} hint${hintsUsed !== 1 ? 's' : ''} used` : '',
              'yodoku.app',
            ].filter(Boolean).join('\n')
          : ''}
      />
    </div>
  );
}
