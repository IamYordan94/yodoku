import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getTodayDateStr } from '../utils/dailySeed';
import { getLetterMixCompletedFor } from '../utils/storage';
import { showsPlusHint } from '../utils/monetization';
import { PlusSheet } from '../components/PlusLocked';

const LEVELS = ['easy', 'medium', 'hard'] as const;
const FIRST_PUZZLE_DATE = '2026-03-01';

export default function LetterMixCalendar() {
  const todayStr = getTodayDateStr();
  const todayDate = new Date(todayStr + 'T00:00:00');
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [selectedLevel, setSelectedLevel] = useState<(typeof LEVELS)[number]>('easy');
  const [lockOpen, setLockOpen] = useState(false);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const isCurrentMonth =
    currentMonth === todayDate.getMonth() && currentYear === todayDate.getFullYear();

  // March 2026 is the earliest month with puzzles
  const isFirstMonth = currentYear === 2026 && currentMonth === 2;

  const goToPreviousMonth = () => {
    if (isFirstMonth) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDateStr = (day: number): string => {
    const month = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${currentYear}-${month}-${dayStr}`;
  };

  const isDateAvailable = (day: number): boolean => {
    const dateStr = getDateStr(day);
    return dateStr >= FIRST_PUZZLE_DATE && dateStr <= todayStr;
  };

  const hasCompletedPuzzle = (day: number): boolean => {
    if (!isDateAvailable(day)) return false;
    const dateStr = getDateStr(day);
    return LEVELS.some(level => getLetterMixCompletedFor(dateStr, level) !== undefined);
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = getDateStr(day);
    const available = isDateAvailable(day);
    const completed = hasCompletedPuzzle(day);
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
              style={{
                border: '1px solid var(--lm-border)',
                background: 'var(--lm-key-face)',
                color: 'var(--lm-text-faint)',
                opacity: 0.75,
                cursor: 'pointer',
              }}
            >
              {day}
            </button>
          ) : (
          <Link
            to={`/lettermix/play/${dateStr}/${selectedLevel}`}
            className="w-full h-full flex items-center justify-center rounded text-sm font-semibold transition-colors"
            style={
              isToday
                ? {
                    border: '2px solid var(--lm-accent)',
                    background: 'rgba(214,59,59,0.12)',
                    color: 'var(--lm-accent)',
                  }
                : completed
                ? {
                    border: '1px solid #4caf87',
                    background: 'rgba(76,175,135,0.12)',
                    color: '#2d8f68',
                  }
                : {
                    border: '1px solid var(--lm-border)',
                    background: 'var(--lm-key-face)',
                    color: 'var(--lm-text)',
                  }
            }
          >
            {day}
          </Link>
          )
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-sm"
            style={{ color: 'var(--lm-text-faint)' }}
          >
            {day}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlusSheet open={lockOpen} onClose={() => setLockOpen(false)} context="Clear the String" />
      <div className="flex items-center justify-between flex-wrap gap-y-2">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--lm-accent)' }}>Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            disabled={isFirstMonth}
            className="p-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              border: '1px solid var(--lm-border)',
              background: 'var(--lm-surface)',
              color: 'var(--lm-text-muted)',
            }}
            onMouseEnter={e => { if (!isFirstMonth) (e.currentTarget as HTMLElement).style.background = 'var(--lm-key-face)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lm-surface)'; }}
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold min-w-[140px] text-center" style={{ color: 'var(--lm-text)' }}>
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="p-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              border: '1px solid var(--lm-border)',
              background: 'var(--lm-surface)',
              color: 'var(--lm-text-muted)',
            }}
            onMouseEnter={e => { if (!isCurrentMonth) (e.currentTarget as HTMLElement).style.background = 'var(--lm-key-face)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lm-surface)'; }}
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Difficulty selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--lm-text-muted)' }}>
          Open as:
        </span>
        <div className="flex gap-2">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className="px-3 py-1 rounded text-xs font-semibold capitalize transition-colors"
              style={
                lvl === selectedLevel
                  ? {
                      background: 'var(--lm-accent)',
                      color: '#fff',
                      border: '1px solid var(--lm-accent-dark)',
                    }
                  : {
                      border: '1px solid var(--lm-border)',
                      color: 'var(--lm-text-muted)',
                      background: 'transparent',
                    }
              }
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="text-sm space-y-1" style={{ color: 'var(--lm-text-muted)' }}>
        <p>Click a date to play that day's puzzle.</p>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ border: '2px solid var(--lm-accent)', background: 'rgba(214,59,59,0.12)' }} />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ border: '1px solid #4caf87', background: 'rgba(76,175,135,0.12)' }} />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ border: '1px solid var(--lm-border)', background: 'var(--lm-key-face)' }} />
            <span>Available</span>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div
        className="p-4 rounded"
        style={{
          background: 'var(--lm-surface)',
          border: '1px solid var(--lm-border)',
          borderBottom: '3px solid var(--lm-border-dark)',
        }}
      >
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div
              key={d}
              className="text-center text-xs font-semibold py-2"
              style={{ color: 'var(--lm-text-faint)' }}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>
      </div>
    </div>
  );
}
