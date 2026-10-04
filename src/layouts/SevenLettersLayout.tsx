import { Outlet, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SevenLettersLayout() {
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
    <div className="min-h-screen" style={{ background: 'var(--sv-bg)', color: 'var(--sv-text)' }}>
      <header
        className="px-4 py-0 flex items-center justify-between sticky top-0 z-30"
        style={{
          background: 'var(--sv-nav)',
          borderBottom: '2.5px solid var(--sv-ink)',
          minHeight: '52px',
        }}
      >
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm font-semibold transition-colors"
            style={{ color: 'var(--sv-ink-soft)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--sv-ink)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--sv-ink-soft)')}
          >
            ← Home
          </Link>
          <span style={{ color: 'var(--sv-ink-soft)', opacity: 0.3 }}>|</span>
          <h1 className="text-base font-black tracking-wide flex items-center gap-2"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: 'var(--sv-ink)' }}>
            7 LETTERS
            <span className="text-xs px-2 py-0.5 font-bold"
              style={{
                background: 'var(--sv-accent)',
                color: '#fff',
                border: '2px solid var(--sv-ink)',
                borderRadius: '4px',
                transform: 'rotate(-1deg)',
              }}>
              seven
            </span>
          </h1>
        </div>

        <div ref={menuRef} className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-2 rounded transition-colors"
            style={{ color: 'var(--sv-ink-soft)' }}
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
                  background: 'var(--sv-panel)',
                  border: '2.5px solid var(--sv-ink)',
                  borderRadius: '12px',
                  boxShadow: '6px 6px 0 var(--sv-ink)',
                }}
              >
                <div className="px-3 py-2" style={{ borderBottom: '2px solid var(--sv-ink)' }}>
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--sv-ink-soft)', fontFamily: "'JetBrains Mono', monospace" }}>Game</span>
                </div>
                <div className="p-1.5 flex flex-col gap-0.5">
                  <Link to="/seven/about" onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 rounded text-sm font-bold transition-colors"
                    style={{ color: 'var(--sv-ink)', textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--sv-accent-soft)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    About
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
