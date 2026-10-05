// account.ts — lazy Supabase wrapper for Yodoku+ accounts.
// Dormant until VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY exist (Vercel env).
// Never throws; returns 'accounts-not-configured' instead.

import { accountConfigured, SUPABASE_URL, SUPABASE_ANON_KEY } from './monetization';
import { isNativeApp } from './platform';

type SupaSession = { user?: { email?: string | null } } | null;

type SupaClient = {
  auth: {
    signInWithOtp: (args: {
      email: string;
      options?: { emailRedirectTo?: string };
    }) => Promise<{ error: { message: string } | null }>;
    signOut: () => Promise<{ error: unknown }>;
    getSession: () => Promise<{ data: { session: SupaSession } }>;
    setSession: (args: {
      access_token: string;
      refresh_token: string;
    }) => Promise<{ error: { message: string } | null }>;
    exchangeCodeForSession: (code: string) => Promise<{ error: { message: string } | null }>;
  };
};

let clientPromise: Promise<SupaClient | null> | null = null;

async function getClient(): Promise<SupaClient | null> {
  if (!accountConfigured()) return null;
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js')
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY) as unknown as SupaClient)
      .catch(() => null);
  }
  return clientPromise;
}

/** Send a magic sign-in link to the email. */
export async function requestMagicLink(email: string): Promise<{ ok: boolean; error?: string }> {
  const client = await getClient();
  if (!client) return { ok: false, error: 'accounts-not-configured' };
  try {
    const { error } = await client.auth.signInWithOtp({
      email,
      // In the native app the email link must come BACK INTO the app — the
      // custom scheme is routed by the AndroidManifest intent filter. On the
      // web it keeps returning to the /plus page.
      options: {
        emailRedirectTo: isNativeApp()
          ? 'yodoku://auth/callback'
          : window.location.origin + '/plus',
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown error' };
  }
}

export async function signOut(): Promise<void> {
  const client = await getClient();
  if (client) await client.auth.signOut();
}

export async function getSessionEmail(): Promise<string | null> {
  const client = await getClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session?.user?.email ?? null;
  } catch {
    return null;
  }
}

/** Collect query + fragment params from a callback URL (custom scheme or https). */
function callbackParams(raw: string): URLSearchParams {
  const out = new URLSearchParams();
  const grab = (s: string) => {
    if (!s) return;
    for (const [k, v] of new URLSearchParams(s)) out.set(k, v);
  };
  const q = raw.indexOf('?');
  const h = raw.indexOf('#');
  if (q !== -1) grab(raw.slice(q + 1, h !== -1 && h > q ? h : undefined));
  if (h !== -1) grab(raw.slice(h + 1));
  return out;
}

/**
 * Complete a magic-link sign-in that returned through the native app
 * (yodoku://auth/callback...). Exchanges the URL tokens for a real session.
 */
export async function handleAuthCallback(url: string): Promise<{ ok: boolean; email: string | null }> {
  const client = await getClient();
  if (!client) return { ok: false, email: null };
  try {
    const p = callbackParams(url);
    const access = p.get('access_token');
    const refresh = p.get('refresh_token');
    const code = p.get('code');
    if (access && refresh) {
      const { error } = await client.auth.setSession({ access_token: access, refresh_token: refresh });
      if (error) return { ok: false, email: null };
    } else if (code) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) return { ok: false, email: null };
    } else {
      return { ok: false, email: null };
    }
    const email = await getSessionEmail();
    return { ok: true, email };
  } catch {
    return { ok: false, email: null };
  }
}
