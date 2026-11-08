// entitlement.ts — hydrate the Yodoku+ state from Supabase `entitlements`.
//
// The purchase happens on Lemon Squeezy and the webhook writes a row into
// Supabase. Nothing used to read that row, so a paying subscriber was never
// recognised in the browser: they paid, and the site gave them nothing.
// This file is the missing last mile.
//
// Dormant-safe by construction:
//   • no Supabase env  -> returns null, touches nothing
//   • no session       -> returns null, touches nothing
//   • any error        -> returns null, touches nothing
//
// The answer is cached in the same localStorage key the ad guard already reads,
// so a subscriber is recognised instantly on the next page load and the ad tag
// never fires for them.

import { accountConfigured, setPlusState } from './monetization';
import { getAccessToken } from './account';

const CHECKED_AT_KEY = 'yodoku_plus_checked_at';
/** Re-ask at most this often; the cached answer is used in between. */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export interface EntitlementAnswer {
  active: boolean;
  status: string | null;
  plan: string | null;
}

function readCheckedAt(): number {
  try {
    return Number(localStorage.getItem(CHECKED_AT_KEY) || 0);
  } catch {
    return 0;
  }
}

function writeCheckedAt(): void {
  try {
    localStorage.setItem(CHECKED_AT_KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Ask the server whether the signed-in user has Yodoku+.
 * Returns the answer, or null when there is nothing to check (or it failed).
 * `force` skips the cache — used right after sign-in and on the /plus page.
 */
export async function syncEntitlement(force = false): Promise<EntitlementAnswer | null> {
  if (!accountConfigured()) return null;

  if (!force && Date.now() - readCheckedAt() < CACHE_TTL_MS) return null;

  try {
    const token = await getAccessToken();
    if (!token) return null;

    const res = await fetch('/api/entitlement', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const data = (await res.json()) as Partial<EntitlementAnswer>;
    const answer: EntitlementAnswer = {
      active: data.active === true,
      status: typeof data.status === 'string' ? data.status : null,
      plan: typeof data.plan === 'string' ? data.plan : null,
    };
    setPlusState(answer.active);
    writeCheckedAt();
    return answer;
  } catch {
    return null;
  }
}

/** Clear the local answer — used on sign-out so the next person on the device is clean. */
export function clearEntitlementCache(): void {
  setPlusState(false);
  try {
    localStorage.removeItem(CHECKED_AT_KEY);
  } catch {
    /* storage unavailable */
  }
}
