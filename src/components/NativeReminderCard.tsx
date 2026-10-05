// NativeReminderCard.tsx — opt-in daily reminder toggle (native app only).
// Local notifications, on-device, no push. Sticker Pack styling.

import { useEffect, useState } from 'react';
import { isNativeApp } from '../utils/platform';
import {
  hapticTap,
  pendingReminderCount,
  reminderOptedIn,
  REMINDER_HOUR,
  setDailyReminder,
} from '../utils/nativeShell';
import { track } from '../utils/telemetry';

const mono = "'JetBrains Mono', ui-monospace, monospace";
const pad = `${String(REMINDER_HOUR).padStart(2, '0')}:00`;

export default function NativeReminderCard() {
  const native = isNativeApp();
  const [on, setOn] = useState(false);
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!native) return;
    setOn(reminderOptedIn());
    void pendingReminderCount().then(setPending);
    track('reminder_card_view');
  }, [native]);

  if (!native) return null;

  const toggle = async () => {
    if (busy) return;
    hapticTap();
    setBusy(true);
    setError(null);
    const next = !on;
    const res = await setDailyReminder(next);
    if (res.ok) {
      setOn(next);
      setPending(await pendingReminderCount());
    } else {
      setError(
        res.error === 'permission-denied'
          ? 'Notifications are turned off for Yodoku in system settings.'
          : 'Could not update the reminder. Try again.',
      );
    }
    setBusy(false);
  };

  return (
    <div className="px-4 md:px-6 max-w-[1040px] mx-auto mt-4">
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
            transform: 'rotate(-2deg)',
            fontFamily: mono,
          }}
        >
          ⏰
        </span>

        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--yodoku-ink)', fontFamily: mono, letterSpacing: '0.02em' }}>
            DAILY REMINDER
          </div>
          <div style={{ fontSize: '12px', color: 'var(--yodoku-ink-soft)', fontWeight: 600, marginTop: 2 }}>
            One nudge at {pad} — on-device, no push. {on && pending > 0 ? `✓ ${pending} scheduled` : ''}
          </div>
          {error && (
            <div style={{ fontSize: '11.5px', color: '#c0392b', fontWeight: 700, marginTop: 4 }}>{error}</div>
          )}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Daily reminder"
          onClick={toggle}
          disabled={busy}
          style={{
            position: 'relative',
            width: '58px',
            height: '30px',
            flexShrink: 0,
            borderRadius: '999px',
            border: '2.5px solid var(--yodoku-ink)',
            background: on ? 'var(--yodoku-lime)' : 'var(--yodoku-bg)',
            boxShadow: '3px 3px 0 var(--yodoku-ink)',
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.6 : 1,
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '2px',
              left: on ? '29px' : '2px',
              width: '21px',
              height: '21px',
              borderRadius: '50%',
              background: 'var(--yodoku-ink)',
              transition: 'left 0.16s ease',
            }}
          />
        </button>
      </div>
    </div>
  );
}
