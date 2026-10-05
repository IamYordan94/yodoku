import { useState } from 'react';
import { Link } from 'react-router-dom';
import PastPuzzlesLink from '../components/PastPuzzlesLink';
import { FERMI_BANK } from '../utils/puzzleGenerator';

const LAUNCH_DATE = '2026-08-07';
const DAY_MS = 86400000;

function getTodayIndex(): number {
  const utcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const now = new Date();
  const days = Math.floor((utcDay(now) - utcDay(new Date(LAUNCH_DATE + 'T00:00:00Z'))) / DAY_MS);
  return ((days % FERMI_BANK.length) + FERMI_BANK.length) % FERMI_BANK.length;
}

export default function FermiHome() {
  const todayIdx = getTodayIndex();
  const today = new Date().toISOString().slice(0, 10);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const puzzle = FERMI_BANK[todayIdx] || null;

  // Simple completion check from localStorage
  const doneToday = (() => {
    try {
      const raw = localStorage.getItem('db.fermi.v1');
      if (!raw) return false;
      const db = JSON.parse(raw);
      const todayStr = today;
      return db.days?.[todayStr] !== undefined;
    } catch { return false; }
  })();

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--fm-bg)', color: 'var(--fm-text)' }}>
      <header className="sticky top-0 z-20 px-4 flex items-center justify-between"
        style={{ background: 'var(--fm-nav)', borderBottom: '2.5px solid var(--fm-ink)', minHeight: '52px' }}>
        <Link to="/" className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
          ← Hub
        </Link>
        <span className="text-sm font-black uppercase tracking-widest flex items-center gap-2"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <span style={{ color: '#ff6b35' }}>FERMI</span>
          <span className="text-[10px] px-2 py-0.5 font-bold rounded"
            style={{ background: '#ff6b35', color: '#fff', border: '2px solid #141414' }}>
            estimate
          </span>
        </span>
        <div style={{ width: '48px' }} />
      </header>

      <div className="flex items-center justify-center px-[18px] py-[48px]">
        <section className="w-full max-w-[520px] flex flex-col items-center gap-[14px] text-center">

          {/* Title block */}
          <div className="w-full max-w-[480px] p-6 flex items-center justify-center"
            style={{ background: 'var(--fm-nav)', border: '2.5px solid var(--fm-ink)',
              borderRadius: '12px', boxShadow: '6px 6px 0 var(--fm-ink)' }}>
            <h1 className="text-[26px] font-black tracking-[0.12em] uppercase"
              style={{ color: '#ff6b35', fontFamily: "'JetBrains Mono', monospace" }}>
              FERMI
            </h1>
          </div>

          <p className="font-semibold tracking-wide m-0 mb-[14px]" style={{ color: 'var(--fm-ink-soft)', fontSize: '15px' }}>
            Guess the number. Learn the scale. Calibrate your intuition.
          </p>

          {/* Daily Puzzle Card */}
          <div style={{
            background: 'var(--fm-panel)', border: '2.5px solid var(--fm-ink)',
            borderRadius: '12px', padding: '18px 20px', boxShadow: '6px 6px 0 var(--fm-ink)',
            width: 'min(520px, 92%)', marginTop: '6px', textAlign: 'left',
          }} role="region" aria-label="Daily puzzle">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col items-start gap-2 min-w-0">
                <div className="flex items-baseline gap-[10px] flex-wrap">
                  <div className="font-black" style={{ color: 'var(--fm-ink)' }}>Daily puzzle</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--fm-ink-soft)' }}>#{todayIdx} · {today}</div>
                </div>
                {puzzle && (
                  <p className="text-sm font-bold m-0" style={{ color: '#d4542a' }}>
                    {puzzle.prompt}
                  </p>
                )}
                {puzzle && (
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                      style={{ background: '#ff6b35', color: '#fff', border: '2px solid #141414' }}>
                      {puzzle.category}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: 'var(--fm-ink-soft)' }}>
                      {puzzle.units} · {puzzle.difficulty}
                    </span>
                  </div>
                )}
                {doneToday && (
                  <p className="text-xs font-bold m-0" style={{ color: '#39c96b' }}>
                    ✓ Completed! Come back tomorrow.
                  </p>
                )}
              </div>
              <Link to="/fermi/play" style={{
                background: 'var(--fm-ink)', color: 'var(--fm-bg)',
                border: '2.5px solid var(--fm-ink)', borderRadius: '8px',
                padding: '8px 20px', fontWeight: 700, fontSize: '14px',
                textDecoration: 'none', boxShadow: '4px 4px 0 rgba(0,0,0,0.25)', flexShrink: 0,
              }}>{doneToday ? 'Review' : 'Play'}</Link>
            </div>
          </div>

          <PastPuzzlesLink to="/fermi/calendar" accent="var(--fm-orange)" />

          <div className="my-2" style={{ width: '140px', height: '2px', background: 'var(--fm-ink)', opacity: 0.15 }} />

          {/* Nav menu */}
          <nav className="w-full flex flex-col gap-[10px] mt-[6px] items-center" aria-label="Menu">
            <Link to="/fermi/calendar" className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3"
              style={{ background: 'var(--fm-panel)', border: '2.5px solid var(--fm-ink)', boxShadow: '4px 4px 0 var(--fm-ink)', textDecoration: 'none', color: 'var(--fm-ink)' }}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none"><path d="M8 7V3m8 4V3M4 11h16M6 21h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Previous puzzles
            </Link>
            <button className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3"
              style={{ background: 'var(--fm-panel)', border: '2.5px solid var(--fm-ink)', boxShadow: '4px 4px 0 var(--fm-ink)', color: 'var(--fm-ink)' }}
              onClick={() => setShowHowToPlay(true)}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none"><path d="M12 18h.01M10.5 8.5a2.5 2.5 0 1 1 3.7 2.2c-.9.5-1.2 1-1.2 2.3v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z" stroke="currentColor" strokeWidth="1.8"/></svg>
              How to play
            </button>
            <Link to="/fermi/about" className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3"
              style={{ background: 'var(--fm-panel)', border: '2.5px solid var(--fm-ink)', boxShadow: '4px 4px 0 var(--fm-ink)', textDecoration: 'none', color: 'var(--fm-ink)' }}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none"><path d="M12 16v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 8h.01" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"/><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z" stroke="currentColor" strokeWidth="1.8"/></svg>
              About
            </Link>
            <a href="#language" className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3"
              style={{ background: 'var(--fm-panel)', border: '2.5px solid var(--fm-ink)', boxShadow: '4px 4px 0 var(--fm-ink)', color: 'var(--fm-ink)', textDecoration: 'none' }}
              onClick={(e) => { e.preventDefault(); document.getElementById('language')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none"><path d="M4 5h7m-3 0v3m0 0h3m-3 0H6m12 13-3-7-3 7m1-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M14 5c0 6-3 10-8 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Language
            </a>
          </nav>

          {/* Language */}
          <section id="language" className="w-full text-left mt-[4px] mb-[24px]">
            <div style={{ background: 'var(--fm-panel)', border: '2.5px solid var(--fm-ink)', borderRadius: '12px', padding: '16px 18px', boxShadow: '4px 4px 0 var(--fm-ink)', width: '100%' }}>
              <h3 className="font-black text-[15px] mb-[10px]" style={{ color: 'var(--fm-ink)' }}>Language</h3>
              <div className="flex items-center gap-3">
                <span className="text-[22px]">🇺🇸</span>
                <div>
                  <p className="text-sm font-bold m-0" style={{ color: 'var(--fm-ink)' }}>English (US)</p>
                  <p className="text-xs font-semibold m-0 mt-0.5" style={{ color: 'var(--fm-ink-soft)' }}>More languages coming soon</p>
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
            style={{ background: 'var(--fm-panel)', border: '2.5px solid var(--fm-ink)', borderRadius: '12px', padding: '20px', boxShadow: '10px 10px 0 var(--fm-ink)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-[14px]">
              <h3 className="font-black text-[16px] m-0 flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--fm-ink)' }}>
                HOW TO PLAY
                <span className="text-[10px] px-2 py-0.5 font-bold rounded" style={{ background: '#ff6b35', color: '#fff', border: '2px solid #141414' }}>FERMI</span>
              </h3>
              <button onClick={() => setShowHowToPlay(false)} className="text-[20px] leading-none font-bold" style={{ color: 'var(--fm-ink-soft)' }}>×</button>
            </div>
            <ol className="flex flex-col gap-[10px] text-sm font-bold leading-[1.6] list-none m-0 p-0" style={{ color: 'var(--fm-ink)' }}>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: '#ff6b35' }}>1</span>You get a real-world question: <em>"How far is the Moon?"</em></li>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: '#ff6b35' }}>2</span>Type your best guess. <strong>6 tries</strong>. Win within <strong>5%</strong> of the answer.</li>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: '#ff6b35' }}>3</span><span style={{ color: '#39c96b' }}>Green</span> = ±5% · <span style={{ color: '#ffc93c' }}>Yellow</span> = within 2× · <span style={{ color: '#ff6b35' }}>Orange</span> = within 10× · <span style={{ color: '#ff4d4d' }}>Red</span> = way off.</li>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: '#ff6b35' }}>4</span>After each guess: "about 10× off" or "about 100× off" — learn orders of magnitude.</li>
              <li className="flex gap-3"><span className="font-black text-[13px] w-5" style={{ color: '#ff6b35' }}>5</span>The reveal teaches WHY — with derivation and a published source.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
