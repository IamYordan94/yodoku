// DailySummaryShare.tsx — one share action for everything played today.
// Uses the existing share infrastructure: the native system sheet in the app
// (@capacitor/share via shareNative), the Web Share API on supported browsers,
// and clipboard as the final fallback. Also offers the sticker share card.

import { useMemo, useState } from 'react';
import ShareCardModal from './ShareCardModal';
import { getDailySummary } from '../utils/dailySummary';
import { isNativeApp } from '../utils/platform';
import { shareNative, hapticTap } from '../utils/nativeShell';

const mono = "'JetBrains Mono', ui-monospace, monospace";
const SITE_URL = 'https://www.yodoku.app';

export default function DailySummaryShare() {
  const summary = useMemo(() => getDailySummary(), []);
  const [cardOpen, setCardOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const native = isNativeApp();

  const share = async () => {
    hapticTap();
    const text = summary.text;
    if (native) {
      const res = await shareNative({ title: 'My Yodoku today', text, url: SITE_URL });
      if (res.shared) return;
    }
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
    };
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title: 'My Yodoku today', text, url: SITE_URL });
        return;
      } catch {
        // user cancelled or unsupported — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const cardLines = summary.items.map((i) => `${i.played ? '✓' : '·'} ${i.label} — ${i.short}`);
  if (cardLines.length < 8) {
    cardLines.push(summary.playedCount > 0 ? `${summary.playedCount}/7 games played today` : 'Nothing played yet today');
  }

  return (
    <div
      style={{
        background: 'var(--yodoku-panel)',
        border: '2.5px solid var(--yodoku-ink)',
        borderRadius: '12px',
        boxShadow: '5px 5px 0 var(--yodoku-ink)',
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <span
          style={{
            background: 'var(--yodoku-lime)',
            color: 'var(--yodoku-dark)',
            border: '2px solid var(--yodoku-ink)',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '10px',
            fontWeight: 800,
            textTransform: 'uppercase',
            transform: 'rotate(-1deg)',
            fontFamily: mono,
          }}
        >
          today&apos;s summary
        </span>
        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--yodoku-ink)', fontFamily: mono }}>
          {summary.playedCount}/7 played
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
        {summary.items.map((i) => (
          <span
            key={i.id}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              border: '2px solid var(--yodoku-ink)',
              background: i.played ? 'var(--yodoku-lime)' : 'var(--yodoku-bg)',
              opacity: i.played ? 1 : 0.6,
              color: 'var(--yodoku-ink)',
            }}
          >
            {i.played ? '✓' : '·'} {i.label}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={share}
          style={{
            background: 'var(--yodoku-ink)',
            color: 'var(--yodoku-bg)',
            border: '2.5px solid var(--yodoku-ink)',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 800,
            fontSize: '13px',
            boxShadow: '3px 3px 0 rgba(0,0,0,0.25)',
            cursor: 'pointer',
            fontFamily: mono,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {copied ? 'Copied!' : native ? 'Share summary' : 'Share my day'}
        </button>
        <button
          onClick={() => setCardOpen(true)}
          style={{
            background: 'var(--yodoku-panel)',
            color: 'var(--yodoku-ink)',
            border: '2.5px solid var(--yodoku-ink)',
            borderRadius: '8px',
            padding: '8px 14px',
            fontWeight: 700,
            fontSize: '13px',
            boxShadow: '3px 3px 0 rgba(0,0,0,0.15)',
            cursor: 'pointer',
          }}
        >
          Sticker card
        </button>
      </div>

      <ShareCardModal
        open={cardOpen}
        onClose={() => setCardOpen(false)}
        options={{
          gameId: 'yodoku-daily-summary',
          title: 'My Yodoku Today',
          accentColor: '#d9f24b',
          lines: cardLines,
        }}
        shareText={summary.text}
      />
    </div>
  );
}
