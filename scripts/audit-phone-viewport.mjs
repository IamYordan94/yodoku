// audit-phone-viewport.mjs — deterministic horizontal-overflow audit at phone widths.
//
// Drives headless Chrome over the remote-debugging WebSocket (no puppeteer) and
// reports, per route, whether documentElement.scrollWidth exceeds clientWidth,
// plus the elements whose right edge crosses the viewport. Usage:
//
//   node scripts/audit-phone-viewport.mjs http://127.0.0.1:4173 390,320
//
// Chrome path: CHROME_PATH env or the Windows default. Exit 1 when anything
// overflows. Yodoku has two intentional exceptions the reporter should ignore:
// the home ticker/marquee track (max-content inside overflow:hidden) and the
// LetterMix background grid (absolutely-positioned decoration).

import { spawn } from 'node:child_process';

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = Number(process.env.CDP_PORT || 9223);
const BASE = process.argv[2] || 'http://127.0.0.1:4173';
const WIDTHS = (process.argv[3] || '390').split(',').map(Number);
const SETTLE_MS = Number(process.env.SETTLE_MS || 2600);

const ROUTES = [
  '/', '/?native=1', '/privacy', '/terms', '/plus',
  '/lettermix', '/lettermix/play', '/lettermix/calendar', '/lettermix/about',
  '/wordpool', '/wordpool/play', '/wordpool/previous', '/wordpool/settings', '/wordpool/about',
  '/changebyone', '/changebyone/play', '/changebyone/calendar', '/changebyone/about',
  '/orderle', '/orderle/play', '/orderle/calendar', '/orderle/about',
  '/fermi', '/fermi/play', '/fermi/calendar', '/fermi/about',
  '/quiz', '/quiz/play', '/quiz/archive', '/quiz/about',
  '/seven', '/seven/play', '/seven/archive', '/seven/about',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

const PROBE = `JSON.stringify({
  path: location.pathname + location.search,
  docSW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  offenders: [...document.querySelectorAll('body *')].map(el => {
    const r = el.getBoundingClientRect();
    return { tag: el.tagName, cls: (el.className?.baseVal ?? el.className ?? '').toString().slice(0,70), right: Math.round(r.right), left: Math.round(r.left), w: Math.round(r.width) };
  }).filter(o => o.right > document.documentElement.clientWidth + 2 || o.left < -2)
    .sort((a,b) => b.right - a.right).slice(0, 8)
})`;

async function run(width, ws) {
  await send(ws, 1, 'Emulation.setDeviceMetricsOverride', { width, height: Math.round(width * 2.16), deviceScaleFactor: 2, mobile: true });
  const out = [];
  for (const route of ROUTES) {
    await send(ws, 2, 'Page.navigate', { url: `${BASE}${route}` });
    await sleep(SETTLE_MS);
    const r = await send(ws, 3, 'Runtime.evaluate', { expression: PROBE, returnByValue: true });
    const d = JSON.parse(r.result.value);
    const bad = d.docSW > d.clientW;
    out.push({ width, route, ...d, bad });
    console.log(`${bad ? '❌' : '✅'} ${String(width).padStart(3)}px  ${d.path.padEnd(24)} docSW=${d.docSW} clientW=${d.clientW}`);
    if (d.offenders.length) console.log('     off-screen elems: ' + JSON.stringify(d.offenders));
  }
  return out;
}

async function main() {
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, 'about:blank'], { stdio: 'ignore' });
  await sleep(2800);
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
  const page = list.find((t) => t.type === 'page');
  if (!page) { console.error('No Chrome page target'); chrome.kill(); process.exit(1); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  const all = [];
  for (const w of WIDTHS) all.push(...(await run(w, ws)));

  const bad = all.filter((r) => r.bad);
  console.log(`\n${all.length} checks, ${bad.length} pages overflow.`);
  if (bad.length) console.log('overflowing: ' + bad.map((r) => `${r.width}px ${r.route}`).join(', '));
  ws.close();
  chrome.kill();
  process.exit(bad.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
