// monetization.ts — Yodoku+ entitlement + archive gating scaffolding.
//
// STATE (2026-10-03): scaffolding only. PAID_ENABLED is the master switch and
// stays false until accounts exist (Supabase auth + Lemon Squeezy checkout and
// webhooks). While PAID_ENABLED is false every helper returns "unlocked", so
// production behaviour is unchanged. Local testing: append ?plus=1 to any URL
// to simulate a subscriber.
//
// Integration points (Phase C): OrderleCalendar, FermiCalendar,
// ChangeByOneCalendar, LetterMixCalendar, WordPoolPreviousGames.

export const PAID_ENABLED = false;
export const FREE_ARCHIVE_DAYS = 7;

// --- deployment config (Vercel env; empty = feature dormant) ---
const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
export const CHECKOUT_URL: string = env.VITE_CHECKOUT_URL || '';
export const SUPABASE_URL: string = env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY: string = env.VITE_SUPABASE_ANON_KEY || '';
// Newsletter signup (Brevo/Resend via /api/subscribe) — the form renders only
// once the provider is connected, so the live site never shows a dead form.
export const NEWSLETTER_ENABLED: boolean = env.VITE_NEWSLETTER_ENABLED === 'true';

export function checkoutConfigured(): boolean {
  return Boolean(CHECKOUT_URL);
}
export function accountConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

const PLUS_KEY = 'yodoku_plus_local'; // temporary until real entitlements land

/**
 * Persist the Yodoku+ answer that /api/entitlement returned.
 * Written by utils/entitlement.ts after a signed-in entitlement check, read by
 * isPlusActive() and by the ad guard (utils/adFree.ts).
 */
export function setPlusState(active: boolean): void {
  try {
    localStorage.setItem(PLUS_KEY, active ? '1' : '0');
  } catch {
    /* storage unavailable — the check simply runs again next visit */
  }
}


function urlOverride(): boolean {
  try {
    return new URL(window.location.href).searchParams.get('plus') === '1';
  } catch {
    return false;
  }
}

/** True when the current visitor has Yodoku+ (or a local/dev override). */
export function isPlusActive(): boolean {
  if (urlOverride()) return true;
  if (!PAID_ENABLED) return false;
  try {
    return localStorage.getItem(PLUS_KEY) === '1';
  } catch {
    return false;
  }
}

/** Days between an ISO date (YYYY-MM-DD, UTC) and today (UTC). Never negative. */
export function daysAgoUtc(dateStr: string): number {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const d = new Date(dateStr + 'T00:00:00Z');
  const then = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.max(0, Math.round((todayUtc - then) / 86400000));
}

/**
 * Archive policy: today + the last FREE_ARCHIVE_DAYS days are always free.
 * Older days unlock with Yodoku+. Pre-launch (PAID_ENABLED=false): all open.
 */
export function isArchiveUnlocked(dateStr: string): boolean {
  if (!PAID_ENABLED) return true;
  return daysAgoUtc(dateStr) <= FREE_ARCHIVE_DAYS || isPlusActive();
}

/** Local design preview: ?pluspreview=1 forces the locked tiles regardless of PAID_ENABLED. */
function previewForce(): boolean {
  try {
    return new URL(window.location.href).searchParams.get('pluspreview') === '1';
  } catch {
    return false;
  }
}

/** True when a day should show the lock ("Plus") treatment. */
export function showsPlusHint(dateStr: string): boolean {
  if (daysAgoUtc(dateStr) <= FREE_ARCHIVE_DAYS) return false;
  if (previewForce()) return true;
  return PAID_ENABLED && !isPlusActive();
}
