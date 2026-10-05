// ResumeBanner.tsx — "picked up where you left off" sticker shown when a game
// restores saved in-progress state on re-entry.

export default function ResumeBanner({ date, accent = 'var(--yodoku-lime)' }: { date?: string; accent?: string }) {
  return (
    <div
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: accent,
        border: '2.5px solid var(--yodoku-ink)',
        borderRadius: '10px',
        boxShadow: '4px 4px 0 var(--yodoku-ink)',
        padding: '6px 12px',
        transform: 'rotate(-1deg)',
        marginBottom: '10px',
      }}
    >
      <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--yodoku-dark, #1E2028)' }}>
        ↩ Continued where you left off{date ? ` · ${date}` : ''}
      </span>
    </div>
  );
}
