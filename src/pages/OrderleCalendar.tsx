import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { OrderlePuzzle } from '../utils/orderleLogic';
import { showsPlusHint } from '../utils/monetization';
import { LockBadge, PlusSheet } from '../components/PlusLocked';

const LAUNCH_DATE = '2026-08-07';
const DAY_MS = 86400000;

function puzzleIndexForDate(dateStr: string, count: number): number {
  const utcDay = (s: string) => {
    const d = new Date(s + 'T00:00:00Z');
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };
  const days = Math.floor((utcDay(dateStr) - utcDay(LAUNCH_DATE)) / DAY_MS);
  return ((days % count) + count) % count;
}

export default function OrderleCalendar() {
  const [puzzles, setPuzzles] = useState<OrderlePuzzle[]>([]);
  const [lockOpen, setLockOpen] = useState(false);

  useEffect(() => {
    fetch('/data/dailybrain-puzzles.json')
      .then(r => r.json())
      .then(data => setPuzzles(data.orderle || []))
      .catch(() => {});
  }, []);

  // Generate past dates
  const dates: { dateStr: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 19; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const isToday = i === 0;
    dates.push({
      dateStr: ds,
      label: isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    });
  }

  return (
    <div className="space-y-4">
      <PlusSheet open={lockOpen} onClose={() => setLockOpen(false)} context="ORDERLE" />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--ol-ink)' }}>
          ORDERLE
          <span className="text-xs px-2 py-0.5 font-bold" style={{ background: '#d9f24b', border: '2px solid var(--ol-ink)', borderRadius: '4px' }}>
            calendar
          </span>
        </h2>
        <Link to="/orderle" className="text-sm font-bold" style={{ color: 'var(--ol-ink-soft)', textDecoration: 'none' }}>
          ← Back
        </Link>
      </div>

      <p className="text-sm font-bold" style={{ color: 'var(--ol-ink-soft)' }}>
        Browse past puzzles. Puzzles cycle every 74 days with a new puzzle every day.
      </p>

      <div className="flex flex-col gap-3">
        {dates.map((d, i) => {
          const idx = puzzleIndexForDate(d.dateStr, puzzles.length);
          const p = puzzles[idx];
          const locked = showsPlusHint(d.dateStr);
          const tile = (
            <div style={{
              background: 'var(--ol-panel)', border: '2.5px solid var(--ol-ink)',
              borderRadius: '12px', padding: '14px 18px',
              boxShadow: i === 0 ? '6px 6px 0 var(--ol-ink)' : '4px 4px 0 var(--ol-ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
              opacity: locked ? 0.72 : p ? 1 : 0.5,
            }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-black text-sm" style={{ color: 'var(--ol-ink)' }}>{d.label}</span>
                  {i === 0 && <span className="text-[10px] px-2 py-0.5 font-bold rounded" style={{ background: '#d9f24b', border: '2px solid var(--ol-ink)' }}>today</span>}
                </div>
                {p && <p className="text-xs font-bold mt-1 truncate" style={{ color: 'var(--ol-ink-soft)' }}>{p.rule}</p>}
              </div>
              {locked ? <LockBadge /> : (
                <span className="text-xs font-bold flex-shrink-0 px-2 py-1 rounded"
                  style={{ background: '#39c96b', color: '#141414', border: '2px solid var(--ol-ink)' }}>
                  #{idx} · {p?.difficulty || '?'}
                </span>
              )}
            </div>
          );
          return locked ? (
            <button key={d.dateStr} type="button" onClick={() => setLockOpen(true)} className="w-full text-left"
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
              {tile}
            </button>
          ) : (
            <Link key={d.dateStr} to={`/orderle/play?date=${d.dateStr}`} className="w-full text-left" style={{ textDecoration: 'none' }}>
              {tile}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
