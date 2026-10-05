// verify-native-shell.mjs — real-browser evidence for the native app-shell pass.
//
// Static assertions on the source PLUS a headless-Chrome (CDP) check that the
// Monetag tag is injected for ordinary web traffic and withheld for the native
// app / Yodoku+ state — including a window.Capacitor bridge injected before
// page scripts (exactly what Capacitor does), which is the true native path.
//
// Usage: start the preview server, then
//   node scripts/verify-native-shell.mjs http://127.0.0.1:4173
// Prints ALL CHECKS PASSED or FAIL: ...

import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const BASE = process.argv[2] || 'http://127.0.0.1:4173';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = Number(process.env.CDP_PORT || 9224);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let checks = 0;
function ok(cond, msg) {
  checks++;
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exitCode = 1;
  }
}

// ── 1. Static source assertions ─────────────────────────────────────────────
const nativeShell = readFileSync(new URL('../src/utils/nativeShell.ts', import.meta.url), 'utf8');
ok(/REMINDER_ID\s*=\s*1001/.test(nativeShell), 'reminder uses one fixed id (1001) — no duplicates');
ok(/REMINDER_HOUR\s*=\s*9/.test(nativeShell) && /REMINDER_MINUTE\s*=\s*0/.test(nativeShell),
  'reminder is set for 09:00');
ok(/isExactNotification:\s*false/.test(nativeShell), 'reminder schedules an inexact alarm (no exact-alarm gate)');
ok(!/import[^;'"]*['"][^'"]*(firebase|@capacitor\/push|onesignal)/i.test(nativeShell),
  'no Firebase / remote-push package is imported for the reminder');
ok(/@capacitor\/local-notifications/.test(nativeShell) && /@capacitor\/share/.test(nativeShell)
  && /@capacitor\/haptics/.test(nativeShell) && /@capacitor\/status-bar/.test(nativeShell),
  'all four shell plugins are wired');

// ── 2. CDP browser checks ───────────────────────────────────────────────────
function send(ws, id, method, params) {
  return new Promise((resolve, reject) => {
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id !== id) return;
      ws.removeEventListener('message', onMsg);
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, 'about:blank'], { stdio: 'ignore' });
  await sleep(2800);
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
  const page = list.find((t) => t.type === 'page');
  if (!page) { console.error('No Chrome page target'); chrome.kill(); process.exit(1); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  let nonce = 0;
  const evaluate = async (expr) => {
    const r = await send(ws, ++id, 'Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result?.value;
  };
  // Every navigation gets a unique query so Chrome always loads a fresh document
  // (same-URL Page.navigate can be a no-op, which would skip a freshly registered
  // addScriptToEvaluateOnNewDocument injection).
  const go = async (path, wait = 1800) => {
    const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}_t=${++nonce}`;
    await send(ws, ++id, 'Page.navigate', { url });
    await sleep(wait);
  };
  const TAG_PRESENT = `!!document.querySelector('script[src*="tag.min.js"], script[data-zone]')`;
  const REMINDER_CARD = `document.body.innerText.includes('DAILY REMINDER')`;

  await send(ws, ++id, 'Page.enable');
  await send(ws, ++id, 'Runtime.enable');

  // (a) ordinary web free user -> tag MUST load (behavior unchanged)
  await go('/');
  ok((await evaluate(TAG_PRESENT)) === true, 'web free user loads the Monetag tag');
  ok((await evaluate(REMINDER_CARD)) === false, 'web user does NOT see the reminder card');

  // (b) ?native=1 simulation -> no tag, reminder card present
  await go('/?native=1');
  ok((await evaluate(TAG_PRESENT)) === false, '?native=1 withholds the tag');
  ok((await evaluate(REMINDER_CARD)) === true, '?native=1 shows the reminder card');

  // (c) ?plus=1 subscriber simulation -> no tag
  await go('/?plus=1');
  ok((await evaluate(TAG_PRESENT)) === false, '?plus=1 (subscriber) withholds the tag');

  // (d) stored Yodoku+ state -> no tag
  await go('/');
  await evaluate(`localStorage.setItem('yodoku_plus_local','1')`);
  await go('/');
  ok((await evaluate(TAG_PRESENT)) === false, 'stored Yodoku+ state withholds the tag');
  await evaluate(`localStorage.removeItem('yodoku_plus_local')`);

  // (e) REAL native path: a Capacitor bridge injected before page scripts.
  //     The inline <head> guard sees this bridge and withholds the tag — this is
  //     the earliest point in a real native launch. (The app-side React check is
  //     covered by ?native=1 in (b): at runtime @capacitor/core replaces the
  //     injected stub with its own web instance, so a stub cannot drive React —
  //     in the real app that instance reports isNativePlatform() === true.)
  const injected = await send(ws, ++id, 'Page.addScriptToEvaluateOnNewDocument', {
    source: `window.Capacitor = { isNativePlatform: () => true, platform: 'android' };`,
  });
  await go('/');
  ok((await evaluate(`typeof window.Capacitor`)) === 'object', 'a Capacitor global is present');
  ok((await evaluate(TAG_PRESENT)) === false, 'native Capacitor bridge withholds the tag');
  if (injected && injected.identifier) {
    await send(ws, ++id, 'Page.removeScriptToEvaluateOnNewDocument', { identifier: injected.identifier });
  }

  ws.close();
  chrome.kill();

  console.log(`native-shell checks: ${checks}`);
  if (process.exitCode) console.log('SOME CHECKS FAILED');
  else console.log('ALL CHECKS PASSED');
}

main().catch((e) => { console.error(e); process.exit(1); });
