// verify-player-wishlist.mjs — 390px phone-viewport verification of the
// player-wishlist features on a built dist, via headless Chrome CDP.
//
//   node scripts/verify-player-wishlist.mjs http://127.0.0.1:4175
//
// Checks the changed screens (hub countdown/summary/newsletter, quiz
// explanations + resume, word pool progressive hint, 7 Letters tiers + archive,
// quiz archive) and reports JS errors + horizontal overflow per route.
//
// NOTE: Word Pool's on-screen keyboard ignores synthetic .click(); this script
// only clicks ordinary buttons (Hint, quiz options) with .click(), which works.

import { spawn } from 'node:child_process';

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = Number(process.env.CDP_PORT || 9227);
const BASE = process.argv[2] || 'http://127.0.0.1:4175';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let idc = 1;
function send(ws, method, params = {}) {
  const id = idc++;
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

const results = [];
function check(label, ok, detail = '') {
  results.push({ label, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`);
}

async function evalJs(ws, expr) {
  const r = await send(ws, 'Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  return r.result?.value;
}
async function nav(ws, path, settle = 2200) {
  await send(ws, 'Page.navigate', { url: `${BASE}${path}` });
  await sleep(settle);
}
async function drainErrors(ws) {
  const errs = await evalJs(ws, 'JSON.stringify(window.__errs||[])');
  await evalJs(ws, 'window.__errs=[]');
  const list = JSON.parse(errs || '[]');
  // The Vercel Analytics beacon (/ _vercel/insights/script.js) does not exist on
  // the local static server — the SPA fallback returns index.html and the beacon
  // throws "Unexpected token '<'". That is a local-serve artifact, not app code.
  return list.filter((e) => !String(e.f || '').includes('_vercel/insights'));
}
async function overflow(ws) {
  return evalJs(ws, `(() => { const d=document.documentElement; return { sw:d.scrollWidth, cw:d.clientWidth }; })()`);
}

async function main() {
  const profile = `${process.env.TEMP || process.env.TMP || '/tmp'}/yodoku-verify-${Date.now()}`;
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--user-data-dir=${profile}`, `--remote-debugging-port=${PORT}`, 'about:blank'], { stdio: 'ignore' });
  await sleep(2800);
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
  const page = list.find((t) => t.type === 'page');
  if (!page) { console.error('No Chrome page target'); chrome.kill(); process.exit(1); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  await send(ws, 'Page.enable');
  await send(ws, 'Runtime.enable');
  await send(ws, 'Page.addScriptToEvaluateOnNewDocument', {
    source: "window.__errs=[];window.addEventListener('error',e=>window.__errs.push({m:String(e.message),f:String(e.filename||'')}));window.addEventListener('unhandledrejection',e=>window.__errs.push({m:'rej:'+String(e.reason),f:''}));",
  });
  // Device metrics BEFORE navigation (override survives for this reused target).
  await send(ws, 'Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

  const overflows = [];
  const pushOverflow = async (route) => {
    const o = await overflow(ws);
    if (o && o.sw > o.cw) overflows.push(`${route} (${o.sw}>${o.cw})`);
  };

  // ── A. Hub: countdown + combined summary + dismissible newsletter ──────────
  await nav(ws, '/');
  const hasTimer = await evalJs(ws, `!!document.querySelector('[role="timer"]')`);
  const timerText = await evalJs(ws, `document.querySelector('[role="timer"]')?.innerText||''`);
  check('hub: next-daily countdown renders', hasTimer, timerText.replace(/\n/g, ' | ').slice(0, 60));
  check('hub: countdown shows 00:00 UTC boundary', /resets 00:00 UTC/.test(timerText));
  const summaryBtn = await evalJs(ws, `[...document.querySelectorAll('button')].some(b=>/share my day|share summary/i.test(b.innerText))`);
  check('hub: combined daily summary share button', summaryBtn);
  const nlLabel = await evalJs(ws, `document.body.innerText.toLowerCase().includes('get the daily puzzles by email')`);
  check('hub: dismissible email module copy present', nlLabel);
  await pushOverflow('/');
  const hubErrs = await drainErrors(ws);
  check('hub: no JS errors (excl. local Vercel beacon)', hubErrs.length === 0, hubErrs.map((e) => e.m).join('; '));

  // ── B. Quiz explanations (answer until a wrong one reveals the teaching line)
  await nav(ws, '/quiz/play');
  let sawExplanation = false;
  for (let i = 0; i < 10 && !sawExplanation; i++) {
    await evalJs(ws, `(() => { const b=[...document.querySelectorAll('button')].find(x=>{const s=x.querySelector('span');return s&&/^[A-D]$/.test(s.textContent.trim());}); if(b){b.click();return true;} return false; })()`);
    await sleep(500);
    sawExplanation = await evalJs(ws, `document.body.innerText.toLowerCase().includes('the answer')`);
    if (!sawExplanation) {
      await evalJs(ws, `(() => { const n=[...document.querySelectorAll('button')].find(x=>/next/i.test(x.innerText)); if(n){n.click();return true;} return false; })()`);
      await sleep(500);
    }
  }
  check('quiz: explanation revealed on a wrong answer', sawExplanation);
  await pushOverflow('/quiz/play');

  // ── C. Quiz resume on reload ────────────────────────────────────────────────
  await nav(ws, '/quiz/play');
  await evalJs(ws, `(() => { const b=[...document.querySelectorAll('button')].find(x=>{const s=x.querySelector('span');return s&&/^[A-D]$/.test(s.textContent.trim());}); if(b){b.click();return true;} return false; })()`);
  await sleep(500);
  await send(ws, 'Page.reload');
  await sleep(2200);
  const resumed = await evalJs(ws, `document.body.innerText.includes('Continued where you left off')`);
  const answeredMarked = await evalJs(ws, `document.body.innerText.includes('✓') || document.body.innerText.includes('✗')`);
  check('quiz: resume banner after leaving and returning', resumed);
  check('quiz: answered state restored (✓/✗ shown)', answeredMarked);
  const quizErrs = await drainErrors(ws);
  check('quiz: no JS errors', quizErrs.length === 0, quizErrs.map((e) => e.m).join('; '));

  // ── D. Quiz archive (archive-by-date) ───────────────────────────────────────
  await nav(ws, '/quiz/archive');
  const quizArchiveItems = await evalJs(ws, `[...document.querySelectorAll('a')].filter(a=>/\\?date=/.test(a.getAttribute('href')||'')).length`);
  check('quiz archive: lists past-date play links', quizArchiveItems > 0, `${quizArchiveItems} entries`);
  const archivePlay = await evalJs(ws, `(() => { const a=document.querySelector('a[href*="?date="]'); if(a){a.click();return true;} return false; })()`);
  await sleep(2200);
  const archiveLoaded = await evalJs(ws, `document.body.innerText.includes('Q 1/10')`);
  check('quiz archive: past-date play page loads', !!archivePlay && archiveLoaded);
  await pushOverflow('/quiz/archive');

  // ── E. Word Pool progressive hint ───────────────────────────────────────────
  await nav(ws, '/wordpool/play', 2600);
  const hinted = await evalJs(ws, `(() => { const b=[...document.querySelectorAll('button')].find(x=>/^hint$/i.test(x.innerText.trim())); if(b){b.click();return true;} return false; })()`);
  await sleep(600);
  const hintText = await evalJs(ws, `(document.body.innerText.match(/💡[^\\n]*/)||[''])[0]`);
  check('wordpool: hint button clicked', !!hinted);
  check('wordpool: hint reveals a letter position (not just length)', /💡/.test(hintText) && /[·A-Z]/.test(hintText.replace('💡','')), hintText.slice(0, 60));
  await pushOverflow('/wordpool/play');

  // ── F. 7 Letters tiers + archive ────────────────────────────────────────────
  await nav(ws, '/seven/play');
  const sevenBody = await evalJs(ws, `document.body.innerText`);
  check('seven: richer tier legend (Queen Bee)', /QUEEN BEE/i.test(sevenBody));
  check('seven: "words to next tier" progress line', /word s?to\s+(Good|Solid|Great|Amazing|Genius|Queen Bee)/i.test(sevenBody) || /words? to (Good|Solid|Great|Amazing|Genius|Queen Bee)/i.test(sevenBody));
  await pushOverflow('/seven/play');
  await nav(ws, '/seven/archive');
  const sevenArchiveItems = await evalJs(ws, `[...document.querySelectorAll('a')].filter(a=>/\\?board=/.test(a.getAttribute('href')||'')).length`);
  check('seven archive: lists past-board play links', sevenArchiveItems > 0, `${sevenArchiveItems} entries`);
  const sevenErrs = await drainErrors(ws);
  check('seven: no JS errors', sevenErrs.length === 0, sevenErrs.map((e) => e.m).join('; '));
  await pushOverflow('/seven/archive');

  // ── G. Archive entry point visible on every game hub ────────────────────────
  for (const [route, needle] of [
    ['/lettermix', '/lettermix/calendar'], ['/changebyone', '/changebyone/calendar'],
    ['/wordpool', '/wordpool/previous'], ['/orderle', '/orderle/calendar'],
    ['/fermi', '/fermi/calendar'], ['/quiz', '/quiz/archive'], ['/seven', '/seven/archive'],
  ]) {
    await nav(ws, route, 1800);
    const href = await evalJs(ws, `[...document.querySelectorAll('a')].some(a=>(a.getAttribute('href')||'')==='${needle}')`);
    check(`hub ${route}: "past puzzles" link → ${needle}`, href);
    await pushOverflow(route);
  }

  check('no horizontal overflow on any checked route', overflows.length === 0, overflows.join(', '));

  ws.close();
  chrome.kill();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length} checks, ${failed.length} failed.`);
  if (failed.length) { console.log('FAILED: ' + failed.map((f) => f.label).join(' | ')); process.exit(1); }
  console.log('ALL CHECKS PASSED');
}

main().catch((e) => { console.error(e); process.exit(1); });
