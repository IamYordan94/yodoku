import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import AdSlot from '../components/AdSlot';
import ShareCardModal from '../components/ShareCardModal';
import {
  type OrderleState,
  initOrderleState,
  orderleFeedback,
  isOrderleWin,
  shareOrderleText,
} from '../utils/orderleLogic';
import { ORDERLE_BANK } from '../utils/puzzleGenerator';
import { markPlayed, todayISO } from '../utils/dailyProgress';
import { getTodayUTCStr } from '../utils/dailySeed';
import { loadResume, saveResume } from '../utils/gameResume';
import ResumeBanner from '../components/ResumeBanner';

const LAUNCH_DATE = '2026-08-07';
const DAY_MS = 86400000;

type OrderleSaved = {
  idx: number;
  current: number[];
  attempts: number;
  history: OrderleState['history'];
  won: boolean;
  over: boolean;
};

function getTodayIndex(): number {
  const utcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const now = new Date();
  const days = Math.floor((utcDay(now) - utcDay(new Date(LAUNCH_DATE + 'T00:00:00Z'))) / DAY_MS);
  return ((days % ORDERLE_BANK.length) + ORDERLE_BANK.length) % ORDERLE_BANK.length;
}

interface OrderlePageProps {
  practice?: boolean;
}

export default function OrderlePage({ practice = false }: OrderlePageProps) {
  const [state, setState] = useState<OrderleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [resumed, setResumed] = useState(false);

  useEffect(() => {
    if (state?.won) markPlayed('orderle', todayISO());
  }, [state?.won]);

  useEffect(() => {
    const idx = practice ? Math.floor(Math.random() * ORDERLE_BANK.length) : getTodayIndex();
    const puzzle = ORDERLE_BANK[idx];
    const s = initOrderleState(puzzle, idx);
    if (!practice) {
      const saved = loadResume<OrderleSaved>('orderle', getTodayUTCStr());
      if (saved && saved.idx === idx && Array.isArray(saved.current)) {
        s.current = saved.current;
        s.attempts = saved.attempts;
        s.history = saved.history;
        s.won = saved.won;
        s.over = saved.over;
        s.selected = -1;
        if (!saved.over && saved.attempts > 0) setResumed(true);
      }
    }
    setPuzzleIdx(idx);
    setState(s);
    setLoading(false);
  }, [practice]);

  // Persist in-progress state so leaving the site never resets the daily board.
  useEffect(() => {
    if (practice || !state || !state.puzzle) return;
    saveResume<OrderleSaved>('orderle', getTodayUTCStr(), {
      idx: puzzleIdx,
      current: state.current,
      attempts: state.attempts,
      history: state.history,
      won: state.won,
      over: state.over,
    });
  }, [practice, state, puzzleIdx]);

  const handleTileClick = useCallback((i: number) => {
    if (!state || state.over) return;
    setState(prev => {
      if (!prev) return prev;
      if (prev.selected === -1) {
        return { ...prev, selected: i };
      }
      if (prev.selected === i) {
        return { ...prev, selected: -1 };
      }
      // commit swap
      const current = [...prev.current];
      const from = prev.selected;
      const to = i;
      [current[from], current[to]] = [current[to], current[from]];
      const attempts = prev.attempts + 1;
      const fb = orderleFeedback(current, prev.answer);
      const history = [...prev.history, fb];
      const won = isOrderleWin(fb);
      const over = won || attempts >= prev.maxAttempts;
      return { ...prev, current, attempts, history, won, over, selected: -1 };
    });
  }, [state]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!state || state.over) return;
    if (e.key === 'Escape') {
      setState(prev => prev ? { ...prev, selected: -1 } : prev);
      return;
    }
    if (state.selected === -1) return;
    if (e.key === 'ArrowLeft' && state.selected > 0) {
      handleTileClick(state.selected - 1);
    } else if (e.key === 'ArrowRight' && state.selected < state.current.length - 1) {
      handleTileClick(state.selected + 1);
    }
  }, [state, handleTileClick]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleShare = useCallback(async () => {
    if (!state || !state.puzzle) return;
    const score = state.won ? `${state.attempts}/${state.maxAttempts}` : `X/${state.maxAttempts}`;
    const text = shareOrderleText(state.history, puzzleIdx, score, state.puzzle.rule, state.optimal);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [state, puzzleIdx]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--ol-ink-soft)' }}>
        <span className="font-bold text-sm">Loading puzzle...</span>
      </div>
    );
  }

  if (!state || !state.puzzle) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--ol-ink-soft)' }}>
        <span className="font-bold text-sm">Puzzle not found.</span>
      </div>
    );
  }

  const puzzle = state.puzzle;
  const lastFb = state.history[state.history.length - 1] || null;

  return (
    <div>
      {/* Resume sticker */}
      {resumed && <ResumeBanner date={`${state.attempts} swap${state.attempts === 1 ? '' : 's'} in`} accent="var(--ol-lime)" />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-black m-0 flex items-center gap-2"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--ol-ink)' }}>
            ORDERLE
            <span className="text-xs px-2 py-0.5 font-bold"
              style={{
                background: 'var(--ol-lime)',
                color: 'var(--ol-ink)',
                border: '2px solid var(--ol-ink)',
                borderRadius: '4px',
                transform: 'rotate(-1deg)',
              }}>
              {puzzle.category}{puzzle.reverse ? ' · REVERSED' : ''}
            </span>
          </h2>
        </div>
        <span className="text-xs font-bold"
          style={{
            background: 'var(--ol-accent)',
            color: '#fff',
            padding: '3px 10px',
            border: '2px solid var(--ol-ink)',
            borderRadius: '4px',
            transform: 'rotate(1deg)',
          }}>
          {state.maxAttempts} tries
        </span>
      </div>

      {/* Hint line */}
      <p className="text-sm font-bold mb-4" style={{ color: 'var(--ol-ink-soft)' }}>
        {state.over
          ? (state.won ? `Solved in ${state.attempts} swap${state.attempts === 1 ? '' : 's'}!` : `The sequence was: ${state.labels.join(' → ')}`)
          : state.selected !== -1
            ? 'Now tap the tile to swap with. (Esc cancels.)'
            : `${state.maxAttempts} tries. Tap two tiles to swap them.`}
      </p>

      {/* Board */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {state.current.map((id, i) => {
          let tileClass = '';
          if (state.over && !state.won) {
            // show answer
            tileClass = 'tile answer-tile';
          } else if (i === state.selected) {
            tileClass = 'tile selected';
          } else if (lastFb && lastFb[i].state === 'green') {
            tileClass = 'tile green';
          } else if (lastFb && lastFb[i].state === 'yellow') {
            tileClass = 'tile yellow';
          }

          let bg = 'var(--ol-panel)';
          if (tileClass.includes('green')) bg = '#39c96b';
          else if (tileClass.includes('yellow')) bg = '#ffc93c';
          if (tileClass.includes('selected')) bg = 'var(--ol-lime)';
          if (tileClass.includes('answer-tile')) bg = 'var(--ol-panel)';

          return (
            <motion.button
              key={i}
              initial={state.over && !state.won ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.09 }}
              onClick={() => handleTileClick(i)}
              disabled={state.over}
              style={{
                background: bg,
                border: '2.5px solid var(--ol-ink)',
                borderRadius: '12px',
                padding: '10px 16px',
                fontWeight: 800,
                fontSize: '13px',
                color: 'var(--ol-ink)',
                boxShadow: state.over ? 'none' : '4px 4px 0 var(--ol-ink)',
                cursor: state.over ? 'default' : 'pointer',
                minWidth: '100px',
                textAlign: 'center',
                position: 'relative',
                transform: tileClass.includes('selected') ? 'translate(1px, 1px)' : 'none',
              }}
            >
              {state.labels[id]}
              {lastFb && lastFb[i].state === 'yellow' && lastFb[i].arrow && !state.over && (
                <span style={{ marginLeft: '6px', fontWeight: 900 }}>
                  {lastFb[i].arrow === 'earlier' ? '◀' : '▶'}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Attempt history */}
      {state.history.length > 0 && (
        <div className="flex flex-col items-center gap-1 mb-4">
          {state.history.map((fb, ri) => (
            <div key={ri} className="flex gap-1">
              {fb.map((f, fi) => (
                <span key={fi}
                  style={{
                    width: '28px', height: '28px',
                    background: f.state === 'green' ? '#39c96b' : '#ffc93c',
                    border: '2px solid var(--ol-ink)',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 900,
                    color: 'var(--ol-ink)',
                  }}>
                  {f.arrow === 'earlier' ? '◀' : f.arrow === 'later' ? '▶' : ''}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Reveal */}
      {state.over && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--ol-panel)',
            border: '3px solid var(--ol-ink)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '6px 6px 0 var(--ol-ink)',
            position: 'relative',
          }}
        >
          <span style={{
            position: 'absolute', top: '-14px', right: '16px',
            background: state.won ? 'var(--ol-lime)' : 'var(--ol-accent)',
            color: 'var(--ol-ink)',
            padding: '4px 12px',
            border: '2.5px solid var(--ol-ink)',
            borderRadius: '6px',
            fontWeight: 900,
            fontSize: '12px',
            transform: 'rotate(2deg)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {state.won ? 'SOLVED ✓' : 'ANSWER'}
          </span>
          <div style={{
            display: 'inline-block',
            background: 'var(--ol-lime)',
            padding: '2px 10px',
            border: '2px solid var(--ol-ink)',
            borderRadius: '4px',
            fontWeight: 800,
            fontSize: '11px',
            transform: 'rotate(-1deg)',
            marginBottom: '8px',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            the rule
          </div>
          <h3 className="text-lg font-black m-0 mt-1 mb-2" style={{ color: 'var(--ol-ink)' }}>{puzzle.rule}</h3>
          <p className="text-sm font-bold leading-relaxed m-0 mb-2" style={{ color: 'var(--ol-ink-soft)' }}>{puzzle.reveal}</p>
          <p className="text-xs font-bold m-0 mb-3" style={{ color: 'var(--ol-ink-soft)', fontFamily: "'JetBrains Mono', monospace" }}>
            Optimal play: {state.optimal} swap{state.optimal === 1 ? '' : 's'}
            {state.won && state.attempts === state.optimal ? ' — you nailed it' : ''}
          </p>
          {puzzle.citation && (
            <a href={puzzle.citation} target="_blank" rel="noopener"
              className="text-xs font-bold underline mb-3 inline-block"
              style={{ color: 'var(--ol-ink-soft)' }}>
              Source
            </a>
          )}
          <div className="flex gap-2 mt-3">
            <button onClick={handleShare}
              style={{
                background: 'var(--ol-ink)',
                color: 'var(--ol-bg)',
                border: '2.5px solid var(--ol-ink)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '13px',
                boxShadow: '3px 3px 0 rgba(0,0,0,0.25)',
                cursor: 'pointer',
              }}>
              {copied ? 'Copied!' : 'Copy share'}
            </button>
            <button onClick={() => setCardOpen(true)}
              style={{
                background: 'var(--ol-accent)',
                color: 'var(--ol-ink)',
                border: '2.5px solid var(--ol-ink)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '13px',
                boxShadow: '3px 3px 0 rgba(0,0,0,0.25)',
                cursor: 'pointer',
              }}>
              Share card
            </button>
            {!practice && (
              <button onClick={() => window.location.reload()}
                style={{
                  background: 'var(--ol-panel)',
                  color: 'var(--ol-ink)',
                  border: '2.5px solid var(--ol-ink)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: '13px',
                  boxShadow: '3px 3px 0 rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                }}>
                Play again (practice)
              </button>
            )}
          </div>
        </motion.div>
      )}
      {state.over && <AdSlot slot="orderle-results" minHeight={110} />}

      <ShareCardModal
        open={cardOpen}
        onClose={() => setCardOpen(false)}
        options={{
          gameId: `orderle-${puzzleIdx}`,
          title: 'ORDERLE',
          accentColor: '#39c96b',
          lines: state && state.puzzle
            ? [
                state.won ? `Solved in ${state.attempts} swap${state.attempts === 1 ? '' : 's'}` : "Today's sequence",
                state.puzzle.rule,
                `optimal ${state.optimal}`,
              ]
            : [],
        }}
        shareText={state && state.puzzle
          ? shareOrderleText(
              state.history,
              puzzleIdx,
              state.won ? `${state.attempts}/${state.maxAttempts}` : `X/${state.maxAttempts}`,
              state.puzzle.rule,
              state.optimal,
            )
          : ''}
      />
    </div>
  );
}
