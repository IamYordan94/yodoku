// NextDailyCountdown.tsx — live countdown to the next daily reset.
// Sticker Pack styling; shared by the hub and game screens.

import { useEffect, useState } from 'react';
import { msUntilNextReset, formatCountdown, boundaryLabel, type ResetMode } from '../utils/nextReset';

const mono = "'JetBrains Mono', ui-monospace, monospace";

interface Props {
  /** Which calendar boundary the games in view roll over on. */
  mode?: ResetMode;
  accent?: string;
  /** Optional override for the caption. */
  caption?: string;
}

export default function NextDailyCountdown({ mode = 'utc', accent = 'var(--yodoku-lime)', caption }: Props) {
  const [ms, setMs] = useState(() => msUntilNextReset(mode));

  useEffect(() => {
    const id = window.setInterval(() => setMs(msUntilNextReset(mode)), 1000);
    return () => window.clearInterval(id);
  }, [mode]);

  return (
    <div
      role="timer"
      aria-label="Time until the next daily puzzles"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        background: 'var(--yodoku-panel)',
        border: '2.5px solid var(--yodoku-ink)',
        borderRadius: '12px',
        boxShadow: '5px 5px 0 var(--yodoku-ink)',
        padding: '10px 14px',
      }}
    >
      <span
        style={{
          background: accent,
          color: 'var(--yodoku-dark, #1E2028)',
          border: '2px solid var(--yodoku-ink)',
          borderRadius: '4px',
          padding: '3px 8px',
          fontSize: '10px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          transform: 'rotate(-1deg)',
          fontFamily: mono,
        }}
      >
        next daily
      </span>
      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--yodoku-ink-soft)' }}>
        {caption ?? 'Fresh puzzles in'}
      </span>
      <span
        style={{
          fontFamily: mono,
          fontWeight: 800,
          fontSize: '20px',
          letterSpacing: '0.06em',
          color: 'var(--yodoku-ink)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatCountdown(ms)}
      </span>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yodoku-ink-soft)', marginLeft: 'auto' }}>
        resets {boundaryLabel(mode)}
      </span>
    </div>
  );
}
