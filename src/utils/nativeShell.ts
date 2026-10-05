// nativeShell.ts — native-only app-shell behaviours (Capacitor Android).
//
// Every helper is a no-op on the plain web (isNativeApp() false) and never
// throws: a broken shell must not break a game. Plugins are imported lazily so
// the web bundle never pulls them in and web traffic is unchanged.

import { isNativeApp } from './platform';
import { track } from './telemetry';

// ────────────────────────────────────────────────────────────────────────────
// Daily reminder (local notifications only — no Firebase, no remote push)
// ────────────────────────────────────────────────────────────────────────────

const REMINDER_ID = 1001; // fixed id => cancel-then-schedule can never duplicate
const REMINDER_KEY = 'yodoku_reminder_enabled';
export const REMINDER_HOUR = 9;
export const REMINDER_MINUTE = 0;
export const REMINDER_CHANNEL = 'yodoku-daily';

export function reminderOptedIn(): boolean {
  try {
    return localStorage.getItem(REMINDER_KEY) === '1';
  } catch {
    return false;
  }
}

function writeOptIn(value: boolean): void {
  try {
    if (value) localStorage.setItem(REMINDER_KEY, '1');
    else localStorage.removeItem(REMINDER_KEY);
  } catch {
    /* ignore */
  }
}

async function notificationsModule() {
  return import('@capacitor/local-notifications');
}

/** Schedule exactly one 09:00-local daily reminder (idempotent by fixed id). */
async function scheduleReminderNotification(): Promise<void> {
  const { LocalNotifications } = await notificationsModule();
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: "Yodoku — today's 7 games are live",
        body: 'A minute each. Pick a game and keep your streak going.',
        channelId: REMINDER_CHANNEL,
        // Inexact on purpose: a friendly nudge does not need exact alarms, so
        // we avoid the "Alarms & reminders" prompt and the Play exact-alarm
        // declaration. Fires around 09:00 local, repeating daily.
        isExactNotification: false,
        schedule: {
          on: { hour: REMINDER_HOUR, minute: REMINDER_MINUTE },
          allowWhileIdle: true,
        },
      },
    ],
  });
}

/**
 * Turn the daily 09:00 local reminder on or off.
 * On: request permission, cancel any existing reminder, schedule exactly one.
 * Off: cancel the reminder.
 */
export async function setDailyReminder(enabled: boolean): Promise<{ ok: boolean; error?: string }> {
  if (!isNativeApp()) return { ok: false, error: 'native-only' };
  try {
    const { LocalNotifications } = await notificationsModule();

    if (!enabled) {
      await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
      writeOptIn(false);
      track('reminder_disabled');
      return { ok: true };
    }

    const perm = await LocalNotifications.checkPermissions();
    const status = perm.display === 'granted' ? perm : await LocalNotifications.requestPermissions();
    if (status.display !== 'granted') {
      writeOptIn(false);
      return { ok: false, error: 'permission-denied' };
    }

    try {
      await LocalNotifications.createChannel({
        id: REMINDER_CHANNEL,
        name: 'Daily reminder',
        description: 'One nudge a day when the new puzzles are live',
        importance: 3,
        visibility: 1,
      });
    } catch {
      /* channel may already exist / be unsupported — scheduling still works */
    }

    await scheduleReminderNotification();
    writeOptIn(true);
    track('reminder_enabled');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

/** How many pending notifications share our reminder id (0 or 1). */
export async function pendingReminderCount(): Promise<number> {
  if (!isNativeApp()) return 0;
  try {
    const { LocalNotifications } = await notificationsModule();
    const pending = await LocalNotifications.getPending();
    return pending.notifications.filter((n) => n.id === REMINDER_ID).length;
  } catch {
    return 0;
  }
}

/**
 * Re-assert the reminder on launch when the user opted in. Android can drop
 * scheduled alarms (reboot edge cases, OEM battery managers), so this keeps the
 * single reminder present without ever creating a duplicate.
 */
export async function syncDailyReminder(): Promise<void> {
  if (!isNativeApp() || !reminderOptedIn()) return;
  try {
    const { LocalNotifications } = await notificationsModule();
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.some((n) => n.id === REMINDER_ID)) return;
    await scheduleReminderNotification();
  } catch {
    /* ignore */
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Status bar (sticker theme: dark masthead/nav at the top of most pages)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Match the status bar to the sticker theme. Most pages start with a dark
 * masthead/nav (#1E2028), so light icons; /plus starts on paper, so dark icons.
 */
export async function applyStatusBarForPath(pathname: string): Promise<void> {
  if (!isNativeApp()) return;
  const lightIcons = !pathname.startsWith('/plus');
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: lightIcons ? Style.Light : Style.Dark });
    // No-op on Android 15 edge-to-edge, but correct on older devices.
    await StatusBar.setBackgroundColor({ color: lightIcons ? '#1E2028' : '#f6f3ec' });
  } catch {
    /* ignore */
  }
}

// ────────────────────────────────────────────────────────────────────────────
// System share sheet
// ────────────────────────────────────────────────────────────────────────────

/** Open the native system share sheet. Returns { shared:false } on web. */
export async function shareNative(opts: { title?: string; text: string; url?: string }): Promise<{ shared: boolean }> {
  if (!isNativeApp()) return { shared: false };
  try {
    const { Share } = await import('@capacitor/share');
    const can = await Share.canShare().catch(() => ({ value: true }));
    if (!can.value) return { shared: false };
    await Share.share({
      title: opts.title,
      text: opts.text,
      url: opts.url,
      dialogTitle: 'Share your Yodoku result',
    });
    return { shared: true };
  } catch {
    return { shared: false };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Haptics
// ────────────────────────────────────────────────────────────────────────────

/** Light tap for primary game interactions. Fire-and-forget. */
export function hapticTap(): void {
  if (!isNativeApp()) return;
  void import('@capacitor/haptics')
    .then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light }))
    .catch(() => undefined);
}

/** Slightly stronger feedback (e.g. the double-press exit confirmation). */
export function hapticConfirm(): void {
  if (!isNativeApp()) return;
  void import('@capacitor/haptics')
    .then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Medium }))
    .catch(() => undefined);
}

// ────────────────────────────────────────────────────────────────────────────
// Hardware back button
// ────────────────────────────────────────────────────────────────────────────

/** True when React Router has an in-app history entry to go back to. */
export function canGoBackInApp(): boolean {
  try {
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    return typeof idx === 'number' && idx > 0;
  } catch {
    return false;
  }
}
