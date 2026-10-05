import { Link } from 'react-router-dom';
import { getQuizNumber } from '../utils/quizLogic';
import { getTodayUTCStr } from '../utils/dailySeed';

// Past Quiz Master puzzles. buildDailyQuiz is deterministic for any date, so an
// archive entry is just /quiz/play?date=YYYY-MM-DD — the same 10 questions the
// player would have seen that day.
const DAYS = 30;
const LAUNCH_UTC = Date.UTC(2026, 7, 22);

function recentDates(): string[] {
  const out: string[] = [];
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const maxBack = Math.min(DAYS, Math.floor((todayUtc - LAUNCH_UTC) / 86400000));
  for (let d = 1; d <= maxBack; d++) {
    out.push(new Date(todayUtc - d * 86400000).toISOString().slice(0, 10));
  }
  return out;
}

export default function QuizArchive() {
  const today = getTodayUTCStr();
  const dates = recentDates();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black m-0" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--qz-ink)' }}>
          QUIZ ARCHIVE
        </h2>
        <Link to="/quiz" className="text-sm font-bold underline" style={{ color: 'var(--qz-ink-soft)' }}>← Quiz home</Link>
      </div>

      <p className="text-sm font-semibold mb-4" style={{ color: 'var(--qz-ink-soft)' }}>
        Play any quiz from the last {dates.length} days. Same questions for everyone on that date.
      </p>

      <div className="flex flex-col gap-2">
        {dates.map((d) => (
          <Link
            key={d}
            to={`/quiz/play?date=${d}`}
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={{
              background: 'var(--qz-panel)',
              border: '2.5px solid var(--qz-ink)',
              borderRadius: '10px',
              boxShadow: '3px 3px 0 var(--qz-ink)',
              textDecoration: 'none',
              color: 'var(--qz-ink)',
            }}
          >
            <span className="flex flex-col">
              <span className="font-black text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Quiz #{getQuizNumber(d)}
              </span>
              <span className="text-xs font-bold" style={{ color: 'var(--qz-ink-soft)' }}>{d}</span>
            </span>
            <span className="font-black text-sm" style={{ color: 'var(--qz-accent)' }}>Play →</span>
          </Link>
        ))}
      </div>

      <p className="text-xs font-bold mt-4" style={{ color: 'var(--qz-ink-soft)' }}>
        Today is {today}. Archive plays don&apos;t change your daily streak.
      </p>
    </div>
  );
}
