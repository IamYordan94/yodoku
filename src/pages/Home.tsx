import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import AdSlot from '../components/AdSlot';
import InstallSticker from '../components/InstallSticker';
import NativeReminderCard from '../components/NativeReminderCard';
import NewsletterSignup from '../components/NewsletterSignup';
import NextDailyCountdown from '../components/NextDailyCountdown';
import DailySummaryShare from '../components/DailySummaryShare';
import { getTodayProgress } from '../utils/dailyProgress';

type GameCardProps = {
  delay?: number;
  accentColor: string;
  accentSide: string;
  textColor: string;
  label: string;
  sticker: string;
  stickerColor: string;
  description: string;
  tags: string[];
  playTo: string;
  aboutTo: string;
  disabled?: boolean;
};

function GameCard({
  delay = 0,
  accentColor,
  accentSide,
  textColor,
  label,
  sticker,
  stickerColor,
  description,
  tags,
  playTo,
  aboutTo,
  disabled = false,
}: GameCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.22 }}
      style={{
        background: 'var(--yodoku-panel)',
        border: '2.5px solid var(--yodoku-ink)',
        borderRadius: '12px',
        boxShadow: '6px 6px 0 var(--yodoku-ink)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {/* Accent strip */}
      <div style={{ height: '5px', width: '100%', flexShrink: 0, background: accentColor }} />

      <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
        {/* Label + sticker */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="text-[15px] font-black uppercase tracking-[0.08em] m-0"
            style={{ color: textColor, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
            {label}
          </h2>
          {!disabled && (
            <span style={{
              background: stickerColor,
              color: 'var(--yodoku-ink)',
              padding: '2px 8px',
              border: '2px solid var(--yodoku-ink)',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 800,
              transform: 'rotate(1deg)',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
            }}>
              {sticker}
            </span>
          )}
          {disabled && (
            <span style={{
              background: 'var(--yodoku-gray)',
              color: 'var(--yodoku-ink-soft)',
              padding: '2px 8px',
              border: '2px solid var(--yodoku-ink)',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              soon
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm leading-[1.55] font-semibold m-0" style={{ color: 'var(--yodoku-ink-soft)' }}>
          {description}
        </p>

        {/* Tags row */}
        <div className="flex flex-wrap gap-[7px]">
          {tags.map((t, i) => (
            <span key={t} style={{
              background: 'var(--yodoku-bg)',
              color: 'var(--yodoku-ink-soft)',
              border: '2px solid var(--yodoku-ink)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 700,
              transform: `rotate(${i % 2 === 0 ? '-0.5deg' : '0.5deg'})`,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {t}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-[10px] mt-auto pt-1">
          {disabled ? (
            <span
              className="opacity-40 cursor-not-allowed"
              style={{
                background: accentColor,
                color: '#fff',
                border: '2.5px solid var(--yodoku-ink)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '13px',
                boxShadow: `3px 3px 0 ${accentSide}`,
              }}
            >
              Locked
            </span>
          ) : (
            <Link
              to={playTo}
              style={{
                background: 'var(--yodoku-ink)',
                color: 'var(--yodoku-bg)',
                border: '2.5px solid var(--yodoku-ink)',
                borderRadius: '8px',
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
                boxShadow: '3px 3px 0 rgba(0,0,0,0.2)',
              }}
            >
              Play
            </Link>
          )}
          <Link
            to={aboutTo}
            style={{
              background: 'var(--yodoku-panel)',
              color: 'var(--yodoku-ink)',
              border: '2.5px solid var(--yodoku-ink)',
              borderRadius: '8px',
              padding: '8px 14px',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
              boxShadow: '3px 3px 0 rgba(0,0,0,0.1)',
            }}
          >
            {disabled ? 'Suggest' : 'About'}
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export default function Home() {
  const progress = useMemo(() => getTodayProgress(), []);
  const doneCount = progress.filter((g) => g.played).length;

  // First-visit "start here" sticker: shown until the visitor has played anything.
  const [showStarter, setShowStarter] = useState(false);
  useEffect(() => {
    let starter = false;
    try {
      starter = localStorage.getItem('yodoku_firstvisit_done') !== '1';
    } catch {
      starter = true;
    }
    if (starter && doneCount === 0) {
      setShowStarter(true);
    } else if (doneCount > 0) {
      try {
        localStorage.setItem('yodoku_firstvisit_done', '1');
      } catch {
        // ignore
      }
    }
  }, [doneCount]);

  const dismissStarter = () => {
    setShowStarter(false);
    try {
      localStorage.setItem('yodoku_firstvisit_done', '1');
    } catch {
      // ignore
    }
  };

  // Deep link: /#games scrolls straight to the games grid (used by the "Keep playing free" button on /plus).
  const location = useLocation();
  useEffect(() => {
    if (location.hash !== '#games') return;
    const t = window.setTimeout(() => {
      document.getElementById('games')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => window.clearTimeout(t);
  }, [location.hash]);

  return (
    <div style={{ background: 'var(--yodoku-bg)', minHeight: '100vh', color: 'var(--yodoku-ink)' }}>
      {/* Masthead */}
      <header
        className="px-5 py-5 flex flex-col items-start gap-1"
        style={{
          background: 'var(--yodoku-dark)',
          borderBottom: '3px solid var(--yodoku-ink)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1
            className="text-[22px] md:text-[26px] font-black uppercase tracking-[0.14em] m-0"
            style={{
              color: 'var(--yodoku-bg)',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              letterSpacing: '0.14em',
            }}
          >
            Yodoku
          </h1>
          <span style={{
            background: 'var(--yodoku-lime)',
            color: 'var(--yodoku-dark)',
            padding: '2px 10px',
            border: '2px solid var(--yodoku-bg)',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 800,
            transform: 'rotate(-1deg)',
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
          }}>
            7 games
          </span>
          <Link
            to="/plus"
            className="ml-auto"
            style={{
              background: 'linear-gradient(180deg,#2a2d38,#1E2028)',
              color: 'var(--yodoku-lime)',
              border: '2px solid var(--yodoku-lime)',
              borderRadius: '999px',
              padding: '5px 13px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textDecoration: 'none',
            }}
          >
            YODOKU+ ✦
          </Link>
        </div>
        <p
          className="text-sm font-semibold m-0"
          style={{ color: 'rgba(255,255,255,0.42)', letterSpacing: '0.02em' }}
        >
          Seven daily games. One minute each. Free forever.
        </p>
      </header>

      {/* Ticker bar */}
      <div style={{
        background: 'var(--yodoku-ink)',
        color: 'var(--yodoku-bg)',
        padding: '4px 0',
        fontWeight: 800,
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <span style={{ display: 'inline-block', animation: 'marquee 22s linear infinite' }}>
          seven daily games · one minute each · free forever · no signup · share your score &nbsp;&nbsp;&nbsp;
          seven daily games · one minute each · free forever · no signup · share your score &nbsp;&nbsp;&nbsp;
        </span>
      </div>

      {/* Countdown to the next daily reset — in the hub header area */}
      <div className="px-4 md:px-6 max-w-[1040px] mx-auto mt-5">
        <NextDailyCountdown mode="utc" />
      </div>

      {/* Today progress strip */}
      <div className="px-4 md:px-6 max-w-[1040px] mx-auto mt-5">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            background: 'var(--yodoku-panel)',
            border: '2.5px solid var(--yodoku-ink)',
            borderRadius: '12px',
            boxShadow: '4px 4px 0 var(--yodoku-ink)',
            padding: '10px 12px',
          }}
        >
          <span
            className="text-[10px] font-black uppercase tracking-[0.14em]"
            style={{ color: 'var(--yodoku-ink-soft)', fontFamily: "'JetBrains Mono', monospace", marginRight: '2px' }}
          >
            TODAY · {doneCount}/7 PLAYED
          </span>
          {progress.map((g) => (
            <Link
              key={g.id}
              to={g.to}
              title={g.label}
              style={{
                display: 'inline-block',
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                border: '2.5px solid var(--yodoku-ink)',
                background: g.played ? g.accent : 'var(--yodoku-bg)',
                boxShadow: g.played ? '2px 2px 0 var(--yodoku-ink)' : 'none',
                opacity: g.played ? 1 : 0.55,
              }}
            >
              &nbsp;
            </Link>
          ))}
        </div>
      </div>

      {/* Combined daily summary + share (feature: one share for everything today) */}
      <div className="px-4 md:px-6 max-w-[1040px] mx-auto mt-4">
        <DailySummaryShare />
      </div>

      {/* Dismissible "get the daily puzzles by email" opt-in (daily 08:30 reminder) */}
      <div className="px-4 md:px-6 max-w-[1040px] mx-auto mt-4">
        <NewsletterSignup />
      </div>

      {/* Daily reminder (native app only) */}
      <NativeReminderCard />

      {/* First-visit starter sticker */}
      {showStarter && (
        <div className="px-4 md:px-6 max-w-[1040px] mx-auto mt-4">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--yodoku-lime)',
              border: '2.5px solid var(--yodoku-ink)',
              borderRadius: '12px',
              boxShadow: '5px 5px 0 var(--yodoku-ink)',
              padding: '10px 16px',
              transform: 'rotate(-1.5deg)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--yodoku-dark)' }}>
              NEW HERE? <Link to="/orderle" style={{ textDecoration: 'underline', color: 'var(--yodoku-dark)' }}>Start with today's ORDERLE →</Link>
            </span>
            <button
              onClick={dismissStarter}
              aria-label="Dismiss starter sticker"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '14px', color: 'var(--yodoku-dark)', padding: '0 2px' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Install prompt */}
      <InstallSticker />

      {/* Games section - its own band, clearly separated from the info blocks above */}
      <section id="games" style={{ marginTop: '40px', scrollMarginTop: '14px' }}>
        <div
          style={{
            background: 'var(--yodoku-dark)',
            borderTop: '3px solid var(--yodoku-ink)',
            borderBottom: '3px solid var(--yodoku-ink)',
            padding: '13px 0',
          }}
        >
          <div
            className="px-4 md:px-6 max-w-[1040px] mx-auto flex items-center"
            style={{ gap: '12px' }}
          >
            <span
              className="text-[12px] font-black uppercase"
              style={{
                color: 'var(--yodoku-bg)',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.18em',
              }}
            >
              Today&rsquo;s games
            </span>
            <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.16)' }} />
            <span
              style={{
                background: 'var(--yodoku-lime)',
                color: 'var(--yodoku-dark)',
                padding: '3px 10px',
                border: '2px solid var(--yodoku-bg)',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 800,
                transform: 'rotate(-1deg)',
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        <main className="p-4 md:p-6 max-w-[1040px] mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {/* Game 1: Clear the String */}
          <GameCard
            delay={0}
            accentColor="#D63B3B"
            accentSide="#7A1F1F"
            textColor="#C03030"
            label="Clear the String"
            sticker="word"
            stickerColor="#ffc93c"
            description="Find the solution words tucked inside a scrambled string — and clear every single letter."
            tags={['daily', 'word', 'puzzle']}
            playTo="/lettermix"
            aboutTo="/lettermix/about"
          />

          {/* Game 2: Change by One */}
          <GameCard
            delay={0.06}
            accentColor="#3E9FA8"
            accentSide="#1E5A61"
            textColor="#2C7A82"
            label="Change by One"
            sticker="ladder"
            stickerColor="#5bc9ff"
            description="Transform a word into another, one letter at a time. Every step must be a real word."
            tags={['daily', 'ladder', 'words']}
            playTo="/changebyone"
            aboutTo="/changebyone/about"
          />

          {/* Game 3: Word Pool */}
          <GameCard
            delay={0.12}
            accentColor="#9FC3DA"
            accentSide="#4E86A8"
            textColor="#4E86A8"
            label="Word Pool"
            sticker="category"
            stickerColor="#d9f24b"
            description="Name every word in the category. Each level narrows the constraint until only a handful qualify."
            tags={['category', 'vocab', 'levels']}
            playTo="/wordpool"
            aboutTo="/wordpool/about"
          />

          {/* Game 4: ORDERLE */}
          <GameCard
            delay={0.18}
            accentColor="#39c96b"
            accentSide="#1e7a3d"
            textColor="#2a9f52"
            label="ORDERLE"
            sticker="sequence"
            stickerColor="#d9f24b"
            description="Put a handful of items in the correct order — one swap at a time. Then learn why the order matters."
            tags={['daily', 'sequence', 'logic']}
            playTo="/orderle"
            aboutTo="/orderle/about"
          />

          {/* Game 5: FERMI */}
          <GameCard
            delay={0.24}
            accentColor="#ff6b35"
            accentSide="#a8401f"
            textColor="#d4542a"
            label="FERMI"
            sticker="estimate"
            stickerColor="#ffc93c"
            description="Guess the real-world number. Learn orders of magnitude. Calibrate your intuition — one question a day."
            tags={['daily', 'quantity', 'science']}
            playTo="/fermi"
            aboutTo="/fermi/about"
          />

          {/* Game 6: Quiz Master */}
          <GameCard
            delay={0.30}
            accentColor="#8B5CF6"
            accentSide="#5B3FA8"
            textColor="#6D4BD8"
            label="Quiz Master"
            sticker="trivia"
            stickerColor="#ffc93c"
            description="Ten questions a day across eleven categories. One shared score — bragging rights included."
            tags={['daily', 'trivia', 'quiz']}
            playTo="/quiz"
            aboutTo="/quiz/about"
          />

          {/* Game 7: 7 Letters */}
          <GameCard
            delay={0.36}
            accentColor="#E7B10A"
            accentSide="#8f6d05"
            textColor="#c79a08"
            label="7 Letters"
            sticker="seven"
            stickerColor="#d9f24b"
            description="Seven letters, one center. Build words, chase the pangram."
            tags={['daily', 'words', 'pangram']}
            playTo="/seven"
            aboutTo="/seven/about"
          />

        </div>

        <AdSlot slot="yodoku-grid-footer" minHeight={120} />

        {/* Footer */}
        <footer className="mt-10 pt-6 flex flex-col items-center gap-2" style={{ borderTop: '2px solid var(--yodoku-ink)', opacity: 0.3 }}>
          <p className="text-[11px] font-bold m-0" style={{ color: 'var(--yodoku-ink-soft)', letterSpacing: '0.04em' }}>
            All games are free to play.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy"
              className="text-[11px] font-bold"
              style={{ color: 'var(--yodoku-ink-soft)', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
            <span style={{ color: 'var(--yodoku-ink-soft)' }}>·</span>
            <Link to="/terms"
              className="text-[11px] font-bold"
              style={{ color: 'var(--yodoku-ink-soft)', textDecoration: 'none' }}>
              Terms of Service
            </Link>
          </div>
        </footer>
        </main>
      </section>

      {/* Inline keyframes for ticker */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
