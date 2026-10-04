import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const KEY_DISMISSED = 'yodoku_install_dismissed';
const KEY_VISITS = 'yodoku_visits';

export default function InstallSticker() {
  const [show, setShow] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(KEY_DISMISSED) === '1';
    } catch {
      // ignore
    }
    if (dismissed) return;

    let visits = 0;
    try {
      visits = Number(localStorage.getItem(KEY_VISITS) ?? 0) + 1;
      localStorage.setItem(KEY_VISITS, String(visits));
    } catch {
      visits = 2;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    // Show the sticker on 2nd+ visit only when the browser can actually install.
    const timer = window.setTimeout(() => {
      if (visits >= 2 && window.matchMedia('(display-mode: browser)').matches) {
        setShow(true);
      }
    }, 1500);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.clearTimeout(timer);
    };
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY_DISMISSED, '1');
    } catch {
      // ignore
    }
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setShow(false);
      dismiss();
    } else {
      dismiss();
    }
  };

  return (
    <div
      style={{
        maxWidth: '1040px',
        margin: '0 auto',
        padding: '0 16px 12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          background: 'var(--yodoku-panel)',
          border: '2.5px solid var(--yodoku-ink)',
          borderRadius: '12px',
          boxShadow: '6px 6px 0 var(--yodoku-ink)',
          padding: '12px 16px',
          transform: 'rotate(-1deg)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <span
          style={{
            display: 'inline-block',
            background: 'var(--yodoku-ink)',
            color: '#f6f3ec',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            padding: '3px 8px',
            borderRadius: '4px',
            transform: 'rotate(2deg)',
          }}
        >
          📲
        </span>
        <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--yodoku-ink)', flex: 1 }}>
          Install Yodoku — your 7 dailies, one tap from your home screen.
        </span>
        <button
          onClick={install}
          style={{
            background: 'var(--yodoku-accent, #d9f24b)',
            color: 'var(--yodoku-ink)',
            border: '2.5px solid var(--yodoku-ink)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontWeight: 800,
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '3px 3px 0 var(--yodoku-ink)',
          }}
        >
          Install
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          style={{
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
      </div>
    </div>
  );
}
