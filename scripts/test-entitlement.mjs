// test-entitlement.mjs — truth table for the Yodoku+ entitlement answer.
//
// Imports the REAL source (Node strips TypeScript natively) — no replica.
// Run: node scripts/test-entitlement.mjs

import { entitlementFromRows } from '../api/entitlement.js';

let checks = 0;
let failed = 0;

function ok(cond, msg) {
  checks++;
  if (!cond) {
    failed++;
    console.error(`FAIL: ${msg}`);
  }
}

// --- active statuses ------------------------------------------------------
for (const status of ['active', 'on_trial', 'past_due']) {
  const a = entitlementFromRows([{ status, plan: 'Yodoku+ yearly' }]);
  ok(a.active === true, `${status} must count as active`);
  ok(a.status === status, `${status} must be echoed back`);
}

// --- inactive statuses ----------------------------------------------------
for (const status of ['inactive', 'cancelled', 'expired', 'paused', 'unpaid', '']) {
  const a = entitlementFromRows([{ status, plan: 'Yodoku+ yearly' }]);
  ok(a.active === false, `"${status}" must NOT count as active`);
}

// --- malformed / empty inputs --------------------------------------------
ok(entitlementFromRows([]).active === false, 'empty rows -> not active');
ok(entitlementFromRows(null).active === false, 'null rows -> not active');
ok(entitlementFromRows(undefined).active === false, 'undefined rows -> not active');
ok(entitlementFromRows('nope').active === false, 'a string -> not active');
ok(entitlementFromRows([{}]).active === false, 'row without status -> not active');
ok(entitlementFromRows([{ status: 123 }]).active === false, 'non-string status -> not active');

// --- shape ----------------------------------------------------------------
const one = entitlementFromRows([{ status: 'active', plan: 'Yodoku+ yearly' }]);
ok(one.plan === 'Yodoku+ yearly', 'plan is passed through');
ok(entitlementFromRows([{ status: 'active' }]).plan === null, 'missing plan -> null');

// only the first row counts (the query already orders by updated_at desc)
const multi = entitlementFromRows([
  { status: 'inactive', plan: 'old' },
  { status: 'active', plan: 'new' },
]);
ok(multi.active === false, 'only the newest row is honoured');

// --- the HTTP handler, with Supabase stubbed out --------------------------
// Proves the real request path: token -> who is this -> entitlements -> answer,
// without needing live keys.

import handler from '../api/entitlement.js';

function stubFetch(impl) {
  globalThis.fetch = impl;
}

const req = (token) =>
  new Request('https://yodoku.app/api/entitlement', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

// 1. not configured
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_KEY;
let res = await handler(req('t'));
let body = await res.json();
ok(res.status === 503, 'no server env -> 503');
ok(body.active === false, 'no server env -> not active');

// 2. configured, but no token
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'service';
res = await handler(req(''));
body = await res.json();
ok(res.status === 401, 'no token -> 401');
ok(body.active === false, 'no token -> not active');

// 3. good token, active subscriber
stubFetch(async (url) => {
  if (String(url).includes('/auth/v1/user')) {
    return new Response(JSON.stringify({ email: 'buyer@example.com' }), { status: 200 });
  }
  return new Response(JSON.stringify([{ status: 'active', plan: 'Yodoku+ yearly' }]), { status: 200 });
});
res = await handler(req('good'));
body = await res.json();
ok(res.status === 200, 'good token -> 200');
ok(body.active === true, 'active entitlement -> active true');
ok(body.plan === 'Yodoku+ yearly', 'plan reaches the client');

// 4. good token, lapsed subscriber
stubFetch(async (url) => {
  if (String(url).includes('/auth/v1/user')) {
    return new Response(JSON.stringify({ email: 'lapsed@example.com' }), { status: 200 });
  }
  return new Response(JSON.stringify([{ status: 'cancelled', plan: 'Yodoku+ yearly' }]), { status: 200 });
});
body = await (await handler(req('good'))).json();
ok(body.active === false, 'cancelled entitlement -> not active');

// 5. bad token
stubFetch(async () => new Response('{}', { status: 401 }));
res = await handler(req('bad'));
ok(res.status === 401, 'rejected token -> 401');

// 6. Supabase lookup blows up -> fail closed, never 500
stubFetch(async (url) => {
  if (String(url).includes('/auth/v1/user')) {
    return new Response(JSON.stringify({ email: 'buyer@example.com' }), { status: 200 });
  }
  return new Response('boom', { status: 500 });
});
res = await handler(req('good'));
body = await res.json();
ok(res.status === 200, 'lookup failure still answers 200');
ok(body.active === false, 'lookup failure -> not active');

// 7. network throws -> fail closed
stubFetch(async () => {
  throw new Error('offline');
});
res = await handler(req('good'));
body = await res.json();
ok(body.active === false, 'network error -> not active');

// --- the contract between the entitlement answer and the ad guard ---------
// A subscriber must stop receiving the ad tag on the very next page load.

import { setPlusState } from '../src/utils/monetization.ts';
import { currentSignals, shouldLoadAdTag } from '../src/utils/adFree.ts';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const plainVisitor = {
  location: { protocol: 'https:', hostname: 'www.yodoku.app', port: '', search: '' },
  localStorage: globalThis.localStorage,
};

setPlusState(false);
ok(shouldLoadAdTag(currentSignals(plainVisitor)) === true, 'non-subscriber still gets the ad tag');

setPlusState(true);
ok(shouldLoadAdTag(currentSignals(plainVisitor)) === false, 'subscriber gets no ad tag');

setPlusState(false);
ok(shouldLoadAdTag(currentSignals(plainVisitor)) === true, 'lapsed subscriber gets the ad tag back');

console.log(`${checks - failed}/${checks} checks passed`);
process.exit(failed === 0 ? 0 : 1);
