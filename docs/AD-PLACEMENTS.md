# Yodoku — Concrete Ad Placements

A developer-implementable list. Every placement is a **display banner only** (no popunders, no interstitials, no rewarded-on-web). One reusable component, one Monetag loader script in `index.html`, one zone `<div>` per slot below.

**Implementation pattern (build once):**
1. Add the Monetag loader script to `index.html` (defer/async, after the root div).
2. Create `src/components/AdSlot.tsx` — a tiny component that renders the Monetag zone `<div>` (with the zone data attributes), lazy-loads it, and reserves a fixed-height container so the page doesn't jump.
3. Drop `<AdSlot format="banner" />` at each placement below. All slots share the same zone initially; split into separate zones later once Monetag stats show per-slot performance.

---

## Priority 1 — ship these first (highest value, zero loop risk)

### 1. Hub — below the game grid, above the footer
- **Route / file:** `/` — `src/pages/Hub.tsx` (after the closing `</div>` of the game grid, before the `<footer>`)
- **UI moment:** user finished browsing the 6 game cards and is scrolling down / deciding.
- **Format:** leaderboard / inline banner — `728×90` desktop, `320×50` mobile.
- **Priority:** 1
- **Why:** the highest-traffic page on the site, and it's pure browsing — no gameplay to interrupt.

### 2. Quiz results screen — below the share card
- **Route / file:** `/quiz/play` — `src/pages/QuizPage.tsx`, inside the `over` state (after the results `<div>` that holds the score, grid, and Copy share / Replay / ← Hub buttons)
- **UI moment:** the 10-question quiz is complete; user is idle reading their score/streak and sharing.
- **Format:** inline banner — `300×250` (or `320×50` mobile).
- **Priority:** 1
- **Why:** shown on *every* completed quiz — the highest-frequency genuine attention moment across all 6 games.

---

## Priority 2 — results screens for the other 5 games (same pattern)

### 3. ORDERLE results / reveal panel
- **Route / file:** `/orderle/play` — `src/pages/OrderlePage.tsx`, below the `state.over` reveal panel (after the "Copy share" / "Play again (practice)" buttons)
- **UI moment:** puzzle solved (or answer revealed); user lingers on the rule/reveal and shares.
- **Format:** inline banner (`300×250` / `320×50`).
- **Priority:** 2
- **Why:** completed task = the same results-screen attention moment as Quiz, per-game.

### 4. FERMI results / answer reveal
- **Route / file:** `/fermi/play` — `src/pages/FermiPage.tsx`, below the game-over/reveal block (after the share button)
- **UI moment:** the daily number is revealed; user reads the explanation.
- **Format:** inline banner.
- **Priority:** 2
- **Why:** reveal is a natural pause after the core guess loop.

### 5. Clear the String results (LetterMix)
- **Route / file:** `/lettermix/play` — `src/pages/LetterMixPage.tsx`, below the completion/cleared-string result block (after the share button)
- **UI moment:** string fully cleared / solution shown.
- **Format:** inline banner.
- **Priority:** 2
- **Why:** completion moment, off the playing board.

### 6. Change by One results
- **Route / file:** `/changebyone/play` — `src/pages/ChangeByOnePage.tsx`, below the solved/lost result block (after share)
- **UI moment:** ladder solved or reveal shown.
- **Format:** inline banner.
- **Priority:** 2
- **Why:** same results-screen logic; no board interference.

### 7. Word Pool results
- **Route / file:** `/wordpool/play` — `src/pages/WordPoolPage.tsx`, below the round/level completion block (after share)
- **UI moment:** category cleared / round complete.
- **Format:** inline banner.
- **Priority:** 2
- **Why:** completion moment, off the entry area.

---

## Priority 3 — safe filler (low traffic, low risk, add later)

### 8. Quiz home — below the daily quiz card
- **Route / file:** `/quiz` — `src/pages/QuizHome.tsx`, below the "Daily quiz" card, above the nav menu (How to play / About)
- **UI moment:** user is deciding to start the quiz.
- **Format:** inline banner (`320×50`).
- **Priority:** 3
- **Why:** pre-game browse; harmless, but lower value and must not sit near the Play button.

### 9. Each game home — below the daily card
- **Route / file:** `/lettermix`, `/changebyone`, `/wordpool`, `/orderle`, `/fermi` (index) — `src/pages/*Home.tsx`, below the daily-card/hero block
- **UI moment:** user about to click Play.
- **Format:** inline banner.
- **Priority:** 3
- **Why:** safe filler, but keep it well clear of the Play CTA.

### 10. Calendar / About / Previous-games pages
- **Route / file:** `/*/calendar`, `/*/about`, `/wordpool/previous` — the corresponding `*Calendar.tsx` / `*About.tsx` / `WordPoolPreviousGames.tsx` pages, at the bottom of the content
- **UI moment:** user browsing history / reading rules.
- **Format:** inline banner.
- **Priority:** 3
- **Why:** lowest-traffic pages; add only after priorities 1–2 are proven.

---

## Explicitly do NOT place ads here

- ❌ Any playing board, question card, tile row, input field, or on-screen keyboard (LetterMix/WordPool entry, ORDERLE tiles, Quiz options) — these are the core loop.
- ❌ Between the Play button and the board (no interstitial before first-load gameplay).
- ❌ Popunder / "OnClick" / auto interstitials — Monetag will offer them; decline. They pay more but destroy daily-habit retention.
- ❌ Rewarded ads on the web build — `src/utils/ads.ts` stays a no-op on web (rewarded is a Telegram-Mini-App engagement mechanic, not a web display play).
- ❌ More than one banner per screen.
