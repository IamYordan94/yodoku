import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Past 7 Letters boards. Every board in the data file is playable via
// /seven/play?board=N (the daily rotation walks all board indices).

interface Board {
  id: number;
  letters: string[];
  center: string;
  words: string[];
  maxScore: number;
}

export default function SevenArchive() {
  const [boards, setBoards] = useState<Board[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/seven-boards.json')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j: { boards: Board[] }) => { if (!cancelled) setBoards(j.boards); })
      .catch(() => { if (!cancelled) setBoards([]); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black m-0" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--sv-ink)' }}>
          7 LETTERS ARCHIVE
        </h2>
        <Link to="/seven" className="text-sm font-bold underline" style={{ color: 'var(--sv-ink-soft)' }}>← 7 Letters home</Link>
      </div>

      {!boards ? (
        <p className="text-sm font-bold" style={{ color: 'var(--sv-ink-soft)' }}>Loading boards…</p>
      ) : (
        <>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--sv-ink-soft)' }}>
            {boards.length} boards to replay. Practice boards don&apos;t affect your daily progress.
          </p>
          <div className="flex flex-col gap-2">
            {[...boards].sort((a, b) => b.id - a.id).map((b) => (
              <Link
                key={b.id}
                to={`/seven/play?board=${b.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{
                  background: 'var(--sv-panel)',
                  border: '2.5px solid var(--sv-ink)',
                  borderRadius: '10px',
                  boxShadow: '3px 3px 0 var(--sv-ink)',
                  textDecoration: 'none',
                  color: 'var(--sv-ink)',
                }}
              >
                <span className="flex flex-col">
                  <span className="font-black text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Board #{b.id}
                  </span>
                  <span className="text-xs font-bold" style={{ color: 'var(--sv-ink-soft)' }}>
                    {b.center.toUpperCase()}+{b.letters.filter((l) => l !== b.center).map((l) => l.toUpperCase()).join('')} · {b.words.length} words
                  </span>
                </span>
                <span className="font-black text-sm" style={{ color: '#b3870a' }}>Play →</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
