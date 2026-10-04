import { Outlet, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChangeByOneLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--cbo-bg)', color: 'var(--cbo-text)' }}>
      <header className="px-4 py-0 flex items-center justify-between sticky top-0 z-30"
        style={{ background: 'var(--cbo-dark)', borderBottom: '2.5px solid var(--cbo-border)', minHeight: '52px' }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>
            ← Home
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <h1 className="text-base font-black tracking-wide flex items-center gap-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <span style={{ color: 'var(--cbo-accent)' }}>Change by One</span>
            <span className="text-[10px] px-2 py-0.5 font-bold"
              style={{ background: '#5bc9ff', color: '#141414', border: '2px solid #141414', borderRadius: '4px', transform: 'rotate(-1deg)' }}>
              ladder
            </span>
          </h1>
        </div>
        <div ref={menuRef} className="relative">
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-2 rounded" style={{ color: 'rgba(255,255,255,0.7)' }} aria-label="Menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 z-50 w-52 overflow-hidden"
                style={{ background: '#ffffff', border: '2.5px solid #141414', borderRadius: '12px', boxShadow: '6px 6px 0 #141414' }}>
                <div className="px-3 py-2" style={{ borderBottom: '2px solid #141414' }}>
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#6f6a5e', fontFamily: "'JetBrains Mono', monospace" }}>Game</span>
                </div>
                <div className="p-1.5 flex flex-col gap-0.5">
                  <Link to="/changebyone/calendar" onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 rounded text-sm font-bold" style={{ color: '#141414', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#d9f24b'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    Calendar
                  </Link>
                </div>
                <div className="px-3 py-2" style={{ borderTop: '2px solid #141414' }}>
                  <Link to="/changebyone/about" onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 rounded text-sm font-bold" style={{ color: '#141414', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#d9f24b'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
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
