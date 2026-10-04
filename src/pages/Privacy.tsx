import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="yodoku-plate min-h-screen">
      {/* Nav */}
      <header
        className="px-5 flex items-center gap-3 sticky top-0 z-20"
        style={{ background: 'var(--yodoku-dark)', borderBottom: '3px solid var(--yodoku-ink)', minHeight: '52px' }}
      >
        <Link
          to="/"
          className="text-sm font-semibold"
          style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
        >
          ← Hub
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.18)' }}>|</span>
        <h1
          className="text-sm font-black uppercase tracking-widest m-0"
          style={{ color: '#F1EDEA', fontFamily: "'JetBrains Mono', monospace" }}
        >
          Privacy Policy
        </h1>
      </header>

      <main className="max-w-[680px] mx-auto px-5 py-10" style={{ color: 'var(--yodoku-ink)' }}>
        <p className="text-xs font-semibold mb-8" style={{ color: 'var(--yodoku-ink-soft)' }}>
          Last updated: August 2026
        </p>

        <Section title="Overview">
          Yodoku is a free collection of daily word and trivia games. We have designed this site with your
          privacy as a priority. We do not sell your data and we do not build profiles on you. The site is free to
          play and may be supported by advertising — see the Advertising section below.
        </Section>

        <Section title="What data do we collect?">
          <strong>Nothing that leaves your device.</strong>
          <br /><br />
          Your game progress, solved puzzles, and settings are stored exclusively in your browser's{' '}
          <code className="px-1 rounded text-xs" style={{ background: 'var(--yodoku-bg)', border: '1px solid var(--yodoku-ink)' }}>localStorage</code>.
          This data never leaves your device and we have no access to it. (Game progress stays local; aggregate visit
          counts and ad delivery do involve third parties — see Third-party services and Advertising below.) If you clear your browser data or use a
          different device, your progress will not carry over — because it is stored only on your device.
        </Section>

        <Section title="Cookies">
          We do not use cookies for the games themselves. We use browser <code className="px-1 rounded text-xs" style={{ background: 'var(--yodoku-bg)', border: '1px solid var(--yodoku-ink)' }}>localStorage</code> solely
          to remember your in-progress games and preferences — strictly necessary for the games to function and
          not requiring your consent under any privacy regulation (GDPR, ePrivacy, CCPA, or similar). Our advertising
          partner (see Advertising below) may set cookies or similar technologies to deliver and measure ads.
        </Section>

        <Section title="Third-party services">
          We use <a href="https://vercel.com/analytics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--yodoku-ink)', textDecoration: 'underline' }}>Vercel Analytics</a>{' '}
          to count visits in aggregate. It is cookieless and does not identify individual visitors.
          We also load the{' '}
          <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--yodoku-ink)', textDecoration: 'underline' }}>Google Fonts</a>{' '}
          CSS stylesheet (for the Inter and JetBrains Mono typefaces). Google Fonts may log your IP address and
          browser type as part of serving the font files, subject to{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--yodoku-ink)', textDecoration: 'underline' }}>Google's privacy policy</a>. Ads are served by a third-party ad network — see Advertising below.
        </Section>

        <Section title="Advertising">
          The site is free to play and is supported by advertising. Ads may be served by a third-party ad network
          (for example Monetag or Google AdSense). These providers may use cookies or similar technologies to serve
          and measure ads, subject to their own privacy policies. Your game progress and scores are stored only on
          your device and are never shared with advertisers.
        </Section>

        <Section title="Children">
          Yodoku is a general-audience word game site. We do not knowingly collect any information from
          anyone, including children under the age of 13.
        </Section>

        <Section title="Your rights">
          Because we do not collect, store, or process any personal data on our end, there is nothing for us to
          delete, export, or correct on your behalf. If you want to erase your locally stored game data, simply
          clear your browser's site data for this domain.
        </Section>

        <Section title="Changes to this policy">
          If we ever add features that change how data is handled (for example, accounts, leaderboards, or
          analytics), we will update this page and note the date of change at the top.
        </Section>

        <Section title="Contact">
          Questions? Email us at{' '}
          <a href="mailto:cashfortheteam@gmail.com" style={{ color: 'var(--yodoku-ink)', textDecoration: 'underline' }}>
            cashfortheteam@gmail.com
          </a>
          . We are a tiny independent project and will respond when we can.
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2
        className="text-sm font-black uppercase tracking-widest mb-3"
        style={{ color: 'var(--yodoku-ink)', fontFamily: "'JetBrains Mono', monospace", borderBottom: '1px solid var(--yodoku-ink)', paddingBottom: '8px' }}
      >
        {title}
      </h2>
      <p className="text-sm leading-relaxed m-0" style={{ color: 'var(--yodoku-ink)' }}>
        {children}
      </p>
    </section>
  );
}
