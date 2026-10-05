import { useState } from 'react';
import { Link } from 'react-router-dom';
import PastPuzzlesLink from '../components/PastPuzzlesLink';
import { CATEGORY_META, QUIZ_PER_DAY, getQuizNumber } from '../utils/quizLogic';
import { getStreak } from '../utils/quizStorage';
import { getTodayUTCStr } from '../utils/dailySeed';

export default function QuizHome() {
  const date = getTodayUTCStr();
  const num = getQuizNumber(date);
  const streak = getStreak();
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--qz-bg)', color: 'var(--qz-text)' }}>
      <header className="sticky top-0 z-20 px-4 flex items-center justify-between"
        style={{ background: 'var(--qz-nav)', borderBottom: '2.5px solid var(--qz-ink)', minHeight: '52px' }}>
        <Link to="/" className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
          ← Hub
        </Link>
        <span className="text-sm font-black uppercase tracking-widest flex items-center gap-2"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <span style={{ color: '#8b5cf6' }}>QUIZ MASTER</span>
          <span className="text-[10px] px-2 py-0.5 font-bold rounded"
            style={{ background: '#ffc93c', color: '#141414', border: '2px solid #141414' }}>
            trivia
          </span>
        </span>
        <div style={{ width: '48px' }} />
      </header>

      <div className="flex items-center justify-center px-[18px] py-[48px]">
        <section className="w-full max-w-[520px] flex flex-col items-center gap-[14px] text-center">

          {/* Title block */}
          <div className="w-full max-w-[480px] p-6 flex items-center justify-center"
            style={{ background: 'var(--qz-nav)', border: '2.5px solid var(--qz-ink)',
              borderRadius: '12px', boxShadow: '6px 6px 0 var(--qz-ink)' }}>
            <h1 className="text-[24px] font-black tracking-[0.12em] uppercase flex items-center gap-2"
              style={{ color: '#8b5cf6', fontFamily: "'JetBrains Mono', monospace" }}>
              QUIZ MASTER
            </h1>
          </div>

          <p className="font-semibold tracking-wide m-0 mb-[14px]" style={{ color: 'var(--qz-ink-soft)', fontSize: '15px' }}>
            Ten questions a day. Eleven categories. One shared score to brag about.
          </p>

          {streak > 0 && (
            <p className="text-sm font-black m-0 mb-[6px]"
              style={{ color: 'var(--qz-ink)', fontFamily: "'JetBrains Mono', monospace" }}>
              🔥 Your streak: {streak} day{streak === 1 ? '' : 's'}
            </p>
          )}

          {/* Daily Quiz Card */}
          <div style={{
            background: 'var(--qz-panel)', border: '2.5px solid var(--qz-ink)',
            borderRadius: '12px', padding: '18px 20px', boxShadow: '6px 6px 0 var(--qz-ink)',
            width: 'min(520px, 92%)', marginTop: '6px', textAlign: 'left',
          }} role="region" aria-label="Daily quiz">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col items-start gap-2 min-w-0">
                <div className="flex items-baseline gap-[10px] flex-wrap">
                  <div className="font-black" style={{ color: 'var(--qz-ink)' }}>Daily quiz</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--qz-ink-soft)' }}>#{num} · {date}</div>
                </div>
                <p className="text-sm font-bold m-0" style={{ color: '#6d4bd8' }}>
                  {QUIZ_PER_DAY} questions · ramped difficulty
                </p>
                <div className="flex gap-2 items-center flex-wrap">
                  {Object.entries(CATEGORY_META).map(([id, meta]) => (
                    <span key={id} className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                      style={{ background: 'var(--qz-yellow)', color: '#141414', border: '2px solid #141414' }}>
                      {meta.emoji} {meta.label}
                    </span>
                  ))}
                </div>
              </div>
              <Link to="/quiz/play" style={{
                background: 'var(--qz-ink)', color: 'var(--qz-bg)',
                border: '2.5px solid var(--qz-ink)', borderRadius: '8px',
                padding: '8px 20px', fontWeight: 700, fontSize: '14px',
                textDecoration: 'none', boxShadow: '4px 4px 0 rgba(0,0,0,0.25)', flexShrink: 0,
              }}>Play</Link>
            </div>
          </div>

          <PastPuzzlesLink to="/quiz/archive" accent="var(--qz-yellow)" label="Play past quizzes" sublabel="Replay any recent day's quiz" />

          <div className="my-2" style={{ width: '140px', height: '2px', background: 'var(--qz-ink)', opacity: 0.15 }} />

          {/* Nav menu */}
          <nav className="w-full flex flex-col gap-[10px] mt-[6px] items-center" aria-label="Menu">
            <button className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3"
              style={{ background: 'var(--qz-panel)', border: '2.5px solid var(--qz-ink)', boxShadow: '4px 4px 0 var(--qz-ink)', color: 'var(--qz-ink)' }}
              onClick={() => setShowHowToPlay(true)}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none"><path d="M12 18h.01M10.5 8.5a2.5 2.5 0 1 1 3.7 2.2c-.9.5-1.2 1-1.2 2.3v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z" stroke="currentColor" strokeWidth="1.8"/></svg>
              How to play
            </button>
            <Link to="/quiz/about" className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3"
              style={{ background: 'var(--qz-panel)', border: '2.5px solid var(--qz-ink)', boxShadow: '4px 4px 0 var(--qz-ink)', textDecoration: 'none', color: 'var(--qz-ink)' }}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none"><path d="M12 16v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 8h.01" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"/><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z" stroke="currentColor" strokeWidth="1.8"/></svg>
              About
            </Link>
          </nav>
        </section>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-[18px]"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowHowToPlay(false)}>
          <div className="w-full max-w-[520px] text-left"
            style={{ background: 'var(--qz-panel)', border: '2.5px solid var(--qz-ink)', borderRadius: '12px', padding: '20px', boxShadow: '10px 10px 0 var(--qz-ink)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-[14px]">
              <h3 className="font-black text-[16px] m-0 flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--qz-ink)' }}>
                HOW TO PLAY
                <span className="text-[10px] px-2 py-0.5 font-bold rounded" style={{ background: '#ffc93c', border: '2px solid #141414' }}>QUIZ MASTER</span>
              </h3>
              <button onClick={() => setShowHowToPlay(false)} className="text-[20px] leading-none font-bold" style={{ color: 'var(--qz-ink-soft)' }}>×</button>
            </div>
            <ol className="flex flex-col gap-[10px] text-sm font-bold leading-[1.6] list-none m-0 p-0" style={{ color: 'var(--qz-ink)' }}>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: '#8b5cf6' }}>1</span>Every day there is one shared quiz: 10 questions, easy to hard.</li>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: '#8b5cf6' }}>2</span>Tap an answer to lock it in. You'll see instantly if you were right.</li>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: '#8b5cf6' }}>3</span>Finish all 10 to get your score, your streak, and a shareable grid.</li>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: '#8b5cf6' }}>4</span>Same questions for everyone, every day — compare scores with friends.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
