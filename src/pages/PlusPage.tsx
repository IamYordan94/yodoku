// PlusPage.tsx — the Yodoku+ page (route /plus).
// Design reference: docs/design/yodoku-plus-preview.html (approved 2026-10-03).

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  CHECKOUT_URL,
  checkoutConfigured,
  accountConfigured,
  isPlusActive,
} from '../utils/monetization';
import { requestMagicLink, getSessionEmail } from '../utils/account';
import { isNativeApp } from '../utils/platform';

const mono = "'JetBrains Mono', ui-monospace, monospace";

function Perk({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <li
      style={{
        listStyle: 'none',
        padding: '5px 0 5px 24px',
        position: 'relative',
        fontSize: 14.5,
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: 2,
          top: 8,
          fontSize: 10,
          color: accent ? '#d9f24b' : '#39c96b',
        }}
      >
        ■
      </span>
      {children}
    </li>
  );
}

export default function PlusPage() {
  const plusActive = isPlusActive();
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    void getSessionEmail().then(setSessionEmail);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setMode('sending');
    const res = await requestMagicLink(email.trim());
    if (res.ok) {
      setMode('sent');
    } else {
      setErrMsg(res.error || 'unknown error');
      setMode('error');
    }
  }

  const cta = plusActive ? (
    <div
      style={{
        display: 'inline-block',
        width: '100%',
        textAlign: 'center',
        border: '2.5px solid #d9f24b',
        borderRadius: '10px',
        padding: '13px 16px',
        fontWeight: 800,
        fontSize: 15,
        background: 'transparent',
        color: '#d9f24b',
      }}
    >
      You&rsquo;re on Yodoku+ ✓
    </div>
  ) : checkoutConfigured() && !isNativeApp() ? (
    <a
      href={CHECKOUT_URL}
      style={{
        display: 'inline-block',
        width: '100%',
        textAlign: 'center',
        textDecoration: 'none',
        border: '2.5px solid #141414',
        borderRadius: '10px',
        padding: '13px 16px',
        fontWeight: 800,
        fontSize: 15,
        boxShadow: '4px 4px 0 #141414',
        background: '#d9f24b',
        color: '#141414',
      }}
    >
      Get Yodoku+ →
    </a>
  ) : isNativeApp() ? (
    <div
      style={{
        display: 'inline-block',
        width: '100%',
        textAlign: 'center',
        border: '2.5px solid #d9f24b',
        borderRadius: '10px',
        padding: '13px 16px',
        fontWeight: 800,
        fontSize: 15,
        background: 'transparent',
        color: '#d9f24b',
        cursor: 'default',
      }}
    >
      Yodoku+ for Android is coming to Google Play &mdash; until then, every daily game is free.
    </div>
  ) : (
    <div
      style={{
        display: 'inline-block',
        width: '100%',
        textAlign: 'center',
        border: '2.5px solid rgba(255,255,255,0.35)',
        borderRadius: '10px',
        padding: '13px 16px',
        fontWeight: 800,
        fontSize: 15,
        background: 'transparent',
        color: 'rgba(255,255,255,0.55)',
        cursor: 'default',
      }}
    >
      Launching soon
    </div>
  );

  return (
    <div
      style={{
        background: 'var(--yodoku-bg)',
        minHeight: '100vh',
        color: 'var(--yodoku-ink)',
        padding: '26px 20px 64px',
      }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <span style={{ fontFamily: mono, fontWeight: 900, fontSize: 16, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Yodoku
          </span>
          <Link to="/" style={{ fontWeight: 700, fontSize: 14, color: 'rgba(20,20,20,0.62)', textDecoration: 'none' }}>
            ← Back to the games
          </Link>
        </div>

        <h1 style={{ fontFamily: mono, fontSize: 26, letterSpacing: '0.06em', margin: '0 0 6px' }}>
          YODOKU+
        </h1>
        <p style={{ color: 'rgba(20,20,20,0.62)', fontSize: 15, margin: '0 0 26px' }}>
          Free forever stays free. Yodoku+ opens the whole archive.
        </p>

        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {/* FREE card (stacks under the Yodoku+ card on mobile) */}
          <div
            style={{
              order: 2,
              flex: '1 1 340px',
              border: '2.5px solid #141414',
              borderRadius: 14,
              padding: '22px 22px 20px',
              boxShadow: '6px 6px 0 #141414',
              background: '#ffffff',
            }}
          >
            <h3 style={{ margin: '0 0 4px', fontFamily: mono, fontSize: 15, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Free
            </h3>
            <div style={{ fontSize: 34, fontWeight: 800, margin: '10px 0 2px' }}>
              €0 <small style={{ fontSize: 14, fontWeight: 700, color: 'rgba(20,20,20,0.62)' }}>forever</small>
            </div>
            <ul style={{ margin: '14px 0 18px', padding: 0 }}>
              <Perk>All 7 daily games, every day</Perk>
              <Perk>Today&rsquo;s puzzle + the last 7 days</Perk>
              <Perk>Share cards &amp; on-device stats</Perk>
              <Perk>No signup. No spam.</Perk>
            </ul>
            <Link
              to="/#games"
              style={{
                display: 'inline-block',
                width: '100%',
                textAlign: 'center',
                textDecoration: 'none',
                color: '#141414',
                border: '2.5px solid #141414',
                borderRadius: 10,
                padding: '13px 16px',
                fontWeight: 800,
                fontSize: 15,
                boxShadow: '4px 4px 0 #141414',
                background: '#ffffff',
              }}
            >
              Keep playing free
            </Link>
            <div style={{ fontSize: 11.5, color: 'rgba(20,20,20,0.62)', marginTop: 10 }}>
              Everything that exists today stays free. Nothing is taken away.
            </div>
          </div>

          {/* PLUS card (leads the offer) */}
          <div
            style={{
              order: 1,
              flex: '1 1 340px',
              border: '2.5px solid #141414',
              borderRadius: 14,
              padding: '22px 22px 20px',
              boxShadow: '6px 6px 0 #141414',
              background: '#1E2028',
              color: '#fff',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                background: '#d9f24b',
                color: '#1E2028',
                border: '2px solid #141414',
                fontFamily: mono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.1em',
                padding: '3px 10px',
                borderRadius: 4,
                transform: 'rotate(-1deg)',
                marginBottom: 10,
              }}
            >
              THE WHOLE ARCHIVE
            </span>
            <h3 style={{ margin: '0 0 4px', fontFamily: mono, fontSize: 15, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Yodoku+
            </h3>
            <div style={{ fontSize: 34, fontWeight: 800, margin: '10px 0 2px' }}>
              €2.99 <small style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>/month</small>
            </div>
            <div style={{ fontSize: 13, margin: '0 0 4px', color: 'rgba(255,255,255,0.6)' }}>
              or <b style={{ color: '#d9f24b' }}>€19.99/year</b> (44% off monthly)
            </div>
            <ul style={{ margin: '14px 0 18px', padding: 0 }}>
              <Perk accent>Every past puzzle since launch — all 7 games</Perk>
              <Perk accent>Ad-free</Perk>
              <Perk accent>Progress synced across your devices</Perk>
              <Perk accent>Unlimited practice &amp; random rounds</Perk>
            </ul>
            {cta}
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 10 }}>
              VAT included · cancel anytime · payments handled by Lemon Squeezy
            </div>
          </div>
        </div>

        {/* Account section — only when accounts are configured */}
        {accountConfigured() && (
          <div
            style={{
              marginTop: 26,
              background: '#ffffff',
              border: '2.5px solid #141414',
              borderRadius: 12,
              boxShadow: '4px 4px 0 #141414',
              padding: '16px 18px',
            }}
          >
            {sessionEmail ? (
              <div style={{ fontSize: 14 }}>
                Signed in as <b>{sessionEmail}</b>
              </div>
            ) : mode === 'sent' ? (
              <div style={{ fontSize: 14 }}>
                Check your inbox — we sent a sign-in link to <b>{email}</b>.
              </div>
            ) : (
              <form onSubmit={onSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Already subscribed? Sign in:</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    flex: '1 1 200px',
                    border: '2px solid #141414',
                    borderRadius: 8,
                    padding: '9px 12px',
                    fontSize: 14,
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="submit"
                  disabled={mode === 'sending'}
                  style={{
                    border: '2px solid #141414',
                    borderRadius: 8,
                    padding: '9px 16px',
                    fontWeight: 800,
                    fontSize: 14,
                    background: '#d9f24b',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {mode === 'sending' ? 'Sending…' : 'Send link'}
                </button>
                {mode === 'error' && (
                  <span style={{ color: '#c0392b', fontSize: 13 }}>{errMsg}</span>
                )}
              </form>
            )}
          </div>
        )}

        <p style={{ marginTop: 30, fontSize: 12.5, color: 'rgba(20,20,20,0.62)' }}>
          Today&rsquo;s puzzles stay free forever — Yodoku+ is for the archive and the extras.
          Questions? <span style={{ fontFamily: mono }}>hello@yodoku.app</span> (coming soon).
        </p>
      </div>
    </div>
  );
}
