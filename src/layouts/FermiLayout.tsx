import { Outlet, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FermiLayout() {
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
    <div className="min-h-screen" style={{ background: 'var(--fm-bg)', color: 'var(--fm-text)' }}>
      <header className="px-4 py-0 flex items-center justify-between sticky top-0 z-30"
        style={{ background: 'var(--fm-nav)', borderBottom: '2.5px solid var(--fm-ink)', minHeight: '52px' }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm font-semibold"
            style={{ color: 'var(--fm-ink-soft)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--fm-ink)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--fm-ink-soft)')}>
            ← Home
          </Link>
          <span style={{ color: 'var(--fm-ink-soft)', opacity: 0.3 }}>|</span>
          <h1 className="text-base font-black tracking-wide flex items-center gap-2"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--fm-ink)' }}>
            FERMI
            <span className="text-xs px-2 py-0.5 font-bold"
              style={{
                background: 'var(--fm-orange)',
                color: '#fff',
                border: '2px solid var(--fm-ink)',
                borderRadius: '4px',
                transform: 'rotate(1deg)',
              }}>
              estimate
            </span>
          </h1>
        </div>
        <div ref={menuRef} className="relative">
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-2 rounded" style={{ color: 'var(--fm-ink-soft)' }} aria-label="Menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.nav
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 z-50 w-52 overflow-hidden"
                style={{
                  background: 'var(--fm-panel)',
                  border: '2.5px solid var(--fm-ink)',
                  borderRadius: '12px',
                  boxShadow: '6px 6px 0 var(--fm-ink)',
                }}>
                <div className="px-3 py-2" style={{ borderBottom: '2px solid var(--fm-ink)' }}>
                  <span className="text-xs font-black uppercase tracking-widest"
                    style={{ color: 'var(--fm-ink-soft)', fontFamily: "'JetBrains Mono', monospace" }}>Game</span>
                </div>
                <div className="p-1.5">
                  <Link to="/fermi/about" onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 rounded text-sm font-bold"
                    style={{ color: 'var(--fm-ink)', textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--fm-accent)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--fm-ink)'; }}>
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
