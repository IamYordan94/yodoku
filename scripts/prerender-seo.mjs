#!/usr/bin/env node
/**
 * Per-route SEO prerender (post-build step).
 *
 * Runs AFTER `vite build`. Reads the freshly built dist/index.html and emits a
 * dist/<route>/index.html for every STATIC public route, each a byte-for-byte
 * copy of the built shell except for the crawler-facing head elements:
 *   <title>, meta[name=description], link[rel=canonical],
 *   og:url / og:title / og:description, twitter:title / twitter:description,
 *   and (on home routes only) a WebSite JSON-LD block.
 *
 * Everything else — most importantly the Monetag ad-guard <script>, the
 * boot-loader CSS/markup/scripts, the module <script> and stylesheet links —
 * is preserved exactly. The React app boots the same way on every page, so
 * client-side routing keeps working.
 *
 * Dynamic routes (e.g. /wordpool/:date, /wordpool/category/:id,
 * /lettermix/play/:date/:level) are intentionally NOT prerendered: they fall
 * through to the SPA shell via the vercel.json catch-all.
 *
 * Also emits dist/sitemap.xml with the build date, keeping the shipped sitemap
 * current without hand-editing public/sitemap.xml.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '..', 'dist');
const SITE = 'https://www.yodoku.app';

// ---------------------------------------------------------------------------
// Route table — single source of truth for prerender + sitemap + vercel.json.
// Every entry maps to a STATIC route in src/App.tsx (no :params).
// `home: true` marks the site home and each game hub home (get the WebSite
// JSON-LD block).
// ---------------------------------------------------------------------------
const ROUTES = [
  { path: '/', title: 'Yodoku — Daily Word Games', desc: 'Yodoku is a free collection of seven daily word and trivia games. Play Clear the String, Change by One, Word Pool, ORDERLE, FERMI, Quiz Master and 7 Letters — new puzzles every day.', home: true, changefreq: 'daily', priority: '1.0' },

  { path: '/lettermix', title: 'Clear the String — Yodoku', desc: 'Clear the String is a free daily word game: rearrange the letters to clear the string. Play today\u2019s puzzle and browse past dates on Yodoku.', home: true, changefreq: 'daily', priority: '0.9' },
  { path: '/lettermix/play', title: 'Play Clear the String — Yodoku', desc: 'Play today\u2019s Clear the String puzzle — a free daily letter game on Yodoku. Rearrange the letters to form the hidden word.', changefreq: 'daily', priority: '0.8' },
  { path: '/lettermix/calendar', title: 'Clear the String Calendar — Yodoku', desc: 'Browse the Clear the String calendar and replay past daily letter puzzles on Yodoku.', changefreq: 'daily', priority: '0.6' },
  { path: '/lettermix/about', title: 'About Clear the String — Yodoku', desc: 'Learn how to play Clear the String, the daily letter-rearranging word game on Yodoku. Free to play, with a new puzzle every day.', changefreq: 'monthly', priority: '0.5' },

  { path: '/wordpool', title: 'Word Pool — Yodoku', desc: 'Word Pool is a free daily word game: pick the words that fit the category. Play today\u2019s puzzle on Yodoku.', home: true, changefreq: 'daily', priority: '0.9' },
  { path: '/wordpool/play', title: 'Play Word Pool — Yodoku', desc: 'Play today\u2019s Word Pool category puzzle — a free daily word game on Yodoku. Find every word that fits the category.', changefreq: 'daily', priority: '0.8' },
  { path: '/wordpool/previous', title: 'Word Pool Archive — Yodoku', desc: 'Replay previous Word Pool puzzles from the Yodoku archive.', changefreq: 'daily', priority: '0.6' },
  { path: '/wordpool/settings', title: 'Word Pool Settings — Yodoku', desc: 'Choose your Word Pool categories and preferences on Yodoku.', changefreq: 'monthly', priority: '0.4' },
  { path: '/wordpool/about', title: 'About Word Pool — Yodoku', desc: 'Learn how to play Word Pool, the daily category word game on Yodoku — free, with a new category every day.', changefreq: 'monthly', priority: '0.5' },

  { path: '/changebyone', title: 'Change by One — Yodoku', desc: 'Change by One is a free daily word-ladder game: turn one word into another, one letter at a time. Play today\u2019s puzzle on Yodoku.', home: true, changefreq: 'daily', priority: '0.9' },
  { path: '/changebyone/play', title: 'Play Change by One — Yodoku', desc: 'Play today\u2019s Change by One word ladder — a free daily puzzle on Yodoku. Get from the first word to the last, one letter at a time.', changefreq: 'daily', priority: '0.8' },
  { path: '/changebyone/calendar', title: 'Change by One Calendar — Yodoku', desc: 'Browse the Change by One calendar and replay past daily word-ladder puzzles on Yodoku.', changefreq: 'daily', priority: '0.6' },
  { path: '/changebyone/about', title: 'About Change by One — Yodoku', desc: 'Learn how to play Change by One, the daily word-ladder game on Yodoku. Free to play, with a new ladder every day.', changefreq: 'monthly', priority: '0.5' },

  { path: '/orderle', title: 'ORDERLE — Yodoku', desc: 'ORDERLE is a free daily sequencing game: put the items in the right order. Play today\u2019s puzzle on Yodoku.', home: true, changefreq: 'daily', priority: '0.9' },
  { path: '/orderle/play', title: 'Play ORDERLE — Yodoku', desc: 'Play today\u2019s ORDERLE puzzle — a free daily sequencing game on Yodoku. Put the items in the correct order.', changefreq: 'daily', priority: '0.8' },
  { path: '/orderle/calendar', title: 'ORDERLE Calendar — Yodoku', desc: 'Browse the ORDERLE calendar and replay past daily sequencing puzzles on Yodoku.', changefreq: 'daily', priority: '0.6' },
  { path: '/orderle/about', title: 'About ORDERLE — Yodoku', desc: 'Learn how to play ORDERLE, the daily ordering game on Yodoku. Free to play, with a fresh sequence every day.', changefreq: 'monthly', priority: '0.5' },

  { path: '/fermi', title: 'FERMI — Yodoku', desc: 'FERMI is a free daily estimation game: make your best guess and get scored on how close you are. Play today\u2019s puzzle on Yodoku.', home: true, changefreq: 'daily', priority: '0.9' },
  { path: '/fermi/play', title: 'Play FERMI — Yodoku', desc: 'Play today\u2019s FERMI estimation puzzle — a free daily game on Yodoku. Make your best guess and see how close you get.', changefreq: 'daily', priority: '0.8' },
  { path: '/fermi/calendar', title: 'FERMI Calendar — Yodoku', desc: 'Browse the FERMI calendar and replay past daily estimation puzzles on Yodoku.', changefreq: 'daily', priority: '0.6' },
  { path: '/fermi/about', title: 'About FERMI — Yodoku', desc: 'Learn how to play FERMI, the daily estimation game on Yodoku. Free to play, with a new question every day.', changefreq: 'monthly', priority: '0.5' },

  { path: '/quiz', title: 'Quiz Master — Yodoku', desc: 'Quiz Master is a free daily trivia quiz with questions across eleven categories. Play today\u2019s 10-question quiz on Yodoku.', home: true, changefreq: 'daily', priority: '0.9' },
  { path: '/quiz/play', title: 'Play Quiz Master — Yodoku', desc: 'Play today\u2019s Quiz Master — a free daily general-knowledge quiz on Yodoku. Ten fresh questions every day.', changefreq: 'daily', priority: '0.8' },
  { path: '/quiz/about', title: 'About Quiz Master — Yodoku', desc: 'Learn about Quiz Master, the daily trivia game on Yodoku, with questions from eleven categories. Free to play.', changefreq: 'monthly', priority: '0.5' },
  { path: '/quiz/archive', title: 'Quiz Master Archive — Yodoku', desc: 'Replay past Quiz Master daily quizzes on Yodoku — the same ten questions for everyone, any recent date.', changefreq: 'daily', priority: '0.6' },

  { path: '/seven', title: '7 Letters — Yodoku', desc: '7 Letters is a free daily word game in the style of the classic spelling bee: make words from seven letters. Play today\u2019s puzzle on Yodoku.', home: true, changefreq: 'daily', priority: '0.9' },
  { path: '/seven/play', title: 'Play 7 Letters — Yodoku', desc: 'Play today\u2019s 7 Letters puzzle — a free daily word game on Yodoku. Build words from seven letters and find the pangram.', changefreq: 'daily', priority: '0.8' },
  { path: '/seven/about', title: 'About 7 Letters — Yodoku', desc: 'Learn how to play 7 Letters, the daily spelling-bee-style word game on Yodoku. Free to play, with a new set of letters every day.', changefreq: 'monthly', priority: '0.5' },
  { path: '/seven/archive', title: '7 Letters Archive — Yodoku', desc: 'Replay past 7 Letters boards on Yodoku — seven letters, one centre, chase the pangram on any board.', changefreq: 'daily', priority: '0.6' },

  { path: '/plus', title: 'Yodoku+ — Yodoku', desc: 'Yodoku+ unlocks the full puzzle archive, an ad-free experience and more. Support Yodoku and play every past daily puzzle.', changefreq: 'monthly', priority: '0.6' },
  { path: '/privacy', title: 'Privacy Policy — Yodoku', desc: 'Read the Yodoku privacy policy — what data we collect, how cookies and advertising work, and your choices.', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', title: 'Terms of Use — Yodoku', desc: 'Read the Yodoku terms of use for the daily word and trivia games on yodoku.app.', changefreq: 'yearly', priority: '0.3' },
];

const urlFor = (route) => (route === '/' ? `${SITE}/` : `${SITE}${route}`);

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function jsonLd(route) {
  const u = urlFor(route);
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Yodoku',
    url: u,
    description: 'Seven free daily word and trivia games — Clear the String, Change by One, Word Pool, ORDERLE, FERMI, Quiz Master and 7 Letters.',
    publisher: { '@type': 'Organization', name: 'Yodoku', url: `${SITE}/` },
  });
}

function render(baseHtml, route) {
  const u = urlFor(route.path);
  const title = escapeHtml(route.title);
  const desc = escapeHtml(route.desc);
  let out = baseHtml;

  const must = (label, re) => {
    if (!re.test(out)) throw new Error(`base index.html is missing the expected ${label} tag`);
  };
  must('title', /<title>[\s\S]*?<\/title>/);
  must('description', /<meta name="description" content="[^"]*"\s*\/>/);
  must('og:url', /<meta property="og:url" content="[^"]*"\s*\/>/);
  must('og:title', /<meta property="og:title" content="[^"]*"\s*\/>/);
  must('og:description', /<meta property="og:description" content="[^"]*"\s*\/>/);
  must('twitter:title', /<meta name="twitter:title" content="[^"]*"\s*\/>/);
  must('twitter:description', /<meta name="twitter:description" content="[^"]*"\s*\/>/);

  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  out = out.replace(
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${desc}" />\n    <link rel="canonical" href="${u}" />`,
  );
  out = out.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${u}" />`);
  out = out.replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${title}" />`);
  out = out.replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${desc}" />`);
  out = out.replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${title}" />`);
  out = out.replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${desc}" />`);

  if (route.home) {
    out = out.replace('</head>', `  <script type="application/ld+json">${jsonLd(route.path)}</script>\n  </head>`);
  }
  return out;
}

function assertSafe(html, routePath) {
  const checks = [
    ['ad-guard zone', html.includes("var ZONE = '11640179';")],
    ['ad-guard source', html.includes("var SRC = 'https://nap5k.com/tag.min.js';")],
    ['boot-loader markup', html.includes('id="boot-loader"')],
    ['boot-css style', html.includes('id="boot-css"')],
    ['module bundle', /<script type="module" crossorigin src="\/assets\/index-[^"]+"><\/script>/.test(html)],
    ['stylesheet', /<link rel="stylesheet" crossorigin href="\/assets\/index-[^"]+">/.test(html)],
    ['single <title>', (html.match(/<title>/g) || []).length === 1],
    ['single canonical', (html.match(/rel="canonical"/g) || []).length === 1],
    ['single og:title', (html.match(/property="og:title"/g) || []).length === 1],
    ['single og:description', (html.match(/property="og:description"/g) || []).length === 1],
  ];
  for (const [label, ok] of checks) {
    if (!ok) throw new Error(`prerender output for ${routePath} failed check: ${label}`);
  }
}

function buildSitemap(today) {
  const rows = ROUTES.map(
    (r) =>
      `  <url><loc>${urlFor(r.path)}</loc><lastmod>${today}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`,
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

// ---------------------------------------------------------------------------
function main() {
  const base = readFileSync(join(DIST, 'index.html'), 'utf8');

  for (const route of ROUTES) {
    const html = render(base, route);
    assertSafe(html, route.path);
    const outDir = route.path === '/' ? DIST : join(DIST, route.path);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), html);
  }

  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(join(DIST, 'sitemap.xml'), buildSitemap(today));

  console.log(`prerender-seo: wrote ${ROUTES.length} route pages + dist/sitemap.xml (lastmod ${today})`);
  for (const r of ROUTES) console.log(`  ${r.path === '/' ? '/' : r.path} -> ${r.path === '/' ? 'index.html' : r.path.replace(/^\//, '') + '/index.html'}`);
}

main();
