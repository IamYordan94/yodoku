import { useState } from 'react';
import type { FormEvent } from 'react';
import { NEWSLETTER_ENABLED } from '../utils/monetization';

type State = 'idle' | 'sending' | 'done' | 'error';

const DISMISS_KEY = 'yodoku_newsletter_dismissed';

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * "Get the daily puzzles by email" opt-in module — sticker-styled, one field,
 * dismissible. Wired to the SAME /api/subscribe newsletter signup the daily
 * 08:30 campaign already uses, so opting in here is what builds the reminder list.
 * Renders ONLY when VITE_NEWSLETTER_ENABLED === 'true' (i.e. once Brevo is
 * connected), so the live site never shows a dead form.
 */
export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState(''); // honeypot — humans never see it
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState('');
  const [dismissed, setDismissed] = useState(() => isDismissed());

  if (!NEWSLETTER_ENABLED || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setMessage('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, company }),
      });
      const data = await res.json().catch(() => ({}) as { ok?: boolean; error?: string });
      if (res.ok && data.ok) {
        setState('done');
        setMessage("You're on the list — first reminder tomorrow at 08:30.");
      } else if (data.error === 'invalid-email') {
        setState('error');
        setMessage("That email doesn't look right — check it and try again.");
      } else {
        setState('error');
        setMessage('Signup is briefly unavailable — please try again later.');
      }
    } catch {
      setState('error');
      setMessage('Network hiccup — please try again.');
    }
  }

  const mono = "'JetBrains Mono', ui-monospace, monospace";

  return (
    <section className="mt-0">
      <div
        style={{
          position: 'relative',
          background: 'var(--yodoku-panel)',
          border: '2.5px solid var(--yodoku-ink)',
          borderRadius: '12px',
          boxShadow: '5px 5px 0 var(--yodoku-ink)',
          padding: '16px 18px',
        }}
      >
        <button
          onClick={dismiss}
          aria-label="Dismiss email signup"
          style={{
            position: 'absolute',
            top: '8px',
            right: '10px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '14px',
            color: 'var(--yodoku-ink-soft)',
            padding: '2px 4px',
          }}
        >
          ✕
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span
            style={{
              background: 'var(--yodoku-lime)',
              color: 'var(--yodoku-dark)',
              border: '2px solid var(--yodoku-ink)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 800,
              textTransform: 'uppercase',
              transform: 'rotate(-1deg)',
              fontFamily: mono,
            }}
          >
            get the daily puzzles by email
          </span>
          <span className="text-[10px] font-bold" style={{ color: 'var(--yodoku-ink-soft)', fontFamily: mono }}>
            ONE EMAIL A MORNING
          </span>
        </div>

        <p className="text-sm font-semibold m-0 mb-3" style={{ color: 'var(--yodoku-ink-soft)', lineHeight: 1.55 }}>
          Never miss a day. We&apos;ll email your daily reminder at 08:30 every morning with all seven puzzles.
          No spam, unsubscribe in one click.
        </p>

        {state === 'done' ? (
          <p
            className="text-[13px] font-bold m-0"
            style={{ color: 'var(--yodoku-ink)', fontFamily: mono }}
            role="status"
          >
            ✓ {message}
          </p>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <label htmlFor="newsletter-email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                flex: '1 1 220px',
                minWidth: 0,
                background: 'var(--yodoku-bg)',
                color: 'var(--yodoku-ink)',
                border: '2.5px solid var(--yodoku-ink)',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: mono,
              }}
            />
            {/* honeypot */}
            <input
              type="text"
              name="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
            />
            <button
              type="submit"
              disabled={state === 'sending'}
              style={{
                background: 'var(--yodoku-ink)',
                color: 'var(--yodoku-bg)',
                border: '2.5px solid var(--yodoku-ink)',
                borderRadius: '8px',
                padding: '9px 18px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: state === 'sending' ? 'wait' : 'pointer',
                opacity: state === 'sending' ? 0.7 : 1,
                fontFamily: mono,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {state === 'sending' ? 'Sending…' : 'Get the reminder'}
            </button>
          </form>
        )}

        {state === 'error' && (
          <p className="text-[11.5px] font-bold mt-2 mb-0" style={{ color: '#c03030', fontFamily: mono }} role="alert">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
