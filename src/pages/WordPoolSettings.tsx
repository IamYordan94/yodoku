import { useState } from 'react';
import { getWordPoolDailyCompletedDates, WP_PROGRESS } from '../utils/storage';

const WP_DAILY = 'yodoku_wordpool_daily';
const WP_DAILY_SESSION = 'yodoku_wordpool_daily_session';
const WP_SESSION = 'yodoku_wordpool_session';

export default function WordPoolSettings() {
  const [resetDone, setResetDone] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const completedDates = getWordPoolDailyCompletedDates();
  const totalDays = completedDates.length;

  // Count total levels completed across all daily entries
  let totalLevels = 0;
  try {
    const s = localStorage.getItem(WP_DAILY);
    if (s) {
      const store = JSON.parse(s) as Record<string, { levels: Record<string, unknown> }>;
      for (const entry of Object.values(store)) {
        totalLevels += Object.keys(entry.levels).length;
      }
    }
  } catch { /* ignore */ }

  const handleReset = () => {
    localStorage.removeItem(WP_DAILY);
    localStorage.removeItem(WP_DAILY_SESSION);
    localStorage.removeItem(WP_PROGRESS);
    localStorage.removeItem(WP_SESSION);
    setResetDone(true);
    setConfirmReset(false);
    setTimeout(() => setResetDone(false), 3000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold" style={{ color: 'var(--wp-accent-blue-dark)' }}>
        Settings
      </h2>

      {/* Stats */}
      <section className="p-5 space-y-3"
        style={{ background: 'var(--wp-surface)', border: '1px solid var(--wp-border)',
          borderBottom: '3px solid var(--wp-border-dark)', borderRadius: '6px' }}>
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--wp-accent-blue-dark)' }}>
          Your Progress
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="px-4 py-3 text-center rounded"
            style={{ background: 'var(--wp-bg)', border: '1px solid var(--wp-border)' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--wp-text)' }}>{totalDays}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--wp-text-muted)' }}>Daily puzzles completed</p>
          </div>
          <div className="px-4 py-3 text-center rounded"
            style={{ background: 'var(--wp-bg)', border: '1px solid var(--wp-border)' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--wp-text)' }}>{totalLevels}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--wp-text-muted)' }}>Total levels cleared</p>
          </div>
        </div>
      </section>

      {/* Reset Progress */}
      <section className="p-5 space-y-3"
        style={{ background: 'var(--wp-surface)', border: '1px solid var(--wp-border)',
          borderBottom: '3px solid var(--wp-border-dark)', borderRadius: '6px' }}>
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--wp-accent-blue-dark)' }}>
          Reset
        </h3>
        <p className="text-sm" style={{ color: 'var(--wp-text-muted)' }}>
          Reset all puzzle progress. This cannot be undone.
        </p>
        {resetDone ? (
          <p className="text-sm font-medium" style={{ color: '#2d8f68' }}>Progress reset successfully.</p>
        ) : confirmReset ? (
          <div className="flex gap-3">
            <button onClick={handleReset} className="px-4 py-2 rounded text-sm font-semibold"
              style={{ background: '#e05252', color: '#fff', border: '1px solid #c43c3c' }}>
              Yes, reset everything
            </button>
            <button onClick={() => setConfirmReset(false)} className="px-4 py-2 rounded text-sm font-semibold"
              style={{ border: '1px solid var(--wp-border)', color: 'var(--wp-text-muted)', background: 'transparent' }}>
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)} className="px-4 py-2 rounded text-sm font-semibold"
            style={{ border: '1px solid rgba(224,82,82,0.5)', color: '#c43c3c', background: 'transparent' }}>
            Reset all progress
          </button>
        )}
      </section>

      {/* About */}
      <section className="p-5 space-y-3"
        style={{ background: 'var(--wp-surface)', border: '1px solid var(--wp-border)',
          borderBottom: '3px solid var(--wp-border-dark)', borderRadius: '6px' }}>
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--wp-accent-blue-dark)' }}>
          About WordPool
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--wp-text-muted)' }}>
          WordPool challenges you to name words fitting a category with progressively narrower constraints.
          One new category every day. Progress is saved locally in your browser.
        </p>
        <p className="text-xs" style={{ color: 'var(--wp-text-muted)' }}>Version 1.0 · Yodoku</p>
      </section>
    </div>
  );
}
