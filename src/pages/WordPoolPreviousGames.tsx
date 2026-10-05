import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTodayDateStr, getDailyPuzzleIndex } from '../utils/dailySeed';
import { getWordPoolDailyEntry, isWordPoolDailyAllDone } from '../utils/storage';
import { showsPlusHint } from '../utils/monetization';
import { PlusSheet } from '../components/PlusLocked';

type Category = { id: string; name: string; levels: { level: number; name: string }[] };
type WordPoolData = { categories: Category[] };

const FIRST_PUZZLE_DATE = '2026-03-01';

export default function WordPoolPreviousGames() {
  const todayStr = getTodayDateStr();
  const todayDate = new Date(todayStr + 'T00:00:00');
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [data, setData] = useState<WordPoolData | null>(null);
  const [lockOpen, setLockOpen] = useState(false);

  useEffect(() => {
    fetch('/data/wordpool-categories.json')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const isCurrentMonth = currentMonth === todayDate.getMonth() && currentYear === todayDate.getFullYear();

  // March 2026 is the earliest month with puzzles
  const isFirstMonth = currentYear === 2026 && currentMonth === 2;

  const goToPrevMonth = () => {
    if (isFirstMonth) return;
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const getDateStr = (day: number): string => {
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  const isAvailable = (day: number): boolean => {
    const ds = getDateStr(day);
    return ds >= FIRST_PUZZLE_DATE && ds <= todayStr;
  };

  const getCategoryForDate = (dateStr: string): Category | null => {
    if (!data) return null;
    return data.categories[getDailyPuzzleIndex(dateStr, data.categories.length)];
  };

  const isCompleted = (dateStr: string): boolean => {
    const cat = getCategoryForDate(dateStr);
    if (!cat) return false;
    return isWordPoolDailyAllDone(dateStr, cat.levels.length);
  };

  const isInProgress = (dateStr: string): boolean => {
    if (isCompleted(dateStr)) return false;
    const entry = getWordPoolDailyEntry(dateStr);
    return entry.unlockedLevel > 1 || Object.keys(entry.levels).length > 0;
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`e-${i}`} className="aspect-square" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = getDateStr(day);
    const available = isAvailable(day);
    const completed = available && isCompleted(dateStr);
    const inProgress = available && isInProgress(dateStr);
    const isToday = dateStr === todayStr;
    const locked = available && showsPlusHint(dateStr);

    days.push(
      <div key={day} className="aspect-square">
        {available ? (
          locked ? (
            <button
              type="button"
              onClick={() => setLockOpen(true)}
              title="Yodoku+ archive — tap to unlock"
              className="w-full h-full flex items-center justify-center rounded text-sm font-semibold transition-colors"
              style={{ border: '1px solid var(--wp-border-dark)', background: 'var(--wp-surface-2)', color: 'var(--wp-text-muted)', opacity: 0.75, cursor: 'pointer' }}
            >
              {day}
            </button>
          ) : (
          <Link
            to={`/wordpool/${dateStr}`}
            title={getCategoryForDate(dateStr)?.name ?? ''}
            className="w-full h-full flex items-center justify-center rounded text-sm font-semibold transition-colors"
            style={
              isToday
                ? { border: '2px solid var(--wp-accent-blue-side)', background: 'rgba(94,139,165,0.15)', color: 'var(--wp-accent-blue-side)' }
                : completed
                ? { border: '1px solid #4caf87', background: 'rgba(76,175,135,0.12)', color: '#2d8f68' }
                : inProgress
                ? { border: '1px solid var(--wp-accent-pink)', background: 'rgba(232,183,181,0.15)', color: 'var(--wp-accent-pink-side)' }
                : { border: '1px solid var(--wp-border)', background: 'var(--wp-surface)', color: 'var(--wp-text)' }
            }
          >
            {day}
          </Link>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm"
            style={{ color: 'var(--wp-border-dark)' }}>
            {day}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlusSheet open={lockOpen} onClose={() => setLockOpen(false)} context="Word Pool" />
      <div className="flex items-center justify-between flex-wrap gap-y-2">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--wp-accent-blue-dark)' }}>
          Previous Puzzles
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={goToPrevMonth} disabled={isFirstMonth}
            className="p-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ border: '1px solid var(--wp-border)', background: 'var(--wp-surface)', color: 'var(--wp-text-muted)' }}
            onMouseEnter={e => { if (!isFirstMonth) (e.currentTarget as HTMLElement).style.background = 'var(--wp-surface-2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--wp-surface)'; }}
            aria-label="Previous month">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold min-w-[140px] text-center" style={{ color: 'var(--wp-text)' }}>
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button onClick={goToNextMonth} disabled={isCurrentMonth}
            className="p-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ border: '1px solid var(--wp-border)', background: 'var(--wp-surface)', color: 'var(--wp-text-muted)' }}
            onMouseEnter={e => { if (!isCurrentMonth) (e.currentTarget as HTMLElement).style.background = 'var(--wp-surface-2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--wp-surface)'; }}
            aria-label="Next month">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="text-sm space-y-1" style={{ color: 'var(--wp-text-muted)' }}>
        <p>Click a date to play that day's puzzle. Hover to see the category name.</p>
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ border: '2px solid var(--wp-accent-blue-side)', background: 'rgba(94,139,165,0.15)' }} />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ border: '1px solid #4caf87', background: 'rgba(76,175,135,0.12)' }} />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ border: '1px solid var(--wp-accent-pink)', background: 'rgba(232,183,181,0.15)' }} />
            <span>In progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ border: '1px solid var(--wp-border)', background: 'var(--wp-surface)' }} />
            <span>Available</span>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded p-4"
        style={{ background: 'var(--wp-surface)', border: '1px solid var(--wp-border)', borderBottom: '3px solid var(--wp-border-dark)' }}>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: 'var(--wp-text-muted)' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">{days}</div>
      </div>

      {!data && (
        <p className="text-sm animate-pulse" style={{ color: 'var(--wp-text-muted)' }}>Loading categories…</p>
      )}
    </div>
  );
}
