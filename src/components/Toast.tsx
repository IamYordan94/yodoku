// Toast.tsx — a tiny sticker-style toast used by the native shell
// (double-press-to-exit hint). Imperative: import { showToast } and call it.
// Styled to match the Sticker Pack system: ink pill, paper text, hard shadow.

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type Listener = (message: string) => void;
let listener: Listener | null = null;

/** Show a short-lived toast. Safe to call from anywhere (no-op before mount). */
export function showToast(message: string): void {
  listener?.(message);
}

export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    listener = (m: string) => {
      setMessage(m);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setMessage(null), 2000);
    };
    return () => {
      listener = null;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 26px)',
        zIndex: 1400,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 24 }}
        style={{
          background: 'var(--yodoku-ink, #141414)',
          color: 'var(--yodoku-bg, #f6f3ec)',
          border: '2.5px solid var(--yodoku-ink, #141414)',
          borderRadius: '10px',
          boxShadow: '5px 5px 0 rgba(20,20,20,0.35)',
          padding: '10px 16px',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontWeight: 800,
          fontSize: '12.5px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          textAlign: 'center',
          maxWidth: 'min(320px, calc(100vw - 40px))',
        }}
      >
        {message}
      </motion.div>
    </div>
  );
}
