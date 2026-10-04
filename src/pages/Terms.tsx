import { Link } from 'react-router-dom';

export default function Terms() {
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
          Terms of Service
        </h1>
      </header>

      <main className="max-w-[680px] mx-auto px-5 py-10" style={{ color: 'var(--yodoku-ink)' }}>
        <p className="text-xs font-semibold mb-8" style={{ color: 'var(--yodoku-ink-soft)' }}>
          Last updated: March 2026
        </p>

        <Section title="Acceptance">
          By using Yodoku and its games, you agree to these terms. If you do not agree,
          please do not use the site. These terms apply to all visitors.
        </Section>

        <Section title="What Yodoku is">
          Yodoku is a free, browser-based collection of word puzzle games. No account, subscription,
          or payment is required to play any game. The games are provided for personal, non-commercial entertainment.
        </Section>

        <Section title="Availability">
          We provide this service on a best-effort basis. We make no guarantee of continuous uptime,
          uninterrupted access, or that any particular puzzle, feature, or game will remain available.
          We may modify, suspend, or discontinue any part of the service at any time without notice.
        </Section>

        <Section title="Intellectual property">
          All game logic, puzzle designs, visual design, and other original content on this site belong to
          Yodoku. You may not copy, reproduce, scrape, redistribute, or build derivative products
          from the puzzles or game content without written permission. The word dictionaries used in gameplay
          are derived from openly licensed sources.
        </Section>

        <Section title="User conduct">
          You agree not to: attempt to reverse-engineer, extract, or scrape puzzle solutions or game data
          in bulk; use automated tools (bots, scripts) to interact with the games; attempt to disrupt or
          interfere with the service; or use the service for any unlawful purpose.
        </Section>

        <Section title="No warranties">
          The service is provided "as is" without any warranty of any kind, express or implied. We do not
          warrant that the puzzles are error-free, that the word lists are exhaustive, or that the service
          will meet your expectations. You use the service at your own risk.
        </Section>

        <Section title="Limitation of liability">
          To the fullest extent permitted by law, Yodoku and its operators shall not be liable for
          any indirect, incidental, special, or consequential damages arising from your use of the service,
          including but not limited to loss of data, loss of game progress, or inability to access the service.
        </Section>

        <Section title="Third-party links">
          The site may contain links to third-party websites. We are not responsible for the content,
          privacy practices, or availability of those sites.
        </Section>

        <Section title="Changes to these terms">
          We may update these terms at any time. The date at the top of this page reflects the most recent
          revision. Continued use of the service after a change constitutes acceptance of the updated terms.
        </Section>

        <Section title="Governing law">
          These terms are governed by the laws of the jurisdiction in which the operator is based.
          Any disputes shall be resolved in the courts of that jurisdiction.
        </Section>

        <Section title="Contact">
          Questions about these terms? Email{' '}
          <a href="mailto:cashfortheteam@gmail.com" style={{ color: 'var(--yodoku-ink)', textDecoration: 'underline' }}>
            cashfortheteam@gmail.com
          </a>
          .
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
