import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import AdSlot from '../components/AdSlot';
import ShareCardModal from '../components/ShareCardModal';
import {
  type FermiState,
  type FermiGuess,
  initFermiState,
  fermiFeedback,
  formatNumber,
  shareFermiText,
} from '../utils/fermiLogic';
import { FERMI_BANK } from '../utils/puzzleGenerator';
import { markPlayed, todayISO } from '../utils/dailyProgress';
import { getTodayUTCStr } from '../utils/dailySeed';
import { loadResume, saveResume } from '../utils/gameResume';
import ResumeBanner from '../components/ResumeBanner';

const LAUNCH_DATE = '2026-08-07';
const DAY_MS = 86400000;

type FermiSaved = {
  idx: number;
  guesses: FermiGuess[];
  attempts: number;
  won: boolean;
  over: boolean;
};

function getTodayIndex(): number {
  const utcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const now = new Date();
  const days = Math.floor((utcDay(now) - utcDay(new Date(LAUNCH_DATE + 'T00:00:00Z'))) / DAY_MS);
  return ((days % FERMI_BANK.length) + FERMI_BANK.length) % FERMI_BANK.length;
}

export default function FermiPage() {
  const [state, setState] = useState<FermiState | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [resumed, setResumed] = useState(false);

  useEffect(() => {
    if (state?.won) markPlayed('fermi', todayISO());
  }, [state?.won]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const idx = getTodayIndex();
    const puzzle = FERMI_BANK[idx];
    const s = initFermiState(puzzle);
    const saved = loadResume<FermiSaved>('fermi', getTodayUTCStr());
    if (saved && saved.idx === idx && Array.isArray(saved.guesses)) {
      s.guesses = saved.guesses;
      s.attempts = saved.attempts;
      s.won = saved.won;
      s.over = saved.over;
      if (!saved.over && saved.attempts > 0) setResumed(true);
    }
    setState(s);
    setLoading(false);
  }, []);

  // Persist in-progress guesses so leaving the site never resets the puzzle.
  useEffect(() => {
    if (!state || !state.puzzle) return;
    saveResume<FermiSaved>('fermi', getTodayUTCStr(), {
      idx: getTodayIndex(),
      guesses: state.guesses,
      attempts: state.attempts,
      won: state.won,
      over: state.over,
    });
  }, [state]);

  useEffect(() => {
    if (!state?.over && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state?.attempts, state?.over]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!state || state.over) return;
    setError('');

    const v = parseFloat(inputVal);
    if (!isFinite(v) || v <= 0) {
      setError('Enter a positive number.');
      return;
    }

    const fb = fermiFeedback(v, state.puzzle!.answer);
    const guess: FermiGuess = { guess: v, fb };
    setState(prev => {
      if (!prev) return prev;
      const attempts = prev.attempts + 1;
      const won = fb.win;
      const over = won || attempts >= prev.maxAttempts;
      return {
        ...prev,
        guesses: [...prev.guesses, guess],
        attempts,
        won,
        over,
      };
    });
    setInputVal('');
  }, [state, inputVal]);

  const handleShare = useCallback(async () => {
    if (!state || !state.puzzle) return;
    const score = state.won ? `${state.attempts}/6` : 'X/6';
    const idx = getTodayIndex();
    const text = shareFermiText(state.guesses, idx, score, state.puzzle.prompt);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [state]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--fm-ink-soft)' }}>
        <span className="font-bold text-sm">Loading puzzle...</span>
      </div>
    );
  }

  if (!state || !state.puzzle) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--fm-ink-soft)' }}>
        <span className="font-bold text-sm">Puzzle not found.</span>
      </div>
    );
  }

  const puzzle = state.puzzle;
  const answer = puzzle.answer;
  const lo = Math.log10(answer) - 2.5;
  const hi = Math.log10(answer) + 2.5;
  const pos = (x: number) => Math.max(2, Math.min(98, (Math.log10(x) - lo) / (hi - lo) * 100));

  return (
    <div>
      {/* Resume sticker */}
      {resumed && <ResumeBanner date={`${state.attempts}/6 guesses in`} accent="var(--fm-orange)" />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black m-0 flex items-center gap-2"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--fm-ink)' }}>
          FERMI
          <span className="text-xs px-2 py-0.5 font-bold"
            style={{
              background: 'var(--fm-orange)',
              color: '#fff',
              border: '2px solid var(--fm-ink)',
              borderRadius: '4px',
              transform: 'rotate(1deg)',
            }}>
            {puzzle.category}
          </span>
        </h2>
        <span className="text-xs font-bold"
          style={{
            background: 'var(--fm-accent)',
            color: '#fff',
            padding: '3px 10px',
            border: '2px solid var(--fm-ink)',
            borderRadius: '4px',
            transform: 'rotate(-1deg)',
          }}>
          6 tries · ±5%
        </span>
      </div>

      {/* Prompt card */}
      <div style={{
        background: 'var(--fm-panel)',
        border: '2.5px solid var(--fm-ink)',
        borderRadius: '12px',
        padding: '18px 20px',
        boxShadow: '4px 4px 0 var(--fm-ink)',
        marginBottom: '16px',
      }}>
        <p className="text-lg font-black m-0 mb-1" style={{ color: 'var(--fm-ink)' }}>{puzzle.prompt}</p>
        <p className="text-sm font-bold m-0" style={{ color: 'var(--fm-ink-soft)', fontFamily: "'JetBrains Mono', monospace" }}>
          {puzzle.units ? `Answer in ${puzzle.units}` : ''}
        </p>
      </div>

      {/* Input form */}
      {!state.over && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={inputVal}
            onChange={e => { setInputVal(e.target.value); setError(''); }}
            placeholder="Your guess..."
            disabled={state.over}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'var(--fm-panel)',
              border: '2.5px solid var(--fm-ink)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontWeight: 700,
              fontSize: '16px',
              color: 'var(--fm-ink)',
              boxShadow: '3px 3px 0 var(--fm-ink)',
              outline: 'none',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
          <button type="submit" data-haptic
            style={{
              flexShrink: 0,
              background: 'var(--fm-ink)',
              color: 'var(--fm-bg)',
              border: '2.5px solid var(--fm-ink)',
              borderRadius: '8px',
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: '14px',
              boxShadow: '3px 3px 0 rgba(0,0,0,0.25)',
              cursor: 'pointer',
            }}>
            Guess
          </button>
        </form>
      )}
      {/* Number pad for mobile */}
      {!state.over && (
        <div className="grid grid-cols-3 gap-2 mb-4 max-w-[320px] mx-auto">
          {['7','8','9','4','5','6','1','2','3','0','.','⌫'].map((key) => (
            <button key={key} data-haptic
              onClick={() => {
                if (key === '⌫') {
                  setInputVal(prev => prev.slice(0, -1));
                } else {
                  setInputVal(prev => prev + key);
                }
              }}
              style={{
                background: 'var(--fm-panel)',
                border: '2.5px solid var(--fm-ink)',
                borderRadius: '8px',
                padding: '10px 0',
                fontWeight: 800,
                fontSize: '18px',
                color: 'var(--fm-ink)',
                boxShadow: '3px 3px 0 var(--fm-ink)',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
              {key}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-sm font-bold mb-3" style={{ color: 'var(--fm-red)' }}>{error}</p>}

      {/* Feedback */}
      {state.guesses.length > 0 && !state.over && (
        (() => {
          const last = state.guesses[state.guesses.length - 1];
          return (
            <div className="text-sm font-bold mb-4" style={{ color: 'var(--fm-ink)' }}>
              {last.fb.direction === 'lower' ? '↓ Lower' : '↑ Higher'}
              {' — about '}{last.fb.times} off
            </div>
          );
        })()
      )}

      {/* Guess history */}
      {state.guesses.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {state.guesses.map((g, i) => (
            <div key={i} className="flex items-center gap-2">
              <span style={{
                width: '28px', height: '28px',
                background: g.fb.color === 'green' ? '#39c96b' : g.fb.color === 'yellow' ? '#ffc93c' : g.fb.color === 'orange' ? '#ff6b35' : '#ff4d4d',
                border: '2px solid var(--fm-ink)',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }} />
              <span className="font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--fm-ink)' }}>
                {formatNumber(g.guess)}
              </span>
              <span className="text-xs font-bold" style={{ color: 'var(--fm-ink-soft)' }}>
                {g.fb.win ? '✓ WIN!' : g.fb.direction === 'lower' ? `↓ ~${g.fb.times}` : `↑ ~${g.fb.times}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Log-scale chart */}
      {state.guesses.length > 0 && (
        <div className="mb-4" style={{ display: 'block' }}>
          <div className="flex justify-between items-center text-[10px] font-bold mb-1"
            style={{ color: 'var(--fm-ink-soft)', fontFamily: "'JetBrains Mono', monospace" }}>
            <span>MIN · {formatNumber(Math.pow(10, lo))}{puzzle.units ? ' ' + puzzle.units : ''}</span>
            <span style={{ opacity: 0.85, letterSpacing: '0.12em' }}>GUESS RANGE · LOG SCALE</span>
            <span>MAX · {formatNumber(Math.pow(10, hi))}{puzzle.units ? ' ' + puzzle.units : ''}</span>
          </div>
          <div style={{
            position: 'relative',
            height: '24px',
            background: 'var(--fm-panel)',
            border: '2px solid var(--fm-ink)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            {/* Answer marker */}
            <div style={{
              position: 'absolute',
              left: `${pos(answer)}%`,
              top: '2px',
              width: '14px',
              height: '14px',
              background: state.over ? 'var(--fm-ink)' : 'var(--fm-panel)',
              border: '2.5px solid var(--fm-ink)',
              borderRadius: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              boxShadow: state.over ? '0 0 0 3px var(--fm-bg)' : 'none',
            }} />
            {/* Guess markers */}
            {state.guesses.map((g, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${pos(g.guess)}%`,
                top: '5px',
                width: '8px',
                height: '8px',
                background: g.fb.color === 'green' ? '#39c96b' : g.fb.color === 'yellow' ? '#ffc93c' : g.fb.color === 'orange' ? '#ff6b35' : '#ff4d4d',
                border: '1.5px solid var(--fm-ink)',
                borderRadius: '50%',
                transform: 'translateX(-50%)',
                zIndex: 5,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Win/lose message */}
      {state.over && (
        <p className="text-sm font-black mb-4" style={{ color: state.won ? '#39c96b' : 'var(--fm-accent)' }}>
          {state.won
            ? `🎯 Solved in ${state.attempts} guess${state.attempts === 1 ? '' : 'es'}!`
            : `Out of tries. The answer was ${formatNumber(answer)}${puzzle.units ? ' ' + puzzle.units : ''}.`}
        </p>
      )}

      {/* Reveal */}
      {state.over && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--fm-panel)',
            border: '3px solid var(--fm-ink)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '6px 6px 0 var(--fm-ink)',
            position: 'relative',
          }}
        >
          <span style={{
            position: 'absolute', top: '-14px', right: '16px',
            background: state.won ? '#39c96b' : 'var(--fm-accent)',
            color: '#fff',
            padding: '4px 12px',
            border: '2.5px solid var(--fm-ink)',
            borderRadius: '6px',
            fontWeight: 900,
            fontSize: '12px',
            transform: 'rotate(2deg)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {state.won ? 'WIN ✓' : 'ANSWER'}
          </span>
          <div style={{
            display: 'inline-block',
            background: 'var(--fm-orange)',
            color: '#fff',
            padding: '2px 10px',
            border: '2px solid var(--fm-ink)',
            borderRadius: '4px',
            fontWeight: 800,
            fontSize: '11px',
            transform: 'rotate(1deg)',
            marginBottom: '8px',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            the answer
          </div>
          <h3 className="text-lg font-black m-0 mt-1 mb-2" style={{ color: 'var(--fm-ink)' }}>
            {formatNumber(puzzle.answer)}{puzzle.units ? ' ' + puzzle.units : ''}
          </h3>
          <p className="text-sm font-bold leading-relaxed m-0 mb-2" style={{ color: 'var(--fm-ink-soft)' }}>{puzzle.reveal}</p>
          {puzzle.citation && (
            <a href={puzzle.citation} target="_blank" rel="noopener"
              className="text-xs font-bold underline mb-3 inline-block"
              style={{ color: 'var(--fm-ink-soft)' }}>
              Source
            </a>
          )}
          <div className="flex gap-2 mt-3">
            <button onClick={handleShare}
              style={{
                background: 'var(--fm-ink)',
                color: 'var(--fm-bg)',
                border: '2.5px solid var(--fm-ink)',
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
                background: 'var(--fm-accent)',
                color: 'var(--fm-ink)',
                border: '2.5px solid var(--fm-ink)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '13px',
                boxShadow: '3px 3px 0 rgba(0,0,0,0.25)',
                cursor: 'pointer',
              }}>
              Share card
            </button>
            <button onClick={() => window.location.reload()}
              style={{
                background: 'var(--fm-panel)',
                color: 'var(--fm-ink)',
                border: '2.5px solid var(--fm-ink)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '13px',
                boxShadow: '3px 3px 0 rgba(0,0,0,0.15)',
                cursor: 'pointer',
              }}>
              Play again
            </button>
          </div>
        </motion.div>
      )}
      {state.over && <AdSlot slot="fermi-results" minHeight={110} />}

      <ShareCardModal
        open={cardOpen}
        onClose={() => setCardOpen(false)}
        options={{
          gameId: `fermi-${getTodayIndex()}`,
          title: 'FERMI',
          accentColor: '#ff6b35',
          lines: state && state.puzzle
            ? [
                state.won ? 'WIN ✓' : 'missed it',
                state.puzzle.prompt,
                `answer: ${formatNumber(state.puzzle.answer)}${state.puzzle.units ? ' ' + state.puzzle.units : ''}`,
              ]
            : [],
        }}
        shareText={state && state.puzzle
          ? shareFermiText(state.guesses, getTodayIndex(), state.won ? `${state.attempts}/6` : 'X/6', state.puzzle.prompt)
          : ''}
      />
    </div>
  );
}
