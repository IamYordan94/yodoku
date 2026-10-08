import { useState } from 'react';
import { Link } from 'react-router-dom';
import PastPuzzlesLink from '../components/PastPuzzlesLink';

const LAUNCH_DATE = '2026-08-23';
const DAY_MS = 86400000;
const NUM_BOARDS = 180;

/** Daily board rotation — same UTC-day formula the other hub games use. */
export function getTodayIndex(): number {
  const utcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const now = new Date();
  const days = Math.floor((utcDay(now) - utcDay(new Date(LAUNCH_DATE + 'T00:00:00Z'))) / DAY_MS);
  return ((days % NUM_BOARDS) + NUM_BOARDS) % NUM_BOARDS;
}

function getTodayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function SevenLettersHome() {
  const todayIdx = getTodayIndex();
  const today = getTodayDateStr();
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--sv-bg)', color: 'var(--sv-text)' }}>
      <header className="sticky top-0 z-20 px-4 flex items-center justify-between"
        style={{ background: 'var(--sv-nav)', borderBottom: '2.5px solid var(--sv-ink)', minHeight: '52px' }}>
        <Link to="/" className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
          ← Hub
        </Link>
        <span className="text-sm font-black uppercase tracking-widest flex items-center gap-2"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <span style={{ color: '#E7B10A' }}>7 LETTERS</span>
          <span className="text-[10px] px-2 py-0.5 font-bold rounded"
            style={{ background: '#E7B10A', color: '#141414', border: '2px solid #141414' }}>
            seven
          </span>
        </span>
        <div style={{ width: '48px' }} />
      </header>

      <div className="flex items-center justify-center px-[18px] py-[48px]">
        <section className="w-full max-w-[520px] flex flex-col items-center gap-[14px] text-center">

          {/* Title block */}
          <div className="w-full max-w-[480px] p-6 flex items-center justify-center"
            style={{ background: 'var(--sv-nav)', border: '2.5px solid var(--sv-ink)',
              borderRadius: '12px', boxShadow: '6px 6px 0 var(--sv-ink)' }}>
            <h1 className="text-[26px] font-black tracking-[0.12em] uppercase flex items-center gap-2"
              style={{ color: '#E7B10A', fontFamily: "'JetBrains Mono', monospace" }}>
              7 LETTERS
            </h1>
          </div>

          <p className="font-semibold tracking-wide m-0 mb-[14px]" style={{ color: 'var(--sv-ink-soft)', fontSize: '15px' }}>
            Seven letters. One center. How far can you climb?
          </p>

          {/* Daily Puzzle Card */}
          <div style={{
            background: 'var(--sv-panel)', border: '2.5px solid var(--sv-ink)',
            borderRadius: '12px', padding: '18px 20px', boxShadow: '6px 6px 0 var(--sv-ink)',
            width: 'min(520px, 92%)', marginTop: '6px', textAlign: 'left',
          }} role="region" aria-label="Daily puzzle">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col items-start gap-2 min-w-0">
                <div className="flex items-baseline gap-[10px] flex-wrap">
                  <div className="font-black" style={{ color: 'var(--sv-ink)' }}>Daily board</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--sv-ink-soft)' }}>#{todayIdx} · {today}</div>
                </div>
                <p className="text-sm font-bold m-0" style={{ color: '#b3870a' }}>
                  Every word needs the center letter
                </p>
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                    style={{ background: '#E7B10A', color: '#141414', border: '2px solid #141414' }}>
                    daily
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--sv-ink-soft)' }}>
                    3+ letters · pangrams +7
                  </span>
                </div>
              </div>
              <Link to="/seven/play" style={{
                background: 'var(--sv-ink)', color: 'var(--sv-bg)',
                border: '2.5px solid var(--sv-ink)', borderRadius: '8px',
                padding: '8px 20px', fontWeight: 700, fontSize: '14px',
                textDecoration: 'none', boxShadow: '4px 4px 0 rgba(0,0,0,0.25)', flexShrink: 0,
              }}>Play</Link>
            </div>
          </div>

          <PastPuzzlesLink to="/seven/archive" accent="#E7B10A" label="Play past boards" sublabel="Replay any of the previous boards" />

          <div className="my-2" style={{ width: '140px', height: '2px', background: 'var(--sv-ink)', opacity: 0.15 }} />

          {/* Nav menu */}
          <nav className="w-full flex flex-col gap-[10px] mt-[6px] items-center" aria-label="Menu">
            <button className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3"
              style={{ background: 'var(--sv-panel)', border: '2.5px solid var(--sv-ink)', boxShadow: '4px 4px 0 var(--sv-ink)', color: 'var(--sv-ink)' }}
              onClick={() => setShowHowToPlay(true)}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none"><path d="M12 18h.01M10.5 8.5a2.5 2.5 0 1 1 3.7 2.2c-.9.5-1.2 1-1.2 2.3v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z" stroke="currentColor" strokeWidth="1.8"/></svg>
              How to play
            </button>
            <Link to="/seven/about" className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3"
              style={{ background: 'var(--sv-panel)', border: '2.5px solid var(--sv-ink)', boxShadow: '4px 4px 0 var(--sv-ink)', textDecoration: 'none', color: 'var(--sv-ink)' }}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none"><path d="M12 16v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 8h.01" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"/><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z" stroke="currentColor" strokeWidth="1.8"/></svg>
              About
            </Link>
            <a href="#language" className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3"
              style={{ background: 'var(--sv-panel)', border: '2.5px solid var(--sv-ink)', boxShadow: '4px 4px 0 var(--sv-ink)', color: 'var(--sv-ink)', textDecoration: 'none' }}
              onClick={(e) => { e.preventDefault(); document.getElementById('language')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none"><path d="M4 5h7m-3 0v3m0 0h3m-3 0H6m12 13-3-7-3 7m1-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M14 5c0 6-3 10-8 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Language
            </a>
          </nav>

          {/* Language */}
          <section id="language" className="w-full text-left mt-[4px] mb-[24px]">
            <div style={{ background: 'var(--sv-panel)', border: '2.5px solid var(--sv-ink)', borderRadius: '12px', padding: '16px 18px', boxShadow: '4px 4px 0 var(--sv-ink)', width: '100%' }}>
              <h3 className="font-black text-[15px] mb-[10px]" style={{ color: 'var(--sv-ink)' }}>Language</h3>
              <div className="flex items-center gap-3">
                <span className="text-[22px]">🇺🇸</span>
                <div>
                  <p className="text-sm font-bold m-0" style={{ color: 'var(--sv-ink)' }}>English (US)</p>
                  <p className="text-xs font-semibold m-0 mt-0.5" style={{ color: 'var(--sv-ink-soft)' }}>More languages coming soon</p>
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-[18px]"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowHowToPlay(false)}>
          <div className="w-full max-w-[520px] text-left"
            style={{ background: 'var(--sv-panel)', border: '2.5px solid var(--sv-ink)', borderRadius: '12px', padding: '20px', boxShadow: '10px 10px 0 var(--sv-ink)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-[14px]">
              <h3 className="font-black text-[16px] m-0 flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--sv-ink)' }}>
                HOW TO PLAY
                <span className="text-[10px] px-2 py-0.5 font-bold rounded" style={{ background: '#E7B10A', border: '2px solid #141414' }}>7 LETTERS</span>
              </h3>
              <button onClick={() => setShowHowToPlay(false)} className="text-[20px] leading-none font-bold" style={{ color: 'var(--sv-ink-soft)' }}>×</button>
            </div>
            <ol className="flex flex-col gap-[10px] text-sm font-bold leading-[1.6] list-none m-0 p-0" style={{ color: 'var(--sv-ink)' }}>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: '#E7B10A' }}>1</span>You get 7 letters each day — one of them sits in the CENTER and must appear in every word you make.</li>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: '#E7B10A' }}>2</span>Words are <strong>at least 3 letters long</strong>, English only, and use no letter outside the seven.</li>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: '#E7B10A' }}>3</span><span style={{ padding: '1px 6px', background: '#E7B10A', border: '2px solid #141414', borderRadius: '3px', fontWeight: 800 }}>SCORING</span> 3-letter word = 1 pt · longer words = 1 pt per letter · a word using all 7 letters = <strong>+7 bonus</strong>.</li>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: '#E7B10A' }}>4</span>Climb the tiers: <strong>Good</strong> 15%, <strong>Solid</strong> 30%, <strong>Great</strong> 45%, <strong>Amazing</strong> 60%, <strong>Genius</strong> 80%, <strong>Queen Bee</strong> 100% of the board's max score.</li>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: '#E7B10A' }}>5</span>A new board every day. Copy your share card when you're done.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
