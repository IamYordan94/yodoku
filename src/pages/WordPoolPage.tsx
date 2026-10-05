import { useState, useEffect, useCallback } from 'react';
import ShareCardModal from '../components/ShareCardModal';
import OnScreenKeyboard from '../components/OnScreenKeyboard';
import ResumeBanner from '../components/ResumeBanner';
import { wordpoolHintText } from '../utils/wordpoolHints';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTodayDateStr, getDailyPuzzleIndex } from '../utils/dailySeed';
import {
  unlockWordPoolLevel,
  getWordPoolUnlockedLevel,
  getWordPoolSessionWords,
  saveWordPoolSessionWords,
  clearWordPoolSessionWords,
  getWordPoolDailyEntry,
  getWordPoolDailyUnlockedLevel,
  completeWordPoolDailyLevel,
  isWordPoolDailyAllDone,
  getWordPoolDailySessionWords,
  saveWordPoolDailySessionWords,
  clearWordPoolDailySessionWords,
  type WPDailyEntry,
  getHintTargetAsync,
  setHintTargetAsync,
  clearHintTargetAsync,
} from '../utils/storage';

type Level = { level: number; name: string; words: string[] };
type Category = { id: string; name: string; levels: Level[] };
type WordPoolData = { categories: Category[] };
type HintState = { word: string; stage: 1 | 2 | 3 | 4 } | null;

function starsFor(hints: number): number {
  if (hints === 0) return 3;
  if (hints <= 2) return 2;
  return 1;
}

function Stars({ n, total = 3 }: { n: number; total?: number }) {
  return (
    <span style={{ letterSpacing: '0.05em' }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ color: i < n ? 'var(--wp-accent-blue-side)' : 'var(--wp-border-dark)', fontSize: '15px' }}>★</span>
      ))}
    </span>
  );
}

function DailyResultsPanel({
  category, date, entry, onShare, shared,
}: {
  category: Category; date: string; entry: WPDailyEntry; onShare: () => void; shared: boolean;
}) {
  const totalHints = category.levels.reduce(
    (sum, lvl) => sum + (entry.levels[String(lvl.level)]?.hintsUsed ?? 0), 0
  );
  const overallStarsN = totalHints === 0 ? 3 : totalHints <= 4 ? 2 : 1;
  const [cardOpen, setCardOpen] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
      <div className="rounded p-6 text-center space-y-2"
        style={{ background: 'var(--wp-surface)', border: '1px solid var(--wp-border)', borderBottom: '3px solid var(--wp-border-dark)' }}>
        <p className="text-3xl m-0">🎉</p>
        <p className="text-base font-black uppercase tracking-widest m-0"
          style={{ color: 'var(--wp-accent-blue-side)', fontFamily: "'JetBrains Mono', monospace" }}>
          Daily Complete!
        </p>
        <p className="text-sm font-semibold m-0" style={{ color: 'var(--wp-text-muted)' }}>
          {category.name} · {date}
        </p>
        <p className="text-xs font-bold mt-2 px-4 py-2 rounded-lg" style={{
          background: '#d9f24b', color: '#141414', border: '2px solid #141414',
          display: 'inline-block', transform: 'rotate(-0.5deg)',
        }}>
          💡 Did you know? Categories narrow progressively — each level teaches a deeper slice of vocabulary.
        </p>
        <div className="pt-1"><Stars n={overallStarsN} /></div>
        <p className="text-xs m-0" style={{ color: 'var(--wp-text-muted)' }}>
          {totalHints === 0 ? 'No hints — flawless!' : `${totalHints} hint${totalHints !== 1 ? 's' : ''} used total`}
        </p>
      </div>

      <div className="rounded overflow-hidden"
        style={{ border: '1px solid var(--wp-border)', borderBottom: '3px solid var(--wp-border-dark)' }}>
        <div className="px-4 py-2" style={{ background: 'var(--wp-dark)', borderBottom: '1px solid var(--wp-dark-2)' }}>
          <span className="text-xs font-black uppercase tracking-widest"
            style={{ color: 'var(--wp-accent-blue)', fontFamily: "'JetBrains Mono', monospace" }}>
            All Levels
          </span>
        </div>
        {category.levels.map((lvl) => {
          const data = entry.levels[String(lvl.level)];
          const hints = data?.hintsUsed ?? 0;
          const wordsFound = data?.words.length ?? 0;
          return (
            <div key={lvl.level} className="px-4 py-3 flex items-center justify-between gap-3"
              style={{ background: 'var(--wp-surface)', borderBottom: '1px solid var(--wp-border)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold m-0"
                  style={{ color: 'var(--wp-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>L{lvl.level}</p>
                <p className="text-sm font-semibold m-0 truncate" style={{ color: 'var(--wp-text)' }}>{lvl.name}</p>
              </div>
              <div className="text-right flex-shrink-0 space-y-0.5">
                <div><Stars n={starsFor(hints)} /></div>
                <p className="text-xs m-0" style={{ color: 'var(--wp-text-muted)' }}>
                  {wordsFound} word{wordsFound !== 1 ? 's' : ''}{hints > 0 ? ` · ${hints} hint${hints !== 1 ? 's' : ''}` : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 justify-center flex-wrap">
        <button onClick={onShare} className="wp-btn-primary">{shared ? '✓ Copied!' : 'Share'}</button>
        <button onClick={() => setCardOpen(true)} className="wp-btn-primary" style={{ background: '#9FC3DA' }}>Share card</button>
      </div>
      <p className="text-xs text-center" style={{ color: 'var(--wp-text-muted)' }}>
        Come back tomorrow for a new category!
      </p>

      <ShareCardModal
        open={cardOpen}
        onClose={() => setCardOpen(false)}
        options={{
          gameId: `wordpool-${date}`,
          title: 'Word Pool',
          accentColor: '#9FC3DA',
          lines: [
            category.name,
            `${'★'.repeat(overallStarsN)}${'☆'.repeat(3 - overallStarsN)} cleared all ${category.levels.length} levels`,
            `Hints used: ${totalHints}`,
          ],
        }}
        shareText={`Word Pool — ${category.name}\n${'★'.repeat(overallStarsN)}${'☆'.repeat(3 - overallStarsN)} Cleared all ${category.levels.length} levels!\nHints used: ${totalHints}\nyodoku.app`}
      />
    </motion.div>
  );
}

export default function WordPoolPage() {
  const { date, categoryId } = useParams();
  const puzzleDate = date ?? getTodayDateStr();
  const isDaily = !categoryId;

  const [data, setData] = useState<WordPoolData | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [input, setInput] = useState('');
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [shared, setShared] = useState(false);
  const [hint, setHint] = useState<HintState>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isDailyComplete, setIsDailyComplete] = useState(false);
  const [dailyEntry, setDailyEntry] = useState<WPDailyEntry>({ levels: {}, unlockedLevel: 1 });
  const [completionSaved, setCompletionSaved] = useState(false);
  const [resumed, setResumed] = useState(false);

  useEffect(() => {
    setInput(''); setMessage(null); setShared(false); setHint(null);
    setHintsUsed(0); setCompletionSaved(false);

    fetch('/data/wordpool-categories.json')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: WordPoolData) => {
        setData(d);
        let cat: Category;
        if (categoryId) {
          cat = d.categories.find((c) => c.id === categoryId) ?? d.categories[0];
        } else {
          cat = d.categories[getDailyPuzzleIndex(puzzleDate, d.categories.length)];
        }
        setCategory(cat);

        if (isDaily) {
          const entry = getWordPoolDailyEntry(puzzleDate);
          setDailyEntry(entry);
          if (isWordPoolDailyAllDone(puzzleDate, cat.levels.length)) {
            setIsDailyComplete(true);
            setLevel(cat.levels[cat.levels.length - 1]);
            setFoundWords([]);
          } else {
            const lvlNum = Math.min(entry.unlockedLevel, cat.levels.length);
            setLevel(cat.levels[lvlNum - 1]);
            const saved = getWordPoolDailySessionWords(puzzleDate, lvlNum);
            setFoundWords(saved);
            if (saved.length > 0) setResumed(true);
          }
        } else {
          const unlocked = getWordPoolUnlockedLevel(cat.id);
          const lvlNum = Math.min(unlocked, cat.levels.length);
          setLevel(cat.levels[lvlNum - 1]);
          const saved = getWordPoolSessionWords(cat.id, lvlNum);
          setFoundWords(saved);
          if (saved.length > 0) setResumed(true);
        }
      })
      .catch(() => {
        setMessage({ text: "Couldn't load the word lists. Check your connection and refresh.", type: 'error' });
      });
  }, [puzzleDate, categoryId]);

  const switchLevel = (lvl: Level) => {
    if (!category) return;
    setLevel(lvl); setMessage(null); setShared(false);
    setHint(null); setInput(''); setHintsUsed(0); setCompletionSaved(false);
    if (isDaily) {
      const entry = getWordPoolDailyEntry(puzzleDate);
      if (entry.levels[String(lvl.level)]) {
        setFoundWords(entry.levels[String(lvl.level)].words);
      } else {
        setFoundWords(getWordPoolDailySessionWords(puzzleDate, lvl.level));
      }
    } else {
      setFoundWords(getWordPoolSessionWords(category.id, lvl.level));
    }
  };

  const handleSubmit = useCallback(() => {
    const word = input.trim().toLowerCase();
    if (!word || !level || !category) return;
    if (foundWords.includes(word)) { setMessage({ text: 'Already found', type: 'error' }); setInput(''); return; }
    if (!level.words.includes(word)) { setMessage({ text: 'Not in this category', type: 'error' }); setInput(''); return; }
    const next = [...foundWords, word];
    setFoundWords(next);
    if (isDaily) saveWordPoolDailySessionWords(puzzleDate, level.level, next);
    else saveWordPoolSessionWords(category.id, level.level, next);
    setInput('');
    setMessage({ text: `✓ ${word}`, type: 'success' });
    if (hint && hint.word === word) {
      setHint(null);
      clearHintTargetAsync('wordpool', `${isDaily ? puzzleDate : category.id}_${level.level}`);
    }
  }, [input, level, category, foundWords, hint, isDaily, puzzleDate]);

  const isComplete = !!(level && foundWords.length === level.words.length);
  const isDailyLevelAlreadySaved = isDaily && !!dailyEntry.levels[String(level?.level)];
  const isReadOnly = isDailyLevelAlreadySaved && !isComplete;

  useEffect(() => {
    if (!isComplete || !category || !level || completionSaved) return;
    setCompletionSaved(true);
    if (isDaily) {
      if (!dailyEntry.levels[String(level.level)]) {
        completeWordPoolDailyLevel(puzzleDate, level.level, foundWords, hintsUsed);
        clearWordPoolDailySessionWords(puzzleDate, level.level);
        const updated = getWordPoolDailyEntry(puzzleDate);
        setDailyEntry(updated);
        if (isWordPoolDailyAllDone(puzzleDate, category.levels.length)) {
          setTimeout(() => setIsDailyComplete(true), 900);
        }
      }
    } else {
      unlockWordPoolLevel(category.id, level.level);
      clearWordPoolSessionWords(category.id, level.level);
    }
  }, [isComplete]);

  // ── Physical keyboard listener ────────────────────────────────────────────
  useEffect(() => {
    if (isComplete || isReadOnly) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Backspace') {
        setInput(prev => prev.slice(0, -1));
        setMessage(null);
      } else if (e.key === 'Enter') {
        handleSubmit();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        setInput(prev => prev + e.key.toLowerCase());
        setMessage(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isComplete, isReadOnly, handleSubmit]);

  const handleHint = async () => {
    if (!level || !category || isReadOnly) return;
    const puzzleId = `${isDaily ? puzzleDate : category.id}_${level.level}`;
    const unfound = level.words.filter((w) => !foundWords.includes(w));
    if (unfound.length === 0) return;
    const stored = await getHintTargetAsync('wordpool', puzzleId);
    let targetWord = stored?.targetWord ?? unfound.slice().sort()[0];
    if (!unfound.includes(targetWord)) targetWord = unfound.slice().sort()[0];
    const hintLevel = stored?.targetWord === targetWord ? stored!.hintLevel : 1;
    setHint({ word: targetWord, stage: hintLevel as 1 | 2 | 3 | 4 });
    setHintsUsed((prev) => prev + 1);
    await setHintTargetAsync('wordpool', puzzleId, targetWord, Math.min(hintLevel + 1, 4));
  };

  const hintText = wordpoolHintText(hint);

  const handleShare = () => {
    if (!category) return;
    let text: string;
    if (isDaily) {
      const entry = getWordPoolDailyEntry(puzzleDate);
      const totalHints = category.levels.reduce(
        (sum, lvl) => sum + (entry.levels[String(lvl.level)]?.hintsUsed ?? 0), 0
      );
      text = [
        `Word Pool — ${category.name}`,
        puzzleDate,
        ...category.levels.map((lvl) => {
          const h = entry.levels[String(lvl.level)]?.hintsUsed ?? 0;
          const s = starsFor(h);
          return `L${lvl.level}: ${'★'.repeat(s)}${'☆'.repeat(3 - s)} ${lvl.name}`;
        }),
        totalHints > 0 ? `💡 ${totalHints} hint${totalHints !== 1 ? 's' : ''} total` : '🎯 No hints!',
        'yodoku.app',
      ].join('\n');
    } else if (level) {
      const s = starsFor(hintsUsed);
      text = [
        `Word Pool — ${category.name}`,
        `L${level.level}: ${level.name}`,
        `${'★'.repeat(s)}${'☆'.repeat(3 - s)}  Found all ${level.words.length} words!`,
        hintsUsed > 0 ? `💡 ${hintsUsed} hint${hintsUsed !== 1 ? 's' : ''} used` : '',
        'yodoku.app',
      ].filter(Boolean).join('\n');
    } else return;
    navigator.clipboard.writeText(text).catch(() => {});
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  if (!data || !category || !level) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-sm font-semibold animate-pulse"
          style={{ color: 'var(--wp-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          Loading puzzle…
        </div>
      </div>
    );
  }

  if (isDaily && isDailyComplete) {
    return (
      <DailyResultsPanel
        category={category}
        date={puzzleDate}
        entry={getWordPoolDailyEntry(puzzleDate)}
        onShare={handleShare}
        shared={shared}
      />
    );
  }

  const remaining = level.words.length - foundWords.length;
  const dailyUnlockedLevel = isDaily ? getWordPoolDailyUnlockedLevel(puzzleDate) : null;

  return (
    <div className="space-y-5">
      {resumed && <ResumeBanner accent="#9FC3DA" />}
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--wp-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            {isDaily ? `Daily · ${puzzleDate}` : 'Category'}
          </span>
          <span className="text-sm font-black uppercase tracking-wide"
            style={{ color: 'var(--wp-accent-blue-side)', fontFamily: "'JetBrains Mono', monospace" }}>
            {category.name}
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {category.levels.map((lvl) => {
            const isActive = lvl.level === level.level;
            const isDone = isDaily
              ? !!dailyEntry.levels[String(lvl.level)]
              : lvl.level < (getWordPoolUnlockedLevel(category.id) ?? 1);
            const isLocked = isDaily
              ? lvl.level > (dailyUnlockedLevel ?? 1)
              : lvl.level > (getWordPoolUnlockedLevel(category.id) ?? 1);
            return (
              <button key={lvl.level} title={lvl.name}
                onClick={() => !isLocked && switchLevel(lvl)}
                disabled={isLocked}
                className={`wp-tab ${isActive ? 'wp-tab-active' : isDone ? 'wp-tab-done' : ''}`}
                style={isLocked ? { opacity: 0.35, cursor: 'not-allowed' } : {}}>
                L{lvl.level}
              </button>
            );
          })}
        </div>

        <p className="text-sm mt-2 m-0" style={{ color: 'var(--wp-text-muted)' }}>
          <span className="font-bold" style={{ color: 'var(--wp-text)' }}>Level {level.level}:</span>{' '}{level.name}
        </p>
        <p className="text-xs mt-1 m-0 font-semibold" style={{ color: 'var(--wp-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          {level.words.length} words —{' '}
          {Object.entries(
            level.words.reduce((acc, w) => { acc[w.length] = (acc[w.length] || 0) + 1; return acc; }, {} as Record<number, number>)
          ).sort(([a], [b]) => Number(a) - Number(b)).map(([len, count]) => `${count}×${len}L`).join(' · ')}
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-lg font-bold m-0" style={{ color: 'var(--wp-text)' }}>
            {foundWords.length} <span style={{ color: 'var(--wp-text-muted)' }}>/</span> {level.words.length}
            <span className="text-sm font-normal ml-2" style={{ color: 'var(--wp-text-muted)' }}>words found</span>
          </p>
          {!isComplete && !isReadOnly && (
            <button onClick={handleHint} className="wp-btn-pink">Hint</button>
          )}
        </div>

        <div className="h-2 rounded-full mb-4 overflow-hidden" style={{ background: 'var(--wp-surface-2)' }}>
          <motion.div className="h-full rounded-full" style={{ background: 'var(--wp-accent-blue)' }}
            initial={false} animate={{ width: `${(foundWords.length / level.words.length) * 100}%` }}
            transition={{ duration: 0.4 }} />
        </div>

        {hintText && (
          <motion.div key={hintText} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="mb-3 px-4 py-2 rounded flex items-center justify-between gap-2"
            style={{ background: 'rgba(232,183,181,0.15)', border: '1px solid var(--wp-accent-pink)',
              color: 'var(--wp-accent-pink-side)', fontSize: '13px', fontWeight: 600 }}>
            <span>💡 {hintText}</span>
            <button onClick={() => setHint(null)}
              style={{ color: 'var(--wp-text-muted)', fontSize: '12px' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--wp-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--wp-text-muted)')}>✕</button>
          </motion.div>
        )}

        {isComplete ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded p-6 space-y-4"
            style={{ background: 'var(--wp-surface)', border: '1px solid var(--wp-border)',
              borderBottom: '3px solid var(--wp-border-dark)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
            <div className="text-center space-y-1">
              <p className="text-2xl m-0">✓</p>
              <p className="text-base font-black uppercase tracking-widest m-0"
                style={{ color: 'var(--wp-accent-blue-side)', fontFamily: "'JetBrains Mono', monospace" }}>
                Level {level.level} Complete!
              </p>
              {isDaily && (
                <p className="text-xs font-semibold m-0" style={{ color: 'var(--wp-text-muted)' }}>
                  {Math.min(Object.keys(dailyEntry.levels).length + 1, category.levels.length)} of {category.levels.length} levels done
                </p>
              )}
            </div>
            <div className="flex items-center justify-center gap-6 py-3 text-center"
              style={{ borderTop: '1px solid var(--wp-border)', borderBottom: '1px solid var(--wp-border)' }}>
              <div>
                <p className="text-xl font-black m-0" style={{ color: 'var(--wp-text)' }}>{level.words.length}</p>
                <p className="text-xs font-semibold m-0" style={{ color: 'var(--wp-text-muted)' }}>Words found</p>
              </div>
              <div>
                <p className="text-xl font-black m-0" style={{ color: 'var(--wp-accent-blue-side)' }}>{hintsUsed}</p>
                <p className="text-xs font-semibold m-0" style={{ color: 'var(--wp-text-muted)' }}>Hints used</p>
              </div>
              <div>
                <Stars n={starsFor(hintsUsed)} />
                <p className="text-xs font-semibold m-0" style={{ color: 'var(--wp-text-muted)' }}>Rating</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {foundWords.map((w, i) => <span key={i} className="wp-word-chip">{w}</span>)}
            </div>
            <div className="flex gap-3 justify-center flex-wrap pt-1">
              {isDaily && level.level < category.levels.length && (
                <button onClick={() => switchLevel(category.levels[level.level])} className="wp-btn-primary" data-haptic>
                  Next Level →
                </button>
              )}
              {isDaily && level.level === category.levels.length && (
                <button onClick={() => setIsDailyComplete(true)} className="wp-btn-primary" data-haptic>
                  See Full Results
                </button>
              )}
              {!isDaily && level.level < category.levels.length && (
                <button onClick={() => { switchLevel(category.levels[level.level]); }} className="wp-btn-primary" data-haptic>
                  Next Level →
                </button>
              )}
              <button onClick={handleShare} className="wp-btn-secondary">
                {shared ? '✓ Copied!' : 'Share'}
              </button>
            </div>
          </motion.div>
        ) : isReadOnly ? (
          <div className="space-y-3">
            <div className="px-4 py-2 rounded text-xs font-semibold"
              style={{ background: 'rgba(159,195,218,0.15)', border: '1px solid var(--wp-accent-blue)',
                color: 'var(--wp-accent-blue-side)' }}>
              ✓ Level completed · {foundWords.length} word{foundWords.length !== 1 ? 's' : ''} found
            </div>
            <div className="flex flex-wrap gap-2">
              {foundWords.map((w, i) => <span key={i} className="wp-word-chip">{w}</span>)}
            </div>
            <button onClick={() => {
              const cur = Math.min(getWordPoolDailyUnlockedLevel(puzzleDate), category.levels.length);
              switchLevel(category.levels[cur - 1]);
            }} className="wp-btn-primary" data-haptic>Go to current level</button>
          </div>
        ) : (
          <>
            {/* Typed word display */}
            <div className="mb-1">
              <div className={`wp-word-display${!input ? ' wp-word-display-placeholder' : ''}`}>
                {input ? input.toUpperCase() : 'Type a word…'}
              </div>
            </div>
            {message && (
              <motion.p key={message.text} initial={{ opacity: 0, x: message.type === 'error' ? -4 : 0 }}
                animate={{ opacity: 1, x: 0 }} className="text-sm font-semibold mb-1 m-0"
                style={{ color: message.type === 'success' ? 'var(--wp-accent-blue-side)' : '#c0443b' }}>
                {message.text}
              </motion.p>
            )}
            {/* QWERTY keyboard */}
            <div className="mb-3">
              <OnScreenKeyboard
                theme="wp"
                onKey={(letter) => { setInput(prev => prev + letter); setMessage(null); }}
                onBackspace={() => { setInput(prev => prev.slice(0, -1)); setMessage(null); }}
                onEnter={handleSubmit}
                enterDisabled={!input.trim()}
                enterLabel="SUBMIT"
              />
            </div>
            {foundWords.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--wp-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>Found words</p>
                <div className="flex flex-wrap gap-2">
                  {foundWords.map((w, i) => <span key={i} className="wp-word-chip">{w}</span>)}
                </div>
              </div>
            )}
            <p className="text-xs m-0" style={{ color: 'var(--wp-text-muted)' }}>
              {remaining} word{remaining !== 1 ? 's' : ''} remaining in this level
            </p>
          </>
        )}
      </section>

      {!isComplete && !isReadOnly && (
        <section>
          <div className="wp-card" style={{ borderLeft: '3px solid var(--wp-accent-blue)' }}>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--wp-accent-blue-side)', fontFamily: "'JetBrains Mono', monospace" }}>
              How to play
            </h2>
            <p className="text-sm leading-relaxed mb-2 m-0" style={{ color: 'var(--wp-text-muted)' }}>
              Type words that belong to the current category constraint. Each level narrows the category — from broad to very specific.
            </p>
            <p className="text-sm m-0" style={{ color: 'var(--wp-text-muted)' }}>
              Find all words in a level to unlock the next. Use <strong style={{ color: 'var(--wp-text)' }}>Hint</strong> to reveal letters of a word you&apos;re missing — each hint uncovers one more position.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
