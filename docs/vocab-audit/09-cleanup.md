# 09 — Cleanup / dead-weight inventory (READ-ONLY audit)

Date: 2026-10-08. Scope: YODOKUAPP (branch `main`, HEAD `356a3b7`).
Method: file listings + `du`, recursive `grep` for every asset/data/script reference in `src/`, `index.html`,
`public/*.js|json`, `scripts/`, `.github/`; `git branch`/`rev-list` for branches; `grep import` for deps.
**No files were changed or deleted. Nothing was built or installed.**

Why file size matters here: `public/` is bundled into `dist/`, and the Android app ships `dist/` in the APK
(`webDir: 'dist'` in `capacitor.config.ts`). So every dead byte in `public/` hits BOTH the Vercel web download
AND the Android app bundle. `dist/` is git-ignored (`dist tracked files: 0`), so it only affects deploy size,
not repo size; files under `public/` are all git-tracked and affect the repo too.

---

## (a) public/ assets — every file, with reference evidence

| Item | Size | What it is | Reference evidence | Rec | Risk |
|---|---|---|---|---|---|
| `public/images/clear-the-string-logo.png` | 1.8 MB | game logo | grep `clear-the-string-logo` across `src/ index.html public/*.js|json` = **0 hits** | **DELETE** | none found |
| `public/images/wordpool-logo.png` | 2.2 MB | game logo | grep `wordpool-logo` = **0 hits** | **DELETE** | none found |
| `public/vite.svg` | 1.5 KB | default Vite asset | grep `vite.svg` in `src/ index.html public/` = **0 hits** | **DELETE** | none found |
| `public/images/yodoku-logo.png` | ~16 KB | PWA icon / OG image | `index.html` (icon L37, `og:image` L56, `twitter:image` L62) + `public/manifest.json` L11,16 | **KEEP** | live icon |
| `public/design/clear-the-string/!-- ========= HOME (ANIMATED STRING.html` | 18 KB | old prototype HTML | grep `ANIMATED STRING`/`hub.html` = **0 hits** | **DELETE** | none found |
| `public/design/clear-the-string/game logo.png` | 1.8 MB | old source art | no reference in code | **DELETE** | none found |
| `public/design/hub/hub.html` | 12.5 KB | old hub prototype | no reference in code | **DELETE** | none found |
| `public/design/hub/wordcraft-hub-logo.png` | 1.6 MB | old logo, **WordCraft** name | no reference in code | **DELETE** | none found |
| `public/design/{wordpool,components,change-by-one}/` | 0 B | **empty dirs** | none | **DELETE** | none |
| `public/sw.js` | 2.6 KB | service worker (network-first data/HTML) | live, referenced by `index.html` registration | **KEEP** | — |
| `public/manifest.json` | 457 B | PWA manifest | live | **KEEP** | — |
| `public/sitemap.xml`, `public/robots.txt`, `public/_redirects` | 4.7 K / 68 B / 24 B | SEO + SPA routing | live; `robots.txt` points at sitemap | **KEEP** | — |
| `public/words-cbo.json` | 260 KB | curated dictionary | fetched at runtime by `src/utils/cbo-words.ts:12` + `src/utils/englishWords.ts:17` | **KEEP** | — |
| `public/cbo-pairs-4..7.json` | 34–36 KB each | CBO pair data | fetched at runtime by `src/utils/cbo-dailyChallenge.ts:58-61` | **KEEP** | — |

**public/design/ = 3.4 MB unreferenced** (confirmed copied: `du -sh dist/design` = 3.4M). Combined with the two
unused logos that is **≈ 5.6 MB of dead payload** shipped to every web visitor's deploy and every Android bundle.

---

## (b) public/data/words.json — 14.8 MB

- File: `public/data/words.json`, **14.8 MB (15,204 KB)**, shape `{ "3":[..], ... "9":[..] }`, **116,042 entries** (keys 3–9).
- **Every reference** (grep `words.json` over `src/`, `public/sw.js`, `scripts/`, `index.html`):
  | Where | Kind | Runtime? |
  |---|---|---|
  | `src/hooks/useWordDatabase.ts:24` `fetch('/data/words.json')` | runtime fetch | **YES** |
  | `src/pages/LetterMixPage.tsx:4,174` (only consumer of `useWordDatabase`) | runtime use | **YES** |
  | `scripts/generate-seven-boards.mjs:10` | offline generator | no |
  | `scripts/generateLetterMixPuzzles.js:147` (comment + pool) | offline generator | no |
  | `scripts/rebalance-lettermix.mjs` | offline one-time fix | no |
  | `scripts/sustain/keepers/cbo.mjs:25`, `scripts/sustain/runway.mjs:69` | offline sustainer | no |
  | `scripts/test-lettermix-logic.mjs:56` | offline test | no |
  | `public/sw.js` | no explicit path — matches the generic `.json` network-first rule, never pre-cached | — |
- **Exact runtime reader: only Clear the String** (`LetterMixPage` via `useWordDatabase`). Change by One uses
  `words-cbo.json` instead (`cbo-words.ts`); Clear the String *validation* also uses `words-cbo.json`
  (`englishWords.ts`). Nothing else fetches `words.json`.
- **Cost:** 14.8 MB downloaded by every Clear the String player (network-first → fresh every visit, never cached
  as an offline asset, and it is *not* in the SW precache list); 14.8 MB in the git repo; ~14.8 MB added to
  `dist/` on every Vercel deploy and to the Android bundle.
- **Alternative already present:** `public/words-cbo.json` = **260 KB, 17,705 curated words** (keys 3–8), already
  the dictionary for Change by One and Clear the String validation, already excluding the non-words
  ("wran", "ming", "ignobly"…) that broke recent puzzles.
- **Recommendation: SHRINK / REPLACE.** Point `useWordDatabase` at `words-cbo.json` (needs a small shape adapter —
  cbo file is a flat word list, `words.json` is `{word,pos,definition}` objects) → **~14.5 MB off the web
  download + Android bundle, 57× smaller**.
- **What would break / do not do it blindly:** Clear the String would start rejecting any valid word that is
  *not* in the 17,705-word curated list (some longer/technical words currently accepted via the big dictionary);
  and the maintainer is mid-migration — `main` HEAD is `chore(scaffold): letter generator draws from curated pool
  … Puzzle data NOT regenerated yet - pending vocabulary audit and owner decisions`. So REPLACE is the right
  direction but must land **with** the vocabulary audit + puzzle regeneration, not before. Until then KEEP.

---

## (c) scripts/ — dead-script candidates

Wired (npm `scripts`, `.github/workflows/sustain.yml`, or imported by another script) → **KEEP**:
`merge-quiz-bank.mjs`, `test-quiz-logic.mjs`, `prerender-seo.mjs`, `serve-dist.mjs`, `test-ad-guard.mjs`,
`test-lettermix-logic.mjs`, `validate-cbo.mjs`, `build-cbo-words.mjs`, `gen-cbo-pairs.mjs`,
`generate-seven-boards.mjs`, `generateLetterMixPuzzles.js`, `build-android.sh`, and all of `scripts/sustain/`,
`scripts/quiz-bank/`, `scripts/data/`.

Zero references anywhere (no npm script, no import, no workflow, no doc mention):

| Script | Size | Verdict | Evidence |
|---|---|---|---|
| `fix-dup-general.mjs` | 3.5 KB | **DELETE candidate** | one-time quiz-bank duplicate fix (mentions `gen-008`); not in any npm script/import |
| `rebalance-lettermix.mjs` | 3.7 KB | **KEEP (temporarily)** | one-time fix dated **2026-10-08** (today), part of the live vocabulary work; likely becomes dead after the audit |
| `audit-phone-viewport.mjs` | 4.5 KB | **KEEP** | manual CDP audit tool, documented in the yodoku skill |
| `verify-native-shell.mjs` | 6.3 KB | **KEEP** | manual native-shell verifier, documented in the skill |
| `test-game-resume.mjs`, `test-next-reset.mjs`, `test-seven-tiers.mjs`, `test-wordpool-hints.mjs` | 2–4 KB | **KEEP** (could be wired) | per-feature tests; not in `npm test` but valid regression guards |
| `verify-player-wishlist.mjs` | 10.7 KB | **KEEP** (could be wired) | 25-check CDP verifier |

Note: `npm test` currently runs only 4 of the ~10 `test-*`/`validate-*` scripts. If the owner wants a smaller
footprint, wiring these into `npm test` is preferable to deleting them.

---

## (d) git branches

Command: `git branch -vv`, `git branch --merged main`, `git rev-list --count main..<b>`.
(`main` vs `origin/main`: **0 / 0 — fully pushed.**)

| Branch | Tip | Last commit | Commits NOT in main | Verdict |
|---|---|---|---|---|
| `es-p1-check` → `origin/es/p1-i18n` | 4658cd8 | 2026-10-05 | **2** | **KEEP** — unmerged Spanish Phase 1 |
| `feat/native-shell-pass` | 52f1b42 | 2026-10-05 | 0 | **DELETE candidate** (merged) |
| `feat/player-wishlist` | b200373 | 2026-10-05 | 0 | **DELETE candidate** (merged) |
| `feat/seo-prerender` | 44b5770 | 2026-10-05 | 0 | **DELETE candidate** (merged) |
| `fix/android-app-link-signin` | fe18208 | 2026-10-04 | 0 | **DELETE candidate** (merged) |
| `fix/word-games-data` | 48ece08 | 2026-10-05 | 0 | **DELETE candidate** (merged) |
| `yodoku-plus` | 6f4b401 | 2026-10-03 | 0 | **DELETE candidate** (merged) |

Six branches have **0 commits not reachable from `main`** — their content is fully in `main`, so deleting them
loses nothing. (The yodoku skill's notes calling some of these "not yet merged" are stale — verified here.)
The matching **remote** branches exist on `origin` and are equally contained except `origin/es/p1-i18n`.
**Not deleted** per instructions.

---

## (e) Repo root + docs clutter

| Item | Size | Verdict | Note |
|---|---|---|---|
| `Screenshot 2026-02-12 112941.png` | 93.5 KB | **DELETE candidate** | git-tracked root screenshot, no reference |
| `Screenshot 2026-02-12 113015.png` | 104.7 KB | **DELETE candidate** | git-tracked root screenshot, no reference |
| `word_game_hub_brief.md` | 11.3 KB | **DELETE/archive candidate** | pre-rename brief ("WordCraft / Hub") |
| `INSPECTION_REPORT.md` | 12.3 KB | **archive/DELETE candidate** | March audit — skill says "fully closed" |
| `RECOVERY.md` | 2.4 KB | KEEP | recovery notes |
| `ANDROID_SETUP.md` | 8.7 KB | KEEP | build setup |
| `README.md` | 3.3 KB | KEEP | — |
| `docs/AUDIT-2026-08-22.md` | 18.3 KB | KEEP (historical) | closed audit; referenced by skill |
| `docs/ROADMAP-SUGGESTIONS.md` | 2.3 KB | low priority | minor |
| `docs/design/yodoku-plus-preview.html` | 12 KB | KEEP | cited as design reference in `PlusLocked.tsx`/`PlusPage.tsx` |
| `docs/play-store/**` (screenshots + feature graphic) | 972 KB | KEEP | Play listing assets |
| `.hermes/`, `.claude/`, `.superpowers/` | — | ignored | already in `.gitignore` |

---

## (f) Dependencies — no unused packages found

`grep` for each package in `src/` (static + dynamic imports + `capacitor.config.ts`):

| Package | Used? | Evidence |
|---|---|---|
| react, react-dom, react-router-dom, framer-motion | yes | 91 / 1 / 43 / 18 imports |
| @vercel/analytics | yes | `App.tsx`, `utils/telemetry.ts` |
| @supabase/supabase-js | yes | dynamic import `utils/account.ts:31` |
| tailwindcss, @tailwindcss/vite | yes | `src/index.css` `@import "tailwindcss"`, `vite.config.ts` |
| @capacitor/app | yes | `App.tsx`, `NativeShell.tsx` |
| @capacitor/local-notifications, /status-bar, /share, /haptics | yes | dynamic imports in `utils/nativeShell.ts` (L38,151,169,191,199) |
| @capacitor/splash-screen | yes | `capacitor.config.ts` plugin config |
| @capacitor/core, @capacitor/android | yes | base/peer of the plugin stack + Android platform |

**Conclusion: every declared dependency is referenced.** Do not prune deps. (Note: the earlier
"import-from: 0" counts for capacitor/`supabase` were false negatives — those are dynamic `import()`s, which this
audit re-grepped explicitly.)

---

## Bottom line

| Win | Size freed | Risk |
|---|---|---|
| Delete `public/design/**` (incl. WordCraft logo) | **3.4 MB** web + Android | none found |
| Delete `public/images/clear-the-string-logo.png` + `wordpool-logo.png` | **4.0 MB** web + Android | none found |
| Replace runtime `words.json` (14.8 MB) with `words-cbo.json` (260 KB) | **~14.5 MB** web + Android | medium — must ship with the vocabulary audit + puzzle regen |
| Delete `public/vite.svg`, 2 root screenshots, `word_game_hub_brief.md` | ~215 KB | none found |
| Delete 6 fully-merged branches | repo hygiene | none (all in `main`) |
| **No unused dependencies** | — | — |

Biggest single win: the **14.8 MB `words.json`** (already mid-migration to the 260 KB curated pool; the scaffold
commit on `main` is waiting on this audit). Safest big win: **`public/design/` + the two unused logos ≈ 5.6 MB**
with zero code references.
