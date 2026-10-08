import React, { useState, useEffect, useCallback } from 'react';
import ShareCardModal from '../components/ShareCardModal';
import OnScreenKeyboard from '../components/OnScreenKeyboard';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { loadCboWords, getCboWordsByLength, isCboWordsLoaded } from '../utils/cbo-words';
import { loadCboDailyChallenge, getTodayCboDateStr } from '../utils/cbo-dailyChallenge';
import {
  initDailyState,
  submitWordToState,
  resetPuzzleState,
  saveCboState,
  loadCboState,
} from '../utils/cbo-gameState';
import type { CboDailyState, CboPuzzleState } from '../utils/cbo-gameState';
import { calculateOptimalPath, getDifferingLetterIndex } from '../utils/cbo-gameLogic';
import { getHintTargetAsync, setHintTargetAsync, clearHintTargetAsync } from '../utils/storage';

// ─── Helpers ────────────────────────────────────────────────────────────────

function ordinal(n: number) {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
}

// 3★ = within 2 moves of optimal (the exact shortest path is usually unique and
// unknowable); 2★ = within 4 moves; otherwise 1★.
function starsFor(moves: number, optimal: number): number {
  if (moves <= optimal + 2) return 3;
  if (moves <= optimal + 4) return 2;
  return 1;
}

function Stars({ count }: { count: number }) {
  return (
    <span style={{ letterSpacing: '0.1em' }}>
      {[1, 2, 3].map(i => (
        <span key={i} style={{ color: i <= count ? '#D8A93A' : 'var(--cbo-border-dark)', fontSize: '16px' }}>★</span>
      ))}
    </span>
  );
}

function highlightDiff(prev: string, current: string): React.ReactElement[] {
  return current.split('').map((ch, i) => (
    <span key={i} style={prev[i] !== ch ? { color: 'var(--cbo-highlight)', fontWeight: 800 } : {}}>
      {ch.toUpperCase()}
    </span>
  ));
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function WordChain({ chain }: { chain: string[] }) {
  return (
    <div className="w-full">
      <p className="text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: 'var(--cbo-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
        Your path
      </p>
      <div className="flex flex-wrap gap-2 justify-center items-center">
        {chain.map((word, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="cbo-chain-word">
              {i > 0 ? highlightDiff(chain[i - 1], word) : word.toUpperCase()}
            </div>
            {i < chain.length - 1 && (
              <span className="text-sm font-bold" style={{ color: 'var(--cbo-accent)' }}>→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PuzzleTab({ ps, active, onClick }: { ps: CboPuzzleState; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`cbo-tab ${active ? 'cbo-tab-active' : ps.status === 'won' ? 'cbo-tab-done' : ''}`}>
      {ps.length}L
    </button>
  );
}

function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="max-w-md w-full p-6"
        style={{ background: 'var(--cbo-surface)', border: '1px solid var(--cbo-border)', borderBottom: '3px solid var(--cbo-border-dark)', borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.14)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-black uppercase tracking-widest"
            style={{ color: 'var(--cbo-accent)', fontFamily: "'JetBrains Mono', monospace" }}>
            How to Play
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded text-lg leading-none"
            style={{ background: 'var(--cbo-surface-2)', border: '1px solid var(--cbo-border)', color: 'var(--cbo-text-muted)' }}>
            ✕
          </button>
        </div>
        <ol className="space-y-3 list-none m-0 p-0">
          {[
            <><strong style={{ color: 'var(--cbo-text)' }}>Start word → target word</strong>, same length. Change one letter at a time.</>,
            <>Every step must be a <strong style={{ color: 'var(--cbo-text)' }}>real English word</strong>.</>,
            <>Reach the target in as few steps as possible. Exceed the move limit and the puzzle resets.</>,
            <>Use <strong style={{ color: 'var(--cbo-text)' }}>Hint</strong> anytime — each press reveals a little more about the next best step.</>,
          ].map((text, i) => (
            <li key={i} className="flex gap-3 text-sm" style={{ color: 'var(--cbo-text-muted)', lineHeight: '1.6' }}>
              <span className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-black"
                style={{ background: 'rgba(62,159,168,0.12)', color: 'var(--cbo-accent)', fontFamily: "'JetBrains Mono', monospace" }}>
                {i + 1}
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 p-3 rounded" style={{ background: 'var(--cbo-surface-2)', border: '1px solid var(--cbo-border)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--cbo-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            Example: CAT → DOG
          </p>
          <div className="flex items-center gap-2 flex-wrap text-sm font-mono font-bold">
            {['CAT','COT','DOT','DOG'].map((w, i, arr) => (
              <React.Fragment key={w}>
                <span style={{ color: i === 0 ? 'var(--cbo-highlight)' : i === arr.length - 1 ? 'var(--cbo-accent)' : 'var(--cbo-text)' }}>{w}</span>
                {i < arr.length - 1 && <span style={{ color: 'var(--cbo-text-muted)' }}>→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="cbo-btn-primary mt-5 w-full justify-center py-3" style={{ fontSize: '13px' }}>
          Got it — let&apos;s play
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── All-Done Results Panel ──────────────────────────────────────────────────

function ResultsPanel({ state, totalHints, onViewPuzzle }: {
  state: CboDailyState;
  totalHints: Record<number, number>;
  onViewPuzzle: (len: number) => void;
}) {
  const [shared, setShared] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);

  const shareText = [
    `Change by One — ${state.date}`,
    ...state.puzzles.map(p => {
      const s = starsFor(p.moves, p.optimal_steps);
      const stars = '★'.repeat(s) + '☆'.repeat(3 - s);
      return `${p.length}L ${stars}  ${p.moves} step${p.moves !== 1 ? 's' : ''} (optimal: ${p.optimal_steps})`;
    }),
    `Hints used: ${Object.values(totalHints).reduce((a, b) => a + b, 0)}`,
    'yodoku.app',
  ].join('\n');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded p-6 space-y-5"
      style={{
        background: 'var(--cbo-surface)',
        border: '1px solid var(--cbo-border)',
        borderBottom: '3px solid var(--cbo-border-dark)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-2xl m-0">🎉</p>
        <h2 className="text-base font-black uppercase tracking-widest m-0"
          style={{ color: 'var(--cbo-accent)', fontFamily: "'JetBrains Mono', monospace" }}>
          All Puzzles Solved!
        </h2>
        <p className="text-xs font-semibold m-0" style={{ color: 'var(--cbo-text-muted)' }}>{state.date}</p>
      </div>

      {/* Per-puzzle rows */}
      <div className="space-y-2">
        {state.puzzles.map(p => (
          <button
            key={p.length}
            onClick={() => onViewPuzzle(p.length)}
            className="w-full flex items-center justify-between px-4 py-3 rounded text-left transition-colors"
            style={{
              background: 'var(--cbo-bg)',
              border: '1px solid var(--cbo-border)',
              borderBottom: '2px solid var(--cbo-border-dark)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider"
                style={{ color: 'var(--cbo-text-muted)', fontFamily: "'JetBrains Mono', monospace", minWidth: '20px' }}>
                {p.length}L
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--cbo-text)' }}>
                {p.start_word.toUpperCase()} → {p.end_word.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold" style={{ color: 'var(--cbo-text-muted)' }}>
                {p.moves}/{p.optimal_steps} steps
              </span>
              <Stars count={starsFor(p.moves, p.optimal_steps)} />
            </div>
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-center gap-6 py-2" style={{ borderTop: '1px solid var(--cbo-border)', borderBottom: '1px solid var(--cbo-border)' }}>
        <div className="text-center">
          <p className="text-xl font-black m-0" style={{ color: 'var(--cbo-accent)' }}>
            {'★'.repeat(Math.round(state.puzzles.reduce((s, p) => s + starsFor(p.moves, p.optimal_steps), 0) / state.puzzles.length))}
          </p>
          <p className="text-xs font-semibold m-0" style={{ color: 'var(--cbo-text-muted)' }}>Rating</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black m-0" style={{ color: 'var(--cbo-text)' }}>
            {state.puzzles.reduce((s, p) => s + p.moves, 0)}
          </p>
          <p className="text-xs font-semibold m-0" style={{ color: 'var(--cbo-text-muted)' }}>Total steps</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black m-0" style={{ color: 'var(--cbo-highlight)' }}>
            {Object.values(totalHints).reduce((a, b) => a + b, 0)}
          </p>
          <p className="text-xs font-semibold m-0" style={{ color: 'var(--cbo-text-muted)' }}>Hints used</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => { navigator.clipboard.writeText(shareText).catch(() => {}); setShared(true); setTimeout(() => setShared(false), 2000); }}
          className="cbo-btn-primary"
        >
          {shared ? '✓ Copied!' : 'Share result'}
        </button>
        <button onClick={() => setCardOpen(true)} className="cbo-btn-primary" style={{ background: '#3E9FA8' }}>
          Share card
        </button>
        <p className="text-xs font-semibold self-center m-0" style={{ color: 'var(--cbo-text-muted)' }}>
          Come back tomorrow for a new set.
        </p>
      </div>

      <ShareCardModal
        open={cardOpen}
        onClose={() => setCardOpen(false)}
        options={{
          gameId: `cbo-${state.date}`,
          title: 'Change by One',
          accentColor: '#3E9FA8',
          lines: [
            `All ${state.puzzles.length} word-lengths done`,
            `Hints used: ${Object.values(totalHints).reduce((a, b) => a + b, 0)}`,
            state.date,
          ],
        }}
        shareText={shareText}
      />
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ChangeByOnePage() {
  const { date: dateParam } = useParams<{ date?: string }>();
  const todayStr = getTodayCboDateStr();
  const dateStr = dateParam ?? todayStr;
  const isPastPuzzle = dateStr !== todayStr;

  const [, setWordsReady] = useState(isCboWordsLoaded());
  const [gameState, setGameState] = useState<CboDailyState | null>(null);
  const [activeLength, setActiveLength] = useState<number>(4);
  const [input, setInput] = useState('');
  const [hintText, setHintText] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('cbo_hintsUsed');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // Persist hintsUsed to localStorage
  useEffect(() => {
    localStorage.setItem('cbo_hintsUsed', JSON.stringify(hintsUsed));
  }, [hintsUsed]);

  const [showRules, setShowRules] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        await loadCboWords();
        if (cancelled) return;
        setWordsReady(true);
        const date = dateStr;
        const challenge = await loadCboDailyChallenge(date);
        if (cancelled) return;
        const saved = loadCboState(date);
        if (saved && saved.puzzles.length === challenge.puzzles.length) {
          setGameState(saved);
          const firstIncomplete = saved.puzzles.find(p => p.status !== 'won');
          setActiveLength(firstIncomplete?.length ?? challenge.puzzles[0].length);
          if (!firstIncomplete) setShowResults(true);
        } else {
          const fresh = initDailyState(date, challenge.puzzles);
          setGameState(fresh);
          setActiveLength(challenge.puzzles[0].length);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load game');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const activePuzzle = gameState?.puzzles.find(p => p.length === activeLength);

  useEffect(() => {
    setHintText(null);
    setInput('');
  }, [activeLength]);

  const handleSubmit = useCallback(() => {
    if (!gameState || !activePuzzle) return;
    const word = input.trim().toLowerCase();
    if (word.length !== activeLength) return;
    const newState = submitWordToState(gameState, activeLength, word);
    setGameState(newState);
    saveCboState(newState);
    setInput('');
    setHintText(null);
    // Show results if all done
    const allDone = newState.puzzles.every(p => p.status === 'won');
    if (allDone) setTimeout(() => setShowResults(true), 600);
  }, [gameState, activePuzzle, input, activeLength]);

  const handleReset = useCallback(() => {
    if (!gameState) return;
    const newState = resetPuzzleState(gameState, activeLength);
    setGameState(newState);
    saveCboState(newState);
    setInput('');
    setHintText(null);
    setHintsUsed(prev => ({ ...prev, [activeLength]: 0 }));
    clearHintTargetAsync('changebyone', `${dateStr}_${activeLength}`);
  }, [gameState, activeLength]);

  // ── Physical keyboard listener ────────────────────────────────────────────
  useEffect(() => {
    if (!activePuzzle || activePuzzle.status === 'won') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Backspace') {
        setInput(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        handleSubmit();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        setInput(prev => prev.length < activeLength ? prev + e.key.toLowerCase() : prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePuzzle, activeLength, handleSubmit]);

  // ── Progressive 3-stage hints (BFS-based) ────────────────────────────────
  const handleHint = useCallback(async () => {
    if (!activePuzzle || activePuzzle.status === 'won') return;
    const puzzleId = `${dateStr}_${activeLength}`;
    const words = getCboWordsByLength(activeLength);

    // Use BFS from the player's current word to find the true next step.
    // This works correctly even when the player has deviated from the optimal path.
    const path = calculateOptimalPath(activePuzzle.currentWord, activePuzzle.end_word, words);
    const targetWord: string | null = path.length > 1 ? path[1] : null;

    const stored = await getHintTargetAsync('changebyone', puzzleId);
    // Escalate hint level if the same target word is being hinted again
    const hintLevel = stored?.targetWord === targetWord ? Math.min(stored.hintLevel + 1, 3) : 1;

    let hintTextToShow: string;
    if (targetWord) {
      const pos = activePuzzle.currentWord.split('').findIndex((ch, i) => ch !== targetWord[i]);
      if (hintLevel === 1) {
        hintTextToShow = pos >= 0
          ? `Try changing the ${ordinal(pos + 1)} letter.`
          : `You're one step away — think carefully.`;
      } else if (hintLevel === 2) {
        hintTextToShow = pos >= 0
          ? `Change the ${ordinal(pos + 1)} letter to "${targetWord[pos].toUpperCase()}".`
          : `The next word starts with "${targetWord[0].toUpperCase()}".`;
      } else {
        hintTextToShow = `Try the word "${targetWord.toUpperCase()}".`;
      }
    } else {
      // No BFS path found — rare edge case, guide toward target directly
      const diffIdx = getDifferingLetterIndex(activePuzzle.currentWord, activePuzzle.end_word);
      hintTextToShow = diffIdx !== null
        ? `Try changing the ${ordinal(diffIdx + 1)} letter — it differs from the target.`
        : 'No path found from here — try resetting and taking a different route.';
    }

    setHintText(hintTextToShow);
    setHintsUsed(prev => ({ ...prev, [activeLength]: (prev[activeLength] ?? 0) + 1 }));

    if (targetWord) {
      await setHintTargetAsync('changebyone', puzzleId, targetWord, hintLevel);
    }
  }, [activePuzzle, activeLength]);

  // ── Loading / error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--cbo-border)', borderTopColor: 'var(--cbo-accent)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--cbo-text-muted)' }}>
          {isPastPuzzle ? `Loading ${dateStr} challenge…` : "Loading today's challenge…"}
        </p>
      </div>
    );
  }

  if (error || !gameState || !activePuzzle) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <span className="text-4xl">⚠️</span>
        <p className="font-semibold" style={{ color: 'var(--cbo-accent)' }}>{error ?? 'Could not load game'}</p>
        <button onClick={() => window.location.reload()} className="cbo-btn-secondary">Retry</button>
      </div>
    );
  }

  const completedCount = gameState.puzzles.filter(p => p.status === 'won').length;
  const totalPuzzles = gameState.puzzles.length;
  const allDone = completedCount === totalPuzzles;

  return (
    <div className="space-y-4">

      {/* Puzzle selector bar */}
      <div className="p-4" style={{
        background: 'var(--cbo-surface)', border: '1px solid var(--cbo-border)',
        borderBottom: '2px solid var(--cbo-border-dark)', borderRadius: '6px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            {gameState.puzzles.map(ps => (
              <PuzzleTab key={ps.length} ps={ps} active={ps.length === activeLength}
                onClick={() => { setActiveLength(ps.length); setShowResults(false); }} />
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex gap-1">
              {gameState.puzzles.map(ps => (
                <div key={ps.length} className={`cbo-dot ${ps.status === 'won' ? 'cbo-dot-won' : ''}`}
                  title={`${ps.length}-letter: ${ps.status}`} />
              ))}
            </div>
            <span className="text-xs font-bold" style={{ color: 'var(--cbo-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              {completedCount}/{totalPuzzles}
            </span>
            {allDone && (
              <button onClick={() => setShowResults(!showResults)} className="cbo-btn-primary"
                style={{ padding: '4px 10px', fontSize: '11px' }}>
                {showResults ? 'Puzzles' : 'Results'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results panel */}
      <AnimatePresence>
        {showResults && allDone && (
          <ResultsPanel state={gameState} totalHints={hintsUsed}
            onViewPuzzle={len => { setActiveLength(len); setShowResults(false); }} />
        )}
      </AnimatePresence>

      {/* Main game card */}
      {!showResults && (
        <div className="p-5 space-y-5" style={{
          background: 'var(--cbo-surface)', border: '1px solid var(--cbo-border)',
          borderBottom: '2px solid var(--cbo-border-dark)', borderRadius: '6px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}>
          {/* Start → target */}
          <div className="text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--cbo-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              {activePuzzle.length}-Letter Puzzle · {gameState.date}
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="cbo-word-key cbo-word-start">{activePuzzle.start_word.toUpperCase()}</div>
              <span className="text-lg font-bold" style={{ color: 'var(--cbo-text-muted)' }}>→</span>
              <div className="cbo-word-key cbo-word-target">{activePuzzle.end_word.toUpperCase()}</div>
            </div>
            <p className="text-xs font-semibold m-0" style={{ color: 'var(--cbo-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              Optimal: {activePuzzle.optimal_steps} step{activePuzzle.optimal_steps !== 1 ? 's' : ''} · Up to {activePuzzle.maxMoves} moves
            </p>
          </div>

          {/* Next puzzle button */}
          {activePuzzle.status === 'won' && (() => {
            const next = gameState.puzzles.find(p => p.length > activeLength && p.status !== 'won');
            return next ? (
              <div className="flex justify-center">
                <button onClick={() => setActiveLength(next.length)} className="cbo-btn-primary">
                  Next Puzzle ({next.length}L)
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            ) : null;
          })()}

          {/* Word chain */}
          {activePuzzle.wordChain.length > 1 && <WordChain chain={activePuzzle.wordChain} />}

          {/* Letter slot display + on-screen keyboard */}
          {activePuzzle.status !== 'won' && (
            <div className="w-full space-y-3">
              {/* Letter slots — show typed letters in individual boxes */}
              <div className="cbo-letter-slots">
                {Array.from({ length: activeLength }).map((_, i) => (
                  <div
                    key={i}
                    className={[
                      'cbo-letter-slot',
                      i < input.length ? 'cbo-letter-slot-filled' : '',
                      i === input.length ? 'cbo-letter-slot-cursor' : '',
                    ].join(' ')}
                  >
                    {input[i]?.toUpperCase() ?? ''}
                  </div>
                ))}
              </div>
              {/* QWERTY keyboard */}
              <OnScreenKeyboard
                theme="cbo"
                onKey={(letter) => setInput(prev => prev.length < activeLength ? prev + letter : prev)}
                onBackspace={() => setInput(prev => prev.slice(0, -1))}
                onEnter={handleSubmit}
                enterDisabled={input.length !== activeLength}
                enterLabel="GO"
              />
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {activePuzzle.errors.length > 0 && (
              <motion.div key={activePuzzle.errors[activePuzzle.errors.length - 1]}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded px-4 py-2.5 text-sm text-center font-semibold"
                style={{ background: 'rgba(214,59,59,0.07)', border: '1px solid rgba(214,59,59,0.3)', color: '#c0392b' }}>
                {activePuzzle.errors[activePuzzle.errors.length - 1]}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Win state */}
          {activePuzzle.status === 'won' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded px-4 py-3 text-sm text-center space-y-2"
              style={{ background: 'rgba(62,159,168,0.08)', border: '1px solid rgba(62,159,168,0.4)', borderBottom: '2px solid rgba(62,159,168,0.5)' }}>
              <p className="font-bold m-0" style={{ color: 'var(--cbo-accent)' }}>
                🎉 Solved in {activePuzzle.moves} step{activePuzzle.moves !== 1 ? 's' : ''}!
                </p>
                <p className="text-xs font-bold mt-2 px-4 py-2 rounded-lg" style={{
                  background: '#5bc9ff', color: '#141414', border: '2px solid #141414',
                  display: 'inline-block', transform: 'rotate(-0.5deg)', fontFamily: "'JetBrains Mono', monospace",
                }}>
                  💡 Word ladders were invented by Lewis Carroll in 1877. Every puzzle has at least one optimal path.
                </p>
              <div className="flex items-center justify-center gap-3">
                <Stars count={starsFor(activePuzzle.moves, activePuzzle.optimal_steps)} />
                <span className="text-xs" style={{ color: 'var(--cbo-text-muted)' }}>
                  Optimal: {activePuzzle.optimal_steps} step{activePuzzle.optimal_steps !== 1 ? 's' : ''}
                </span>
                {(hintsUsed[activeLength] ?? 0) > 0 && (
                  <span className="text-xs" style={{ color: 'var(--cbo-highlight)' }}>
                    💡 {hintsUsed[activeLength]} hint{hintsUsed[activeLength] !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Hint display */}
          {hintText && (
            <motion.div key={hintText} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="rounded px-4 py-2.5 text-sm text-center font-semibold flex items-center justify-between gap-2"
              style={{ background: 'rgba(216,169,58,0.08)', border: '1px solid rgba(216,169,58,0.35)', color: 'var(--cbo-highlight)' }}>
              <span>💡 {hintText}</span>
              <button onClick={() => setHintText(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
            </motion.div>
          )}

          {/* Bottom controls */}
          <div className="flex items-center justify-between flex-wrap gap-y-2 pt-3" style={{ borderTop: '1px solid var(--cbo-border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--cbo-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>Moves</span>
              <div className="flex gap-1">
                {Array.from({ length: activePuzzle.maxMoves }).map((_, i) => (
                  <div key={i} className={`cbo-dot ${i < activePuzzle.moves ? activePuzzle.status === 'won' ? 'cbo-dot-won' : 'cbo-dot-used' : ''}`} />
                ))}
              </div>
              <span className="text-xs font-bold" style={{ color: 'var(--cbo-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                {activePuzzle.moves}/{activePuzzle.maxMoves}
              </span>
            </div>
            <div className="flex gap-2">
              {activePuzzle.status !== 'won' && (
                <button onClick={handleHint} className="cbo-btn-highlight">
                  💡 Hint
                </button>
              )}
              {activePuzzle.status !== 'won' && (
                <button onClick={handleReset} className="cbo-btn-secondary">Reset</button>
              )}
              <button onClick={() => setShowRules(true)} className="cbo-btn-secondary" style={{ padding: '8px 12px' }}>?</button>
            </div>
          </div>
        </div>
      )}

      {/* Rules modal */}
      <AnimatePresence>
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </AnimatePresence>
    </div>
  );
}
