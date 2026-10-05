// PastPuzzlesLink.tsx — one consistent "Play past puzzles" entry point for
// every game hub. Sticker Pack styling so it reads as a primary archive action
// rather than a buried menu row.

import { Link } from 'react-router-dom';

const mono = "'JetBrains Mono', ui-monospace, monospace";

interface Props {
  to: string;
  accent?: string;
  label?: string;
  sublabel?: string;
}

export default function PastPuzzlesLink({
  to,
  accent = 'var(--yodoku-lime)',
  label = 'Play past puzzles',
  sublabel = 'Catch up on any day you missed',
}: Props) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        background: 'var(--yodoku-panel)',
        border: '2.5px solid var(--yodoku-ink)',
        borderRadius: '12px',
        boxShadow: '5px 5px 0 var(--yodoku-ink)',
        padding: '12px 16px',
        textDecoration: 'none',
        color: 'var(--yodoku-ink)',
      }}
    >
      <span
        style={{
          background: accent,
          border: '2px solid var(--yodoku-ink)',
          borderRadius: '6px',
          padding: '5px 9px',
          fontSize: '16px',
          lineHeight: 1,
          transform: 'rotate(-2deg)',
        }}
        aria-hidden="true"
      >
        🗓️
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ fontWeight: 800, fontSize: '14px', fontFamily: mono, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
        {label}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--yodoku-ink-soft)' }}>{sublabel}</span>
      </span>
      <span style={{ marginLeft: 'auto', fontWeight: 900, fontSize: '18px' }} aria-hidden="true">→</span>
    </Link>
  );
}
