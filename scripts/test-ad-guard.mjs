// test-ad-guard.mjs — truth-table test for the ad-free gate.
//
// Imports the REAL source (Node 26 strips TypeScript natively) — no replica.
// Run: node scripts/test-ad-guard.mjs
import { readFileSync } from 'node:fs';
import {
  shouldLoadAdTag,
  isAdFree,
  isNativeShell,
  isNativeOrigin,
  hasSearchFlag,
  currentSignals,
  PLUS_STORAGE_KEY,
} from '../src/utils/adFree.ts';

let checks = 0;
function ok(cond, msg) {
  checks++;
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

// ── 1. Exhaustive truth table over all 5 signals (32 combinations) ──────────
const KEYS = ['nativeParam', 'plusParam', 'capacitorNative', 'nativeOrigin', 'storedPlus'];
for (let mask = 0; mask < 32; mask++) {
  const s = {};
  KEYS.forEach((k, i) => { s[k] = Boolean(mask & (1 << i)); });
  const any = KEYS.some((k) => s[k]);
  ok(shouldLoadAdTag(s) === !any, `truth table mask=${mask}: shouldLoadAdTag should be ${!any}`);
  ok(isAdFree(s) === any, `truth table mask=${mask}: isAdFree should be ${any}`);
}

// ── 2. Named cases (the ones that matter in production) ────────────────────
const none = { nativeParam: false, plusParam: false, capacitorNative: false, nativeOrigin: false, storedPlus: false };
ok(shouldLoadAdTag(none) === true, 'web free user LOADS the tag (behavior unchanged)');
ok(shouldLoadAdTag({ ...none, nativeParam: true }) === false, '?native=1 blocks the tag');
ok(shouldLoadAdTag({ ...none, plusParam: true }) === false, '?plus=1 (subscriber) blocks the tag');
ok(shouldLoadAdTag({ ...none, capacitorNative: true }) === false, 'native app (Capacitor) blocks the tag');
ok(shouldLoadAdTag({ ...none, nativeOrigin: true }) === false, 'native app (https://localhost) blocks the tag');
ok(shouldLoadAdTag({ ...none, storedPlus: true }) === false, 'stored Yodoku+ state blocks the tag');
ok(shouldLoadAdTag({ ...none, plusParam: false, storedPlus: false, nativeParam: false }) === true,
  'free web with unrelated falsy signals still loads');

// ── 3. isNativeShell against representative windows ────────────────────────
const W = (loc, Cap) => ({ location: loc, Capacitor: Cap });
ok(isNativeShell(W({ protocol: 'https:', hostname: 'www.yodoku.app', port: '', search: '' }, undefined)) === false,
  'web origin is not native');
ok(isNativeShell(W({ protocol: 'https:', hostname: 'www.yodoku.app', port: '', search: '?native=1' }, undefined)) === true,
  '?native=1 override is native');
ok(isNativeShell(W({ protocol: 'https:', hostname: 'www.yodoku.app', port: '', search: '' }, { isNativePlatform: () => true })) === true,
  'Capacitor.isNativePlatform()=true is native');
ok(isNativeShell(W({}, { isNativePlatform: () => false })) === false,
  'Capacitor.isNativePlatform()=false is not native');
ok(isNativeShell(W({}, { platform: 'android' })) === true, 'Capacitor.platform=android is native');
ok(isNativeShell(W({}, { platform: 'web' })) === false, 'Capacitor.platform=web is not native');
ok(isNativeShell(W({ protocol: 'https:', hostname: 'localhost', port: '', search: '' }, undefined)) === true,
  'https://localhost (native WebView) is native');
ok(isNativeShell(W({ protocol: 'http:', hostname: 'localhost', port: '5173', search: '' }, undefined)) === false,
  'http://localhost:5173 (dev server) is NOT native');
ok(isNativeOrigin('https:', 'localhost', '') === true, 'isNativeOrigin https+localhost');
ok(isNativeOrigin('https:', 'localhost', '443') === false, 'isNativeOrigin with explicit port is false');
ok(hasSearchFlag('?plus=1', 'plus') === true && hasSearchFlag('?plus=0', 'plus') === false, 'hasSearchFlag exact =1');

// ── 4. currentSignals() end-to-end (window-shaped object) ──────────────────
const winLike = {
  location: { protocol: 'https:', hostname: 'www.yodoku.app', port: '', search: '?native=1' },
  localStorage: { getItem: (k) => (k === PLUS_STORAGE_KEY ? '1' : null) },
};
const sig = currentSignals(winLike);
ok(sig.nativeParam === true, 'currentSignals reads ?native=1');
ok(sig.storedPlus === true, 'currentSignals reads stored Yodoku+ key');
ok(sig.capacitorNative === false && sig.nativeOrigin === false, 'currentSignals defaults others false');
ok(shouldLoadAdTag(sig) === false, 'currentSignals + shouldLoadAdTag blocks for the override');

const freeWin = {
  location: { protocol: 'https:', hostname: 'www.yodoku.app', port: '', search: '' },
  localStorage: { getItem: () => null },
};
ok(shouldLoadAdTag(currentSignals(freeWin)) === true, 'plain web window loads the tag');

// ── 5. index.html inline guard mirrors this table (structural) ─────────────
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
ok(html.includes("dataset.zone = ZONE") && html.includes("https://nap5k.com/tag.min.js"),
  'index.html still injects the exact Monetag tag (zone + src)');
ok(html.includes("'11640179'"), 'index.html keeps zone 11640179');
const guardIdx = html.indexOf('if (adFree()) return;');
const injectIdx = html.indexOf('appendChild(s)');
ok(guardIdx !== -1 && injectIdx !== -1 && guardIdx < injectIdx,
  'index.html injection is gated behind the adFree() guard');
ok(!html.includes('s.dataset.zone=\'11640179\',s.src='), 'raw unguarded tag is gone');
for (const sigName of ["q.get('native')", "q.get('plus')", "yodoku_plus_local", 'isNativePlatform', "hostname === 'localhost'"]) {
  ok(html.includes(sigName), `index.html guard mirrors signal ${sigName}`);
}

console.log(`ad-guard checks: ${checks}`);
console.log('ALL CHECKS PASSED');
