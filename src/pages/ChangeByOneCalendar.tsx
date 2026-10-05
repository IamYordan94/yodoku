import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getTodayCboDateStr } from '../utils/cbo-dailyChallenge';
import { loadCboState } from '../utils/cbo-gameState';
import { showsPlusHint } from '../utils/monetization';
import { PlusSheet } from '../components/PlusLocked';

const FIRST_PUZZLE_DATE = '2026-03-01';

export default function ChangeByOneCalendar() {
  const todayStr = getTodayCboDateStr();
  const todayDate = new Date(todayStr + 'T00:00:00');
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [lockOpen, setLockOpen] = useState(false);

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

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

  const getStatus = (dateStr: string): 'completed' | 'in_progress' | 'available' => {
    const saved = loadCboState(dateStr);
    if (!saved) return 'available';
    if (saved.puzzles.every(p => p.status === 'won')) return 'completed';
    if (saved.puzzles.some(p => p.status === 'playing' || p.status === 'won')) return 'in_progress';
    return 'available';
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = getDateStr(day);
    const available = isDateAvailable(day);
    const isToday = dateStr === todayStr;
    const status = available ? getStatus(dateStr) : 'available';
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
                border: '1px solid var(--cbo-border-dark)',
                background: 'var(--cbo-surface-2)',
                color: 'var(--cbo-text-muted)',
                opacity: 0.75,
                cursor: 'pointer',
              }}
            >
              {day}
            </button>
          ) : (
          <Link
            to={isToday ? '/changebyone/play' : `/changebyone/play/${dateStr}`}
            className="w-full h-full flex items-center justify-center rounded text-sm font-semibold transition-colors"
            style={
              isToday
                ? {
                    border: '2px solid var(--cbo-accent)',
                    background: 'rgba(251,191,36,0.12)',
                    color: 'var(--cbo-accent)',
                  }
                : status === 'completed'
                ? {
                    border: '1px solid #4caf87',
                    background: 'rgba(76,175,135,0.12)',
                    color: '#2d8f68',
                  }
                : status === 'in_progress'
                ? {
                    border: '1px solid var(--cbo-highlight)',
                    background: 'rgba(251,191,36,0.08)',
                    color: 'var(--cbo-highlight)',
                  }
                : {
                    border: '1px solid var(--cbo-border)',
                    background: 'var(--cbo-surface)',
                    color: 'var(--cbo-text)',
                  }
            }
          >
            {day}
          </Link>
          )
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-sm"
            style={{ color: 'var(--cbo-border-dark)' }}
          >
            {day}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlusSheet open={lockOpen} onClose={() => setLockOpen(false)} context="Change by One" />
      <div className="flex items-center justify-between flex-wrap gap-y-2">
        <h2
          className="text-xl font-semibold"
          style={{ color: 'var(--cbo-accent)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          Previous Puzzles
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            disabled={isFirstMonth}
            className="p-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              border: '1px solid var(--cbo-border)',
              background: 'var(--cbo-surface)',
              color: 'var(--cbo-text-muted)',
            }}
            onMouseEnter={e => { if (!isFirstMonth) (e.currentTarget as HTMLElement).style.background = 'var(--cbo-surface-2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--cbo-surface)'; }}
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span
            className="font-semibold min-w-[140px] text-center"
            style={{ color: 'var(--cbo-text)' }}
          >
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="p-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              border: '1px solid var(--cbo-border)',
              background: 'var(--cbo-surface)',
              color: 'var(--cbo-text-muted)',
            }}
            onMouseEnter={e => { if (!isCurrentMonth) (e.currentTarget as HTMLElement).style.background = 'var(--cbo-surface-2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--cbo-surface)'; }}
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="text-sm space-y-1" style={{ color: 'var(--cbo-text-muted)' }}>
        <p>Click a date to replay that day's challenge.</p>
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ border: '2px solid var(--cbo-accent)', background: 'rgba(251,191,36,0.12)' }} />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ border: '1px solid #4caf87', background: 'rgba(76,175,135,0.12)' }} />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ border: '1px solid var(--cbo-highlight)', background: 'rgba(251,191,36,0.08)' }} />
            <span>In progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ border: '1px solid var(--cbo-border)', background: 'var(--cbo-surface)' }} />
            <span>Available</span>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div
        className="p-4 rounded"
        style={{
          background: 'var(--cbo-surface)',
          border: '1px solid var(--cbo-border)',
          borderBottom: '3px solid var(--cbo-border-dark)',
        }}
      >
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div
              key={d}
              className="text-center text-xs font-semibold py-2"
              style={{ color: 'var(--cbo-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
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
