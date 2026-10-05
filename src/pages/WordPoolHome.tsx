import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PastPuzzlesLink from '../components/PastPuzzlesLink';
import { getTodayDateStr, getDailyPuzzleIndex } from '../utils/dailySeed';
import { getWordPoolDailyEntry, isWordPoolDailyAllDone } from '../utils/storage';

type Category = { id: string; name: string; levels: { level: number; name: string }[] };
type WordPoolData = { categories: Category[] };

export default function WordPoolHome() {
  const today = getTodayDateStr();
  const [data, setData] = useState<WordPoolData | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  useEffect(() => {
    fetch('/data/wordpool-categories.json')
      .then((r) => r.json())
      .then(setData);
  }, []);

  const todayCategory = data
    ? data.categories[getDailyPuzzleIndex(today, data.categories.length)]
    : null;

  const dailyEntry = getWordPoolDailyEntry(today);
  const totalLevels = todayCategory?.levels.length ?? 6;
  const levelsCompleted = Object.keys(dailyEntry.levels).length;
  const allDone = todayCategory ? isWordPoolDailyAllDone(today, totalLevels) : false;

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--wp-bg)', color: 'var(--wp-text)' }}>

      {/* Nav bar */}
      <header
        className="sticky top-0 z-20 px-4 flex items-center justify-between"
        style={{ background: 'var(--wp-dark)', borderBottom: '2.5px solid var(--wp-border)', minHeight: '52px' }}
      >
        <Link to="/" className="text-sm font-semibold"
          style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.01em', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
          ← Hub
        </Link>
        <span className="text-sm font-black uppercase tracking-widest flex items-center gap-2"
          style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
          <span style={{ color: 'var(--wp-accent-blue)' }}>Word Pool</span>
          <span className="text-[10px] px-2 py-0.5 font-bold"
            style={{ background: '#d9f24b', color: '#141414', border: '2px solid #141414', borderRadius: '4px', transform: 'rotate(1deg)' }}>
            category
          </span>
        </span>
        <div style={{ width: '48px' }} />
      </header>

      <div className="flex items-center justify-center px-[18px] py-[48px]">
        <section className="w-full max-w-[520px] flex flex-col items-center gap-[14px] text-center">

          {/* Title block */}
          <div className="w-full max-w-[480px] p-6 flex items-center justify-center"
            style={{ background: 'var(--wp-dark)', border: '1px solid var(--wp-dark-2)',
              borderBottom: '4px solid #111827', borderRadius: '6px',
              boxShadow: '0 4px 0 #111827, 0 5px 10px rgba(20,24,34,0.12)' }}>
            <h1 className="text-[26px] font-black tracking-[0.12em] uppercase"
              style={{ color: 'var(--wp-accent-blue)', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
              WORDPOOL
            </h1>
          </div>

          {/* Tagline */}
          <p className="font-semibold tracking-wide m-0 mb-[14px]" style={{ color: 'var(--wp-text-muted)', fontSize: '15px' }}>
            Name words that fit the category. Narrow it down, level by level.
          </p>

          {/* Daily Challenge Card */}
          <div className="wp-card" style={{ width: 'min(520px, 92%)', marginTop: '6px' }} role="region" aria-label="Daily puzzle">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col items-start gap-2 text-left min-w-0">
                <div className="flex items-baseline gap-[10px] flex-wrap">
                  <div className="font-bold" style={{ color: 'var(--wp-text)' }}>Daily puzzle</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--wp-text-muted)' }}>{today}</div>
                </div>

                {todayCategory && (
                  <p className="text-sm font-bold m-0" style={{ color: 'var(--wp-accent-blue-side)' }}>
                    {todayCategory.name}
                  </p>
                )}

                {/* Level progress dots */}
                {todayCategory && (
                  <div className="flex gap-2 items-center flex-wrap" aria-label="Level progress">
                    {todayCategory.levels.map((lvl) => {
                      const done = !!dailyEntry.levels[String(lvl.level)];
                      const isCurrent = lvl.level === Math.min(dailyEntry.unlockedLevel, totalLevels) && !allDone;
                      return (
                        <div key={lvl.level} className="flex items-center gap-1">
                          <div
                            className="rounded-full transition-colors"
                            style={{
                              width: '8px', height: '8px',
                              background: done
                                ? 'var(--wp-accent-blue-side)'
                                : isCurrent
                                ? 'var(--wp-accent-pink)'
                                : 'var(--wp-border-dark)',
                            }}
                          />
                          <span className="text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: done ? 'var(--wp-accent-blue-side)' : 'var(--wp-text-muted)' }}>
                            L{lvl.level}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {allDone && (
                  <p className="text-xs font-bold m-0" style={{ color: 'var(--wp-accent-blue-side)' }}>
                    ✓ Completed! Come back tomorrow.
                  </p>
                )}
              </div>
              <Link to="/wordpool/play" className="wp-btn-primary" style={{ flexShrink: 0 }}>
                {allDone ? 'Review' : levelsCompleted > 0 ? 'Continue' : 'Play'}
              </Link>
            </div>
          </div>

          {/* Divider */}
          <PastPuzzlesLink to="/wordpool/previous" accent="#9FC3DA" />

          <div className="my-2" style={{ width: '140px', height: '1px', background: 'var(--wp-border-dark)' }} aria-hidden="true" />

          {/* Nav menu */}
          <nav className="w-full flex flex-col gap-[10px] mt-[6px] items-center" aria-label="Menu">
            <Link to="/wordpool/previous" className="wp-menu-item">
              <svg className="wp-menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 7V3m8 4V3M4 11h16M6 21h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <span>Previous puzzles</span>
            </Link>

            <button className="wp-menu-item" onClick={() => setShowHowToPlay(true)}>
              <svg className="wp-menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 18h.01M10.5 8.5a2.5 2.5 0 1 1 3.7 2.2c-.9.5-1.2 1-1.2 2.3v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
              <span>How to play</span>
            </button>

            <Link to="/wordpool/about" className="wp-menu-item">
              <svg className="wp-menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 16v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M12 8h.01" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"/>
                <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
              <span>About</span>
            </Link>

            <a href="#language" className="wp-menu-item"
              onClick={(e) => { e.preventDefault(); document.getElementById('language')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <svg className="wp-menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 5h7m-3 0v3m0 0h3m-3 0H6m12 13-3-7-3 7m1-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M14 5c0 6-3 10-8 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <span>Language</span>
            </a>
          </nav>

          {/* Language */}
          <section id="language" className="w-full text-left mt-[4px] mb-[24px]">
            <div className="wp-card" style={{ width: '100%' }}>
              <h3 className="font-bold text-[15px] mb-[10px]" style={{ color: 'var(--wp-text)' }}>Language</h3>
              <div className="flex items-center gap-3">
                <span className="text-[22px]">🇺🇸</span>
                <div>
                  <p className="text-sm font-bold m-0" style={{ color: 'var(--wp-text)' }}>English (US)</p>
                  <p className="text-xs font-semibold m-0 mt-0.5" style={{ color: 'var(--wp-text-muted)' }}>More languages coming soon</p>
                </div>
              </div>
            </div>
          </section>

        </section>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-[18px]"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowHowToPlay(false)}>
          <div className="w-full max-w-[520px] text-left"
            style={{ background: 'var(--wp-surface)', border: '1px solid var(--wp-border)',
              borderBottom: '3px solid var(--wp-border-dark)', borderRadius: '6px',
              padding: '20px', boxShadow: '0 8px 24px rgba(20,24,34,0.14)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-[14px]">
              <h3 className="font-black text-[15px] m-0 uppercase tracking-widest"
                style={{ color: 'var(--wp-text)', fontFamily: "'JetBrains Mono', monospace" }}>
                How to play
              </h3>
              <button onClick={() => setShowHowToPlay(false)} className="text-[20px] leading-none"
                style={{ color: 'var(--wp-text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--wp-text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--wp-text-muted)')}>×</button>
            </div>
            <ol className="flex flex-col gap-[10px] text-sm font-semibold leading-[1.6] list-none m-0 p-0"
              style={{ color: 'var(--wp-text-muted)' }}>
              {[
                <>Each day brings a new <strong style={{ color: 'var(--wp-text)' }}>category</strong> with 6 levels.</>,
                <>Each level <strong style={{ color: 'var(--wp-text)' }}>narrows the constraint</strong> — from broad to very specific.</>,
                <>Type words that fit, press <strong style={{ color: 'var(--wp-text)' }}>Submit</strong>. Find all words to unlock the next level.</>,
                <>Use <strong style={{ color: 'var(--wp-text)' }}>Hint</strong> for progressive clues. Come back daily for a fresh category.</>,
              ].map((text, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-black text-[13px] w-5 flex-shrink-0 mt-[1px]"
                    style={{ color: 'var(--wp-accent-blue-side)' }}>{i + 1}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
