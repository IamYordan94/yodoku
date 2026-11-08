// api/entitlement.js — read a signed-in user's Yodoku+ state.
//
// WHY THIS EXISTS
// Lemon Squeezy takes the money and the webhook (api/lemonsqueezy-webhook.js)
// writes a row into Supabase `entitlements`. Nothing ever read that table, so a
// paying subscriber was never recognised in the browser — the last mile of the
// paid loop was missing.
//
// SHAPE
//   GET /api/entitlement
//   Authorization: Bearer <supabase access token from the browser session>
//   -> { active: boolean, status: string|null, plan: string|null }
//
// Security: the email is never taken from the request. It is read from the
// token by asking Supabase's own /auth/v1/user, so a caller cannot ask about
// somebody else's subscription. The service key stays on the server.
//
// Failure is always "not active", never a 500 that breaks the page.

export const config = { runtime: 'edge' };

/** Supabase entitlement rows -> the public answer. Pure, so it is unit-tested. */
export function entitlementFromRows(rows) {
  const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  const status = row && typeof row.status === 'string' ? row.status : null;
  const plan = row && typeof row.plan === 'string' ? row.plan : null;
  // Lemon Squeezy statuses that mean "this person has paid and still has access".
  const ACTIVE = ['active', 'on_trial', 'past_due'];
  return { active: status !== null && ACTIVE.includes(status), status, plan };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export default async function handler(request) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json({ active: false, status: null, plan: null, error: 'method-not-allowed' }, 405);
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    return json({ active: false, status: null, plan: null, error: 'not-configured' }, 503);
  }

  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) {
    return json({ active: false, status: null, plan: null, error: 'no-token' }, 401);
  }

  try {
    // Who is this? Ask Supabase, do not trust the client.
    const userRes = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) {
      return json({ active: false, status: null, plan: null, error: 'bad-token' }, 401);
    }
    const user = await userRes.json();
    const email = user && typeof user.email === 'string' ? user.email : '';
    if (!email) {
      return json({ active: false, status: null, plan: null, error: 'no-email' }, 401);
    }

    const q = new URLSearchParams({
      select: 'status,plan,updated_at',
      email: `eq.${email}`,
      order: 'updated_at.desc',
      limit: '1',
    });
    const rowsRes = await fetch(`${url}/rest/v1/entitlements?${q.toString()}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!rowsRes.ok) {
      return json({ active: false, status: null, plan: null, error: 'lookup-failed' }, 200);
    }
    const rows = await rowsRes.json();
    return json(entitlementFromRows(rows));
  } catch {
    return json({ active: false, status: null, plan: null, error: 'unreachable' }, 200);
  }
}
