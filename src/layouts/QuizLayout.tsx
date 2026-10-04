import { Outlet, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuizLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--qz-bg)', color: 'var(--qz-text)' }}>
      <header
        className="px-4 py-0 flex items-center justify-between sticky top-0 z-30"
        style={{
          background: 'var(--qz-nav)',
          borderBottom: '2.5px solid var(--qz-ink)',
          minHeight: '52px',
        }}
      >
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm font-semibold transition-colors"
            style={{ color: 'var(--qz-ink-soft)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--qz-ink)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--qz-ink-soft)')}
          >
            ← Home
          </Link>
          <span style={{ color: 'var(--qz-ink-soft)', opacity: 0.3 }}>|</span>
          <h1 className="text-base font-black tracking-wide flex items-center gap-2"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: 'var(--qz-ink)' }}>
            QUIZ MASTER
            <span className="text-xs px-2 py-0.5 font-bold"
              style={{
                background: 'var(--qz-yellow)',
                color: 'var(--qz-ink)',
                border: '2px solid var(--qz-ink)',
                borderRadius: '4px',
                transform: 'rotate(-1deg)',
              }}>
              trivia
            </span>
          </h1>
        </div>

        <div ref={menuRef} className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-2 rounded transition-colors"
            style={{ color: 'var(--qz-ink-soft)' }}
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.nav
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 z-50 w-52 overflow-hidden"
                style={{
                  background: 'var(--qz-panel)',
                  border: '2.5px solid var(--qz-ink)',
                  borderRadius: '12px',
                  boxShadow: '6px 6px 0 var(--qz-ink)',
                }}
              >
                <div className="px-3 py-2" style={{ borderBottom: '2px solid var(--qz-ink)' }}>
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--qz-ink-soft)', fontFamily: "'JetBrains Mono', monospace" }}>Game</span>
                </div>
                <div className="p-1.5 flex flex-col gap-0.5">
                  <Link to="/quiz/about" onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 rounded text-sm font-bold transition-colors"
                    style={{ color: 'var(--qz-ink)', textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--qz-lime)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    About
                  </Link>
                  <Link to="/" onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 rounded text-sm font-bold transition-colors"
                    style={{ color: 'var(--qz-ink)', textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--qz-lime)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    Back to Home
                  </Link>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-2xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
