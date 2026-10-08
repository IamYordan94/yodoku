import { Link } from 'react-router-dom';

export default function SevenLettersAbout() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-black m-0" style={{ color: '#E7B10A', fontFamily: "'JetBrains Mono', monospace" }}>
          7 LETTERS
        </h2>
        <span className="text-[10px] px-2 py-0.5 font-black"
          style={{ background: '#E7B10A', color: '#fff', border: '2px solid #141414', borderRadius: '4px', transform: 'rotate(-1deg)' }}>
          seven
        </span>
      </div>

      <section className="p-6 space-y-3" style={{
        background: '#ffffff', border: '2.5px solid #141414', borderRadius: '12px', boxShadow: '4px 4px 0 #141414',
      }}>
        <h3 className="text-lg font-black" style={{ color: '#141414', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>What is it?</h3>
        <p className="text-sm leading-relaxed font-bold" style={{ color: '#6f6a5e' }}>
          7 Letters is a daily word-building game in the spirit of the classic "spelling bee" format.
          Each day you get seven letters arranged around one CENTER letter — and every single word you
          make must contain that center.
        </p>
        <p className="text-sm leading-relaxed font-bold" style={{ color: '#6f6a5e' }}>
          <strong style={{ color: '#141414' }}>The twist:</strong> every board is generated from the hub's own
          dictionary, and the daily score tiers are calibrated to each day's actual maximum possible score.
          Some boards are generous, some are brutal — but Good / Great / Genius always means the same thing.
        </p>
      </section>

      <section className="p-6 space-y-3" style={{
        background: '#ffffff', border: '2.5px solid #141414', borderRadius: '12px', boxShadow: '4px 4px 0 #141414',
      }}>
        <h3 className="text-lg font-black" style={{ color: '#141414', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>How to Play</h3>
        <ol className="text-sm space-y-2 list-none m-0 p-0 font-bold" style={{ color: '#6f6a5e' }}>
          <li className="flex gap-3">
            <span className="font-black w-5 flex-shrink-0" style={{ color: '#E7B10A' }}>1</span>
            <span>Words must be at least <strong style={{ color: '#141414' }}>3 letters</strong>, use only the seven board letters, and always include the center letter.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-black w-5 flex-shrink-0" style={{ color: '#E7B10A' }}>2</span>
            <span><span style={{ padding: '1px 6px', background: '#E7B10A', color: '#fff', border: '2px solid #141414', borderRadius: '3px', fontWeight: 800, fontSize: '10px' }}>SCORING</span> 3-letter words = 1 pt · longer words = 1 pt per letter.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-black w-5 flex-shrink-0" style={{ color: '#E7B10A' }}>3</span>
            <span>Find a word using <strong style={{ color: '#141414' }}>all 7 letters</strong> (a pangram) for a +7 bonus. Every board has at least one.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-black w-5 flex-shrink-0" style={{ color: '#E7B10A' }}>4</span>
            <span>Climb the tiers relative to the day's max score: <strong style={{ color: '#141414' }}>Good 35%</strong> · <strong style={{ color: '#141414' }}>Great 60%</strong> · <strong style={{ color: '#141414' }}>Genius 80%</strong>.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-black w-5 flex-shrink-0" style={{ color: '#E7B10A' }}>5</span>
            <span>Your progress saves automatically during the day. Copy your share card when you're done.</span>
          </li>
        </ol>
      </section>

      <section className="p-6 space-y-3" style={{
        background: '#ffffff', border: '2.5px solid #141414', borderRadius: '12px', boxShadow: '4px 4px 0 #141414',
      }}>
        <h3 className="text-lg font-black" style={{ color: '#141414', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>Fair Boards, Every Day</h3>
        <p className="text-sm leading-relaxed font-bold m-0" style={{ color: '#6f6a5e' }}>
          All 180 boards in the rotation were pre-computed with the full solver against our curated word list.
          Each one is guaranteed to have at least 25 valid words (most have far more) and at least one
          pangram — so no dead days.
        </p>
      </section>

      <p className="text-sm font-bold" style={{ color: '#6f6a5e' }}>
        <Link to="/" style={{ color: '#E7B10A' }} className="hover:underline">
          ← Back to Hub
        </Link>
      </p>
    </div>
  );
}
