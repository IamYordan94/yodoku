import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdSlot from '../components/AdSlot';
import ShareCardModal from '../components/ShareCardModal';
import ResumeBanner from '../components/ResumeBanner';
import type { QuizBank, DailyQuestion } from '../utils/quizLogic';
import {
  CATEGORY_META,
  buildDailyQuiz,
  scoreQuiz,
  verdict,
  shareQuizText,
  getQuizNumber,
} from '../utils/quizLogic';
import {
  getQuizDone,
  saveQuizDone,
  bumpStreak,
  getStreak,
  getQuizProgress,
  saveQuizProgress,
  clearQuizProgress,
} from '../utils/quizStorage';
import { getTodayUTCStr } from '../utils/dailySeed';

function difficultyDots(d: 1 | 2 | 3): string {
  return '●'.repeat(d) + '○'.repeat(3 - d);
}

export default function QuizPage() {
  const [quiz, setQuiz] = useState<DailyQuestion[] | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [over, setOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [streak, setStreak] = useState(getStreak());
  const [resumed, setResumed] = useState(false);

  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const [date] = useState(() =>
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : getTodayUTCStr()
  );
  const isToday = date === getTodayUTCStr();
  const quizNum = getQuizNumber(date);

  // Load bank + build today's quiz (restore saved answers if already done)
  useEffect(() => {
    let cancelled = false;
    fetch('/data/quiz-bank.json')
      .then((r) => {
        if (!r.ok) throw new Error('bad status');
        return r.json();
      })
      .then((bank: QuizBank) => {
        if (cancelled) return;
        const daily = buildDailyQuiz(bank, date);
        if (daily.length === 0) {
          setLoadError(true);
          return;
        }
        setQuiz(daily);
        const done = getQuizDone(date);
        if (done) {
          setAnswers(done.answers.slice(0, daily.length));
          setOver(true);
        } else {
          const progress = getQuizProgress(date);
          if (progress && progress.answers.some((a) => a !== null)) {
            const restored = progress.answers.slice(0, daily.length);
            while (restored.length < daily.length) restored.push(null);
            setAnswers(restored);
            setQIndex(Math.min(Math.max(progress.qIndex, 0), daily.length - 1));
            setResumed(true);
          } else {
            setAnswers(new Array(daily.length).fill(null));
          }
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const finish = useCallback((finalAnswers: (number | null)[]) => {
    // Only the FIRST completion is stored as the day's result; replays don't overwrite it
    if (!getQuizDone(date)) saveQuizDone(date, finalAnswers);
    if (isToday) setStreak(bumpStreak(date));
    clearQuizProgress();
    setOver(true);
  }, [date, isToday]);

  const handlePick = (optionIdx: number) => {
    if (!quiz || over) return;
    if (answers[qIndex] !== null) return;
    const next = [...answers];
    next[qIndex] = optionIdx;
    setAnswers(next);
    if (qIndex + 1 >= quiz.length) {
      finish(next);
    } else {
      // Persist in-progress so leaving the site doesn't reset the quiz.
      saveQuizProgress(date, next, qIndex);
    }
  };

  const handleNext = () => {
    if (!quiz) return;
    if (qIndex + 1 < quiz.length) {
      setQIndex(qIndex + 1);
      saveQuizProgress(date, answers, qIndex + 1);
    }
  };

  const handleReplay = () => {
    if (!quiz) return;
    clearQuizProgress();
    setResumed(false);
    setAnswers(new Array(quiz.length).fill(null));
    setQIndex(0);
    setOver(false);
  };

  const handleShare = async () => {
    if (!quiz) return;
    const score = scoreQuiz(quiz, answers);
    const results = quiz.map((q, i) => (answers[i] === null ? null : answers[i] === q.answer));
    const text = shareQuizText(results, quizNum, score, quiz.length);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard blocked — still show the text in a prompt-less fallback state
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--qz-ink-soft)' }}>
        <span className="font-bold text-sm">The quiz couldn't load.</span>
        <Link to="/quiz" className="text-sm font-bold underline" style={{ color: 'var(--qz-ink)' }}>Back</Link>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--qz-ink-soft)' }}>
        <span className="font-bold text-sm">Loading today's quiz...</span>
      </div>
    );
  }

  // ── Results screen ─────────────────────────────────────────────────────────
  if (over) {
    const score = scoreQuiz(quiz, answers);
    const results = quiz.map((q, i) => (answers[i] === null ? null : answers[i] === q.answer));
    const grid = results.map((r) => (r === true ? '🟩' : r === false ? '🟥' : '⬜')).join('');

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4 pt-4">
        <span className="text-xs font-black uppercase tracking-widest px-3 py-1"
          style={{ background: 'var(--qz-yellow)', color: 'var(--qz-ink)', border: '2px solid var(--qz-ink)', borderRadius: '4px', transform: 'rotate(-1deg)', fontFamily: "'JetBrains Mono', monospace" }}>
          quiz #{quizNum} complete
        </span>

        <h2 className="text-5xl font-black m-0" style={{ color: 'var(--qz-ink)', fontFamily: "'JetBrains Mono', monospace" }}>
          {score}/{quiz.length}
        </h2>

        <p className="text-base font-bold m-0 text-center max-w-[420px]" style={{ color: 'var(--qz-ink-soft)' }}>
          {verdict(score, quiz.length)}
        </p>

        <p className="text-sm font-black m-0" style={{ color: 'var(--qz-ink)', fontFamily: "'JetBrains Mono', monospace" }}>
          🔥 Streak: {streak} day{streak === 1 ? '' : 's'}
        </p>

        <div
          style={{
            background: 'var(--qz-panel)',
            border: '3px solid var(--qz-ink)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '6px 6px 0 var(--qz-ink)',
            width: 'min(520px, 92%)',
          }}
        >
          <p className="text-center text-xl font-black m-0 mb-3 tracking-[0.2em]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {grid}
          </p>

          <div className="flex flex-col gap-2">
            {quiz.map((q, i) => {
              const correct = answers[i] === q.answer;
              const cat = CATEGORY_META[q.category];
              return (
                <div key={q.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm font-bold"
                    style={{ color: correct ? 'var(--qz-ink)' : 'var(--qz-ink-soft)' }}>
                    <span style={{ width: '18px' }}>{correct ? '🟩' : '🟥'}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>{cat ? cat.emoji : '❓'}</span>
                    <span className="truncate">{q.question}</span>
                  </div>
                  {!correct && q.explanation && (
                    <p className="text-[12px] font-semibold m-0" style={{ color: 'var(--qz-ink-soft)', paddingLeft: '26px', lineHeight: 1.5 }}>
                      💡 <strong style={{ color: 'var(--qz-ink)' }}>{q.options[q.answer]}</strong> — {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <button onClick={handleShare}
              style={{
                background: 'var(--qz-ink)',
                color: 'var(--qz-bg)',
                border: '2.5px solid var(--qz-ink)',
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
                background: 'var(--qz-accent)',
                color: 'var(--qz-ink)',
                border: '2.5px solid var(--qz-ink)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '13px',
                boxShadow: '3px 3px 0 rgba(0,0,0,0.25)',
                cursor: 'pointer',
              }}>
              Share card
            </button>
            <button onClick={handleReplay}
              style={{
                background: 'var(--qz-panel)',
                color: 'var(--qz-ink)',
                border: '2.5px solid var(--qz-ink)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '13px',
                boxShadow: '3px 3px 0 rgba(0,0,0,0.15)',
                cursor: 'pointer',
              }}>
              Replay
            </button>
            <Link to="/" style={{
              background: 'var(--qz-panel)',
              color: 'var(--qz-ink)',
              border: '2.5px solid var(--qz-ink)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
              boxShadow: '3px 3px 0 rgba(0,0,0,0.15)',
            }}>
              ← Hub
            </Link>
          </div>
        </div>

        <AdSlot slot="quiz-results" minHeight={110} />

        <ShareCardModal
          open={cardOpen}
          onClose={() => setCardOpen(false)}
          options={{
            gameId: `quiz-${quizNum}`,
            title: 'Quiz Master',
            accentColor: '#8b5cf6',
            lines: [
              `${score}/${quiz.length} — ${verdict(score, quiz.length)}`,
              `🔥 ${streak} day${streak === 1 ? '' : 's'} streak`,
              grid,
            ],
          }}
          shareText={shareQuizText(results, quizNum, score, quiz.length)}
        />
      </motion.div>
    );
  }

  // ── Playing screen ─────────────────────────────────────────────────────────
  const q = quiz[qIndex];
  const picked = answers[qIndex];
  const answered = picked !== null;
  const cat = CATEGORY_META[q.category];

  return (
    <div>
      {/* Resume sticker — shown when saved in-progress answers were restored */}
      {resumed && <ResumeBanner accent="#ffc93c" />}

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-black m-0 flex items-center gap-2"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--qz-ink)' }}>
            QUIZ MASTER
          </h2>
          {cat && (
            <span className="text-xs px-2 py-0.5 font-bold"
              style={{
                background: 'var(--qz-yellow)',
                color: 'var(--qz-ink)',
                border: '2px solid var(--qz-ink)',
                borderRadius: '4px',
                transform: 'rotate(-1deg)',
              }}>
              {cat.emoji} {cat.label}
            </span>
          )}
        </div>
        <span className="text-xs font-bold"
          style={{
            background: 'var(--qz-accent)',
            color: '#fff',
            padding: '3px 10px',
            border: '2px solid var(--qz-ink)',
            borderRadius: '4px',
            transform: 'rotate(1deg)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
          Q {qIndex + 1}/{quiz.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4" style={{ height: '8px', background: 'var(--qz-panel)', border: '2px solid var(--qz-ink)', borderRadius: '4px', overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${((qIndex + (answered ? 1 : 0)) / quiz.length) * 100}%` }}
          transition={{ duration: 0.2 }}
          style={{ height: '100%', background: 'var(--qz-accent)' }}
        />
      </div>

      {/* Question card */}
      <div style={{
        background: 'var(--qz-panel)',
        border: '2.5px solid var(--qz-ink)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '6px 6px 0 var(--qz-ink)',
        marginBottom: '16px',
      }}>
        <p className="text-[11px] font-black uppercase tracking-widest m-0 mb-2"
          style={{ color: 'var(--qz-ink-soft)', fontFamily: "'JetBrains Mono', monospace" }}>
          {difficultyDots(q.difficulty)}
        </p>
        <h3 className="text-lg md:text-xl font-black leading-snug m-0" style={{ color: 'var(--qz-ink)' }}>
          {q.question}
        </h3>
        {q.hint && !answered && (
          <p className="text-xs font-semibold m-0 mt-2" style={{ color: 'var(--qz-ink-soft)' }}>
            Hint: {q.hint}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2 mb-4">
        {q.options.map((opt, i) => {
          let bg = 'var(--qz-panel)';
          let borderColor = 'var(--qz-ink)';
          if (answered) {
            if (i === q.answer) bg = 'var(--qz-green)';
            else if (i === picked) bg = 'var(--qz-red)';
            else {
              bg = 'var(--qz-panel)';
              borderColor = 'var(--qz-ink-soft)';
            }
          }
          return (
            <motion.button
              key={i}
              whileTap={answered ? undefined : { scale: 0.985 }}
              onClick={() => handlePick(i)}
              disabled={answered}
              data-haptic
              style={{
                background: bg,
                border: `2.5px solid ${borderColor}`,
                borderRadius: '10px',
                padding: '12px 16px',
                fontWeight: 700,
                fontSize: '15px',
                color: 'var(--qz-ink)',
                textAlign: 'left',
                boxShadow: answered ? 'none' : '4px 4px 0 var(--qz-ink)',
                cursor: answered ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                opacity: answered && i !== q.answer && i !== picked ? 0.55 : 1,
              }}
            >
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 800,
                width: '22px',
                height: '22px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--qz-ink)',
                borderRadius: '4px',
                background: 'var(--qz-bg)',
                flexShrink: 0,
                fontSize: '11px',
              }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
              {answered && i === q.answer && <span style={{ marginLeft: 'auto' }}>✓</span>}
              {answered && i === picked && i !== q.answer && <span style={{ marginLeft: 'auto' }}>✗</span>}
            </motion.button>
          );
        })}
      </div>

      {/* Teaching explanation — shown when the player got it wrong */}
      {answered && picked !== q.answer && q.explanation && (
        <div style={{
          background: 'var(--qz-panel)',
          border: '2.5px solid var(--qz-ink)',
          borderLeft: '6px solid var(--qz-accent)',
          borderRadius: '10px',
          padding: '12px 14px',
          marginBottom: '16px',
        }}>
          <p className="text-[11px] font-black uppercase tracking-widest m-0 mb-1"
            style={{ color: 'var(--qz-ink-soft)', fontFamily: "'JetBrains Mono', monospace" }}>
            the answer
          </p>
          <p className="text-sm font-bold m-0" style={{ color: 'var(--qz-ink)', lineHeight: 1.5 }}>
            <strong>{q.options[q.answer]}</strong> — {q.explanation}
          </p>
        </div>
      )}

      {/* Next / finish */}
      {answered && qIndex + 1 < quiz.length && (
        <div className="flex justify-end">
          <button onClick={handleNext} data-haptic
            style={{
              background: 'var(--qz-ink)',
              color: 'var(--qz-bg)',
              border: '2.5px solid var(--qz-ink)',
              borderRadius: '8px',
              padding: '10px 22px',
              fontWeight: 700,
              fontSize: '14px',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.25)',
              cursor: 'pointer',
            }}>
            Next →
          </button>
        </div>
      )}
      {answered && qIndex + 1 >= quiz.length && !over && (
        <div className="flex justify-end">
          <button onClick={() => finish(answers)} data-haptic
            style={{
              background: 'var(--qz-accent)',
              color: '#fff',
              border: '2.5px solid var(--qz-ink)',
              borderRadius: '8px',
              padding: '10px 22px',
              fontWeight: 700,
              fontSize: '14px',
              boxShadow: '4px 4px 0 var(--qz-accent-side)',
              cursor: 'pointer',
            }}>
            See results →
          </button>
        </div>
      )}
    </div>
  );
}
