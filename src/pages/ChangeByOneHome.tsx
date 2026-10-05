import { useState } from 'react';
import { Link } from 'react-router-dom';
import PastPuzzlesLink from '../components/PastPuzzlesLink';
import { getTodayCboDateStr } from '../utils/cbo-dailyChallenge';

export default function ChangeByOneHome() {
  const today = getTodayCboDateStr();
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--cbo-bg)', color: 'var(--cbo-text)' }}>

      {/* Dark nav bar */}
      <header
        className="sticky top-0 z-20 px-4 flex items-center justify-between"
        style={{
          background: 'var(--cbo-dark)',
          borderBottom: '2.5px solid var(--cbo-border)',
          minHeight: '52px',
        }}
      >
        <Link
          to="/"
          className="text-sm font-semibold"
          style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.01em', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
        >
          ← Hub
        </Link>
        <span className="text-sm font-black uppercase tracking-widest flex items-center gap-2"
          style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
          <span style={{ color: 'var(--cbo-accent)' }}>Change by One</span>
          <span className="text-[10px] px-2 py-0.5 font-bold"
            style={{ background: '#5bc9ff', color: '#141414', border: '2px solid #141414', borderRadius: '4px', transform: 'rotate(-1deg)' }}>
            ladder
          </span>
        </span>
        <div style={{ width: '48px' }} />
      </header>

      <div className="flex items-center justify-center px-[18px] py-[48px]">
        <section className="w-full max-w-[520px] flex flex-col items-center gap-[14px] text-center">

          {/* Title block — keycap panel */}
          <div
            className="w-full max-w-[480px] p-6 flex items-center justify-center"
            style={{
              background: 'var(--cbo-surface)',
              border: '1px solid var(--cbo-border)',
              borderBottom: '4px solid var(--cbo-border-dark)',
              borderRadius: '6px',
              boxShadow: '0 4px 0 var(--cbo-border-dark), 0 5px 10px rgba(0,0,0,0.08)',
            }}
          >
            <h1
              className="text-[26px] font-black tracking-[0.12em] uppercase"
              style={{ color: 'var(--cbo-accent)', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            >
              CHANGEBYONE
            </h1>
          </div>

          {/* Tagline */}
          <p className="font-semibold tracking-wide m-0 mb-[14px]" style={{ color: 'var(--cbo-text-muted)', fontSize: '15px' }}>
            Transform one word into another. One letter at a time.
          </p>

          {/* Daily Challenge Card */}
          <div className="cbo-card" style={{ width: 'min(520px, 92%)', marginTop: '6px' }} role="region" aria-label="Daily challenge">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col items-start gap-2 text-left min-w-0">
                <div className="flex items-baseline gap-[10px] flex-wrap">
                  <div className="font-bold" style={{ color: 'var(--cbo-text)' }}>Daily challenge</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--cbo-text-muted)' }}>{today}</div>
                </div>
                <p className="text-sm font-bold m-0" style={{ color: 'var(--cbo-highlight)' }}>
                  Four word lengths: 4, 5, 6, and 7 letters
                </p>
              </div>
              <Link to="/changebyone/play" className="cbo-btn-primary">
                Play
              </Link>
            </div>
          </div>

          <PastPuzzlesLink to="/changebyone/calendar" accent="var(--cbo-highlight)" />

          {/* Divider */}
          <div
            className="my-2"
            style={{ width: '140px', height: '1px', background: 'var(--cbo-border-dark)' }}
            aria-hidden="true"
          />

          {/* Nav menu */}
          <nav className="w-full flex flex-col gap-[10px] mt-[6px] items-center" aria-label="Menu">
            <button className="cbo-menu-item" onClick={() => setShowHowToPlay(true)}>
              <svg className="cbo-menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 18h.01M10.5 8.5a2.5 2.5 0 1 1 3.7 2.2c-.9.5-1.2 1-1.2 2.3v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
              <span>How to play</span>
            </button>

            <Link to="/changebyone/calendar" className="cbo-menu-item">
              <svg className="cbo-menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <span>Previous puzzles</span>
            </Link>

            <Link to="/changebyone/about" className="cbo-menu-item">
              <svg className="cbo-menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 16v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M12 8h.01" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"/>
                <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
              <span>About</span>
            </Link>

            <a
              href="#language"
              className="cbo-menu-item"
              onClick={(e) => { e.preventDefault(); document.getElementById('language')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              <svg className="cbo-menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 5h7m-3 0v3m0 0h3m-3 0H6m12 13-3-7-3 7m1-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M14 5c0 6-3 10-8 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <span>Language</span>
            </a>
          </nav>

          {/* Language */}
          <section id="language" className="w-full text-left mt-[4px] mb-[24px]">
            <div className="cbo-card" style={{ width: '100%' }}>
              <h3 className="font-bold text-[15px] mb-[10px]" style={{ color: 'var(--cbo-text)' }}>Language</h3>
              <div className="flex items-center gap-3">
                <span className="text-[22px]">🇺🇸</span>
                <div>
                  <p className="text-sm font-bold m-0" style={{ color: 'var(--cbo-text)' }}>English (US)</p>
                  <p className="text-xs font-semibold m-0 mt-0.5" style={{ color: 'var(--cbo-text-muted)' }}>More languages coming soon</p>
                </div>
              </div>
            </div>
          </section>

        </section>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-[18px]"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowHowToPlay(false)}
        >
          <div
            className="w-full max-w-[520px] text-left"
            style={{
              background: 'var(--cbo-surface)',
              border: '1px solid var(--cbo-border)',
              borderBottom: '3px solid var(--cbo-border-dark)',
              borderRadius: '6px',
              padding: '20px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-[14px]">
              <h3
                className="font-black text-[15px] m-0 uppercase tracking-widest"
                style={{ color: 'var(--cbo-text)', fontFamily: "'JetBrains Mono', monospace" }}
              >
                How to play
              </h3>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="text-[20px] leading-none"
                style={{ color: 'var(--cbo-text-muted)' }}
                aria-label="Close"
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--cbo-text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--cbo-text-muted)')}
              >
                ×
              </button>
            </div>
            <ol className="flex flex-col gap-[10px] text-sm font-semibold leading-[1.6] list-none m-0 p-0" style={{ color: 'var(--cbo-text-muted)' }}>
              {[
                <>You're given a <strong style={{ color: 'var(--cbo-text)' }}>start word</strong> and a <strong style={{ color: 'var(--cbo-text)' }}>target word</strong> of the same length.</>,
                <>Each step, type a new word that differs by <strong style={{ color: 'var(--cbo-text)' }}>exactly one letter</strong>.</>,
                <>Every word must be a real English word.</>,
                <>Reach the target in as few steps as possible. Use <strong style={{ color: 'var(--cbo-text)' }}>Hint</strong> if stuck.</>,
              ].map((text, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-black text-[13px] w-5 flex-shrink-0 mt-[1px]" style={{ color: 'var(--cbo-accent)' }}>{i + 1}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>

            {/* Example */}
            <div
              className="mt-4 p-3 rounded"
              style={{ background: 'var(--cbo-surface-2)', border: '1px solid var(--cbo-border)' }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--cbo-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                Example: CAT → DOG
              </p>
              <div className="flex items-center gap-2 flex-wrap text-sm font-mono font-bold">
                <span style={{ color: 'var(--cbo-highlight)' }}>CAT</span>
                <span style={{ color: 'var(--cbo-text-muted)' }}>→</span>
                <span style={{ color: 'var(--cbo-text)' }}>COT</span>
                <span style={{ color: 'var(--cbo-text-muted)' }}>→</span>
                <span style={{ color: 'var(--cbo-text)' }}>DOT</span>
                <span style={{ color: 'var(--cbo-text-muted)' }}>→</span>
                <span style={{ color: 'var(--cbo-accent)' }}>DOG</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
