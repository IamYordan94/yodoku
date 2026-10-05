import { useState } from 'react';
import { Link } from 'react-router-dom';
import PastPuzzlesLink from '../components/PastPuzzlesLink';
import LetterMixBackgroundGrid from '../components/LetterMixBackgroundGrid';
import AnimatedString from '../components/AnimatedString';
import { getTodayDateStr } from '../utils/dailySeed';
import { getLetterMixCompletedFor } from '../utils/storage';

const LEVELS = ['easy', 'medium', 'hard'] as const;

export default function LetterMixHome() {
  const today = getTodayDateStr();
  const levelCompletion = LEVELS.map((lvl) => !!getLetterMixCompletedFor(today, lvl));
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--lm-bg)', color: 'var(--lm-text)' }}>
      <LetterMixBackgroundGrid />
      <header className="sticky top-0 z-20 px-4 flex items-center justify-between"
        style={{ background: 'var(--lm-nav)', borderBottom: '2.5px solid var(--lm-border)', minHeight: '52px' }}>
        <Link to="/" className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
          ← Hub
        </Link>
        <span className="text-sm font-black uppercase tracking-widest flex items-center gap-2"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--lm-accent)' }}>
          Clear the String
          <span className="text-[10px] px-2 py-0.5 font-bold"
            style={{ background: '#ffc93c', color: '#141414', border: '2px solid #141414', borderRadius: '4px', transform: 'rotate(-1deg)' }}>
            word
          </span>
        </span>
        <div style={{ width: '48px' }} />
      </header>

      <div className="flex items-center justify-center px-[18px] py-[48px]">
        <section className="w-full max-w-[520px] flex flex-col items-center gap-[14px] text-center relative z-10">
          <AnimatedString />
          <p className="font-bold tracking-wide m-0 mb-[14px] text-[15px]" style={{ color: 'var(--lm-text-muted)' }}>
            One string. One solution. Every day.
          </p>

          {/* Daily Puzzle Card */}
          <div role="region" aria-label="Daily puzzle" style={{
            background: 'var(--lm-surface)', border: '2.5px solid var(--lm-border)', borderRadius: '12px',
            padding: '18px 20px', boxShadow: '6px 6px 0 var(--lm-border)', width: '100%', textAlign: 'left',
          }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-baseline gap-[10px] flex-wrap">
                  <div className="font-black" style={{ color: 'var(--lm-text)' }}>Daily puzzle</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--lm-text-muted)' }}>{today}</div>
                </div>
                <div className="flex gap-3 items-center flex-wrap">
                  {LEVELS.map((lvl, i) => (
                    <div key={lvl} className="flex items-center gap-1.5">
                      <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: levelCompletion[i] ? '#39c96b' : 'var(--lm-text-faint)',
                        border: '2px solid var(--lm-border)',
                      }} />
                      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--lm-text-faint)' }}>{lvl}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link to="/lettermix/play" style={{
                background: 'var(--lm-border)', color: 'var(--lm-bg)', border: '2.5px solid var(--lm-border)',
                borderRadius: '8px', padding: '8px 20px', fontWeight: 700, fontSize: '14px',
                textDecoration: 'none', boxShadow: '4px 4px 0 rgba(0,0,0,0.25)',
              }}>Play</Link>
            </div>
          </div>

          <PastPuzzlesLink to="/lettermix/calendar" accent="#D63B3B" />

          <div style={{ width: '60px', height: '3px', background: 'var(--lm-border)', opacity: 0.2, margin: '8px 0' }} />

          <nav className="w-full flex flex-col gap-[10px] mt-[6px] items-center" aria-label="Menu">
            <Link to="/lettermix/calendar" className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3"
              style={{ background: 'var(--lm-surface)', border: '2.5px solid var(--lm-border)', boxShadow: '3px 3px 0 var(--lm-border)', textDecoration: 'none', color: 'var(--lm-text)' }}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none"><path d="M8 7V3m8 4V3M4 11h16M6 21h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Previous puzzles
            </Link>
            <button className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3"
              style={{ background: 'var(--lm-surface)', border: '2.5px solid var(--lm-border)', boxShadow: '3px 3px 0 var(--lm-border)', color: 'var(--lm-text)' }}
              onClick={() => setShowHowToPlay(true)}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none"><path d="M12 18h.01M10.5 8.5a2.5 2.5 0 1 1 3.7 2.2c-.9.5-1.2 1-1.2 2.3v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z" stroke="currentColor" strokeWidth="1.8"/></svg>
              How to play
            </button>
            <Link to="/lettermix/about" className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3"
              style={{ background: 'var(--lm-surface)', border: '2.5px solid var(--lm-border)', boxShadow: '3px 3px 0 var(--lm-border)', textDecoration: 'none', color: 'var(--lm-text)' }}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none"><path d="M12 16v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 8h.01" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"/><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z" stroke="currentColor" strokeWidth="1.8"/></svg>
              About
            </Link>
          </nav>
        </section>
      </div>

      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-[18px]"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowHowToPlay(false)}>
          <div className="w-full max-w-[520px] text-left"
            style={{ background: 'var(--lm-surface)', border: '2.5px solid var(--lm-border)', borderRadius: '12px', padding: '20px', boxShadow: '10px 10px 0 var(--lm-border)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-[14px]">
              <h3 className="font-black text-[16px] m-0" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--lm-text)' }}>HOW TO PLAY</h3>
              <button onClick={() => setShowHowToPlay(false)} className="text-[20px] leading-none font-bold" style={{ color: 'var(--lm-text-muted)' }}>×</button>
            </div>
            <ol className="flex flex-col gap-[10px] text-sm font-bold leading-[1.6] list-none m-0 p-0" style={{ color: 'var(--lm-text)' }}>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: 'var(--lm-accent)' }}>1</span>You're given a scrambled string of letters. Hidden inside are solution words.</li>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: 'var(--lm-accent)' }}>2</span>Click letters to select them and form a word, then press <strong>Submit</strong>.</li>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: 'var(--lm-accent)' }}>3</span>Any valid English word using those exact letters is accepted — not just the solution words.</li>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: 'var(--lm-accent)' }}>4</span>Find all hidden solution words to win. Use <strong>Hint</strong> if you're stuck.</li>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: 'var(--lm-accent)' }}>5</span>Three difficulty levels daily. New puzzles every day.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
