import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  type SevenLettersBoard,
  scoreWord,
  isPangram,
  tierFor,
  tierCutoffs,
  wordsToNextTier,
  TIER_LADDER,
  shareSevenText,
} from '../utils/sevenLettersLogic';
import { getTodayIndex } from './SevenLettersHome';
import ShareCardModal from '../components/ShareCardModal';
import ResumeBanner from '../components/ResumeBanner';

const STORAGE_KEY = 'yodoku_seven_letters';

interface SavedSevenState {
  [date: string]: { foundWords: string[] };
}

function getSavedWords(date: string): string[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    const data: SavedSevenState = s ? JSON.parse(s) : {};
    return data[date]?.foundWords ?? [];
  } catch {
    return [];
  }
}

function saveWords(date: string, foundWords: string[]) {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    const data: SavedSevenState = s ? JSON.parse(s) : {};
    data[date] = { foundWords };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

interface SevenLettersPageProps {
  practice?: boolean;
}

export default function SevenLettersPage({ practice = false }: SevenLettersPageProps) {
  const [boards, setBoards] = useState<SevenLettersBoard[] | null>(null);
  const [board, setBoard] = useState<SevenLettersBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string; kind: 'ok' | 'dup' | 'short' | 'bad' | 'pangram' } | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [boardIdx, setBoardIdx] = useState(0);
  const [resumed, setResumed] = useState(false);
  const [searchParams] = useSearchParams();
  const boardParam = searchParams.get('board');
  const [archive, setArchive] = useState(false);

  // Load board data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/data/seven-boards.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setBoards(json.boards);
      } catch {
        if (!cancelled) setError('Could not load the daily board.');
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Pick today's (or a random practice / archive) board and restore progress
  useEffect(() => {
    if (!boards || boards.length === 0) return;
    const requested = boardParam !== null ? Number(boardParam) : NaN;
    const isArchive = Number.isInteger(requested) && requested >= 0 && requested < boards.length;
    const idx = isArchive
      ? requested
      : practice
        ? Math.floor(Math.random() * boards.length)
        : getTodayIndex() % boards.length;
    setArchive(isArchive);
    const b = boards[idx];
    setBoard(b);
    setBoardIdx(idx);
    if (!practice && !isArchive) {
      const savedWords = getSavedWords(getTodayDateStr());
      setFoundWords(savedWords);
      if (savedWords.length > 0) setResumed(true);
    } else {
      setFoundWords([]);
    }
  }, [boards, practice, boardParam]);

  function getTodayDateStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  const score = useMemo(
    () => foundWords.reduce((sum, w) => sum + scoreWord(w, board!), 0),
    [foundWords, board]
  );
  const cutoffs = board ? tierCutoffs(board.maxScore) : { good: 0, solid: 0, great: 0, amazing: 0, genius: 0, queen: 0 };
  const tier = tierFor(score, cutoffs);
  const toNext = board ? wordsToNextTier(score, board) : null;

  const handleSubmit = useCallback(() => {
    if (!board) return;
    const w = input.trim().toLowerCase();
    setInput('');
    if (!w) return;
    if (w.length < 3) {
      setMessage({ text: 'Too short — at least 3 letters.', kind: 'short' });
    } else if (!w.includes(board.center)) {
      setMessage({ text: `Missing the center letter "${board.center.toUpperCase()}".`, kind: 'bad' });
    } else if ([...w].some((c) => !board.letters.includes(c))) {
      setMessage({ text: `"${w.toUpperCase()}" uses letters not on the board.`, kind: 'bad' });
    } else if (foundWords.includes(w)) {
      setMessage({ text: `Already found ${w.toUpperCase()}.`, kind: 'dup' });
    } else if (!board.words.includes(w)) {
      setMessage({ text: `"${w.toUpperCase()}" is not in our word list.`, kind: 'bad' });
    } else {
      const next = [...foundWords, w];
      setFoundWords(next);
      if (!practice && !archive) saveWords(getTodayDateStr(), next);
      if (isPangram(w, board)) {
        setMessage({ text: `PANGRAM! ${w.toUpperCase()} +7 🎉`, kind: 'pangram' });
      } else {
        const pts = scoreWord(w, board);
        setMessage({ text: `+${pts} — ${w.toUpperCase()}`, kind: 'ok' });
      }
    }
    setTimeout(() => setMessage(null), 2200);
  }, [input, board, foundWords, practice, archive]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  }, [handleSubmit]);

  const handleShare = useCallback(async () => {
    if (!board) return;
    const text = shareSevenText(foundWords, boardIdx, score, board.maxScore, board);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [board, foundWords, score, boardIdx]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--sv-ink-soft)' }}>
        <span className="font-bold text-sm">Loading board...</span>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--sv-ink-soft)' }}>
        <span className="font-bold text-sm">{error ?? 'Board not found.'}</span>
      </div>
    );
  }

  const sortedFound = [...foundWords].sort((a, b) => b.length - a.length || a.localeCompare(b));

  return (
    <div>
      {resumed && <ResumeBanner date={`${foundWords.length} words found`} accent="var(--sv-accent)" />}
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black m-0 flex items-center gap-2"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--sv-ink)' }}>
          7 LETTERS
          <span className="text-xs px-2 py-0.5 font-bold"
            style={{
              background: 'var(--sv-accent)',
              color: '#fff',
              border: '2px solid var(--sv-ink)',
              borderRadius: '4px',
              transform: 'rotate(-1deg)',
            }}>
            {practice ? 'practice' : archive ? 'archive' : 'daily'}
          </span>
        </h2>
        <span className="text-xs font-bold"
          style={{
            background: 'var(--sv-accent)',
            color: '#fff',
            padding: '3px 10px',
            border: '2px solid var(--sv-ink)',
            borderRadius: '4px',
            transform: 'rotate(1deg)',
          }}>
          {score}/{board.maxScore} pts
        </span>
      </div>

      {/* Letter tiles */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {board.letters.map((l) => {
          const isCenter = l === board.center;
          return (
            <button
              key={l}
              onClick={() => setInput((prev) => prev + l)}
              style={{
                background: isCenter ? 'var(--sv-accent)' : 'var(--sv-panel)',
                border: '2.5px solid var(--sv-ink)',
                borderRadius: '12px',
                width: '48px', height: '52px',
                fontWeight: 900,
                fontSize: '20px',
                textTransform: 'uppercase',
                color: isCenter ? '#fff' : 'var(--sv-ink)',
                boxShadow: '4px 4px 0 var(--sv-ink)',
                cursor: 'pointer',
              }}
              aria-label={isCenter ? `${l} (center letter)` : l}
            >
              {l}
            </button>
          );
        })}
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z]/g, ''))}
          onKeyDown={handleKeyDown}
          placeholder="Type or tap a word…"
          aria-label="Word input"
          className="flex-1 px-3 py-2 font-black text-sm"
          style={{
            background: 'var(--sv-panel)',
            border: '2.5px solid var(--sv-ink)',
            borderRadius: '8px',
            color: 'var(--sv-ink)',
            outline: 'none',
            minWidth: 0,
          }}
        />
        <button onClick={handleSubmit} data-haptic
          style={{
            background: 'var(--sv-ink)', color: 'var(--sv-bg)',
            border: '2.5px solid var(--sv-ink)', borderRadius: '8px',
            padding: '8px 16px', fontWeight: 700, fontSize: '13px',
            boxShadow: '3px 3px 0 rgba(0,0,0,0.25)', cursor: 'pointer',
          }}>
          Enter
        </button>
      </div>

      {/* Feedback message */}
      <div className="h-6 mb-1">
        {message && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-xs font-black m-0 text-center"
            style={{ color: message.kind === 'ok' || message.kind === 'pangram' ? '#b3870a' : 'var(--sv-ink-soft)' }}>
            {message.text}
          </motion.p>
        )}
      </div>

      {/* Progress / tiers */}
      <div className="mb-4" style={{
        background: 'var(--sv-panel)', border: '2.5px solid var(--sv-ink)',
        borderRadius: '12px', padding: '14px 16px', boxShadow: '4px 4px 0 var(--sv-ink)',
      }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-black" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--sv-ink)' }}>
            {tier.toUpperCase()}
          </span>
          <span className="text-xs font-bold" style={{ color: 'var(--sv-ink-soft)' }}>
            {foundWords.length} words · max {board.maxScore}
          </span>
        </div>
        {/* Tier bar */}
        <div className="relative h-5 rounded overflow-hidden"
          style={{ background: 'var(--sv-bg)', border: '2px solid var(--sv-ink)' }}>
          <div className="absolute inset-y-0 left-0 transition-all"
            style={{
              width: `${Math.min(100, (score / board.maxScore) * 100)}%`,
              background: 'var(--sv-accent)',
            }} />
          {TIER_LADDER.map((t) => (
            <div key={t.key} className="absolute inset-y-0" style={{ left: `${t.pct * 100}%`, width: '2px', background: 'var(--sv-ink)', opacity: 0.5 }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--sv-ink-soft)' }}>
          {TIER_LADDER.map((t) => (
            <span key={t.key} style={{ opacity: score >= cutoffs[t.key] ? 1 : 0.55 }}>
              {t.label} {cutoffs[t.key]}
            </span>
          ))}
        </div>
        {toNext ? (
          <p className="text-xs font-bold m-0 mt-2" style={{ color: 'var(--sv-ink)' }}>
            <span style={{ color: '#b3870a' }}>{toNext.words} word{toNext.words === 1 ? '' : 's'}</span> to <strong>{toNext.label}</strong>
            <span style={{ color: 'var(--sv-ink-soft)' }}> · {toNext.points} pts away</span>
          </p>
        ) : (
          <p className="text-xs font-black m-0 mt-2" style={{ color: '#b3870a' }}>🐝 Queen Bee — every word found!</p>
        )}
      </div>

      {/* Found words */}
      {sortedFound.length > 0 && (
        <div className="mb-4" style={{
          background: 'var(--sv-panel)', border: '2.5px solid var(--sv-ink)',
          borderRadius: '12px', padding: '14px 16px', boxShadow: '4px 4px 0 var(--sv-ink)',
        }}>
          <h3 className="text-xs font-black uppercase tracking-widest m-0 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--sv-ink)' }}>
            Your words ({sortedFound.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {sortedFound.map((w) => (
              <span key={w}
                style={{
                  padding: '3px 8px',
                  background: isPangram(w, board) ? 'var(--sv-accent)' : 'var(--sv-bg)',
                  border: '2px solid var(--sv-ink)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'var(--sv-ink)',
                }}>
                {w}{isPangram(w, board) ? ' ★' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Done state */}
      {score >= cutoffs.genius && !practice && !archive && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-5 relative"
          style={{
            background: 'var(--sv-panel)', border: '3px solid var(--sv-ink)',
            borderRadius: '12px', boxShadow: '6px 6px 0 var(--sv-ink)',
          }}>
          <span style={{
            position: 'absolute', top: '-14px', right: '16px',
            background: 'var(--sv-accent)', color: '#fff',
            padding: '4px 12px', border: '2.5px solid var(--sv-ink)',
            borderRadius: '6px', fontWeight: 900, fontSize: '12px',
            transform: 'rotate(2deg)', fontFamily: "'JetBrains Mono', monospace",
          }}>
            {tier.toUpperCase()} ✓
          </span>
          <p className="text-sm font-bold m-0 mb-3" style={{ color: 'var(--sv-ink)' }}>
            You reached {tier} with {foundWords.length} words and {score}/{board.maxScore} points.
          </p>
          <button onClick={() => setShowAnswers(!showAnswers)}
            style={{
              background: 'var(--sv-panel)', color: 'var(--sv-ink)',
              border: '2.5px solid var(--sv-ink)', borderRadius: '8px',
              padding: '8px 16px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
            }}>
            {showAnswers ? 'Hide answers' : 'Show all answers'}
          </button>
        </motion.div>
      )}

      {showAnswers && (
        <div className="mb-4 p-4" style={{
          background: 'var(--sv-panel)', border: '2.5px solid var(--sv-ink)',
          borderRadius: '12px', boxShadow: '4px 4px 0 var(--sv-ink)',
        }}>
          <div className="flex flex-wrap gap-1.5">
            {board.words.filter((w) => !foundWords.includes(w)).map((w) => (
              <span key={w}
                style={{
                  padding: '3px 8px', background: 'var(--sv-bg)',
                  border: '2px dashed var(--sv-ink)', borderRadius: '6px',
                  fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.7,
                  color: 'var(--sv-ink)',
                }}>
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button onClick={handleShare}
          style={{
            background: 'var(--sv-ink)', color: 'var(--sv-bg)',
            border: '2.5px solid var(--sv-ink)', borderRadius: '8px',
            padding: '8px 16px', fontWeight: 700, fontSize: '13px',
            boxShadow: '3px 3px 0 rgba(0,0,0,0.25)', cursor: 'pointer',
          }}>
          {copied ? 'Copied!' : 'Copy share'}
        </button>
        <button onClick={() => setCardOpen(true)}
          style={{
            background: 'var(--sv-accent)', color: 'var(--sv-ink)',
            border: '2.5px solid var(--sv-ink)', borderRadius: '8px',
            padding: '8px 16px', fontWeight: 700, fontSize: '13px',
            boxShadow: '3px 3px 0 rgba(0,0,0,0.25)', cursor: 'pointer',
          }}>
          Share card
        </button>
        {!practice && (
          <button onClick={() => window.location.reload()}
            style={{
              background: 'var(--sv-panel)', color: 'var(--sv-ink)',
              border: '2.5px solid var(--sv-ink)', borderRadius: '8px',
              padding: '8px 16px', fontWeight: 700, fontSize: '13px',
              boxShadow: '3px 3px 0 rgba(0,0,0,0.15)', cursor: 'pointer',
            }}>
            Practice mode
          </button>
        )}
      </div>

      <ShareCardModal
        open={cardOpen}
        onClose={() => setCardOpen(false)}
        options={{
          gameId: `seven-letters-${boardIdx}`,
          title: '7 Letters',
          accentColor: '#e7b10a',
          lines: [
            `Board #${boardIdx} — ${foundWords.length}/${board?.words.length ?? 0} words found`,
            `Score ${score}/${board?.maxScore ?? 0}${board ? ` — ${tierFor(score, tierCutoffs(board.maxScore))}` : ''}`,
            ...(foundWords.length ? [`Longest: ${[...foundWords].sort((a, b) => b.length - a.length)[0].toUpperCase()}`] : []),
          ],
        }}
        shareText={board ? shareSevenText(foundWords, boardIdx, score, board.maxScore, board) : ''}
      />
    </div>
  );
}
