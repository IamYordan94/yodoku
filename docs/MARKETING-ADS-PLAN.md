# Yodoku — Marketing & Ads Plan

> Grounded in the actual codebase at `YODOKUAPP/` (React 19 + TS + Vite, "Sticker Pack" neo-brutalist design). No hype, no invented numbers. Everything here is implementable by one developer.

---

## 0. Where we actually are (facts from the repo)

- **6 games, live routes:** Clear the String (`/lettermix`), Change by One (`/changebyone`), Word Pool (`/wordpool`), ORDERLE (`/orderle`), FERMI (`/fermi`), Quiz Master (`/quiz`, plays at `/quiz/play`).
- **Zero ads today.** `src/utils/ads.ts` contains only stubs — `shouldShowAdForHint()` returns `false`, `showRewardedAd()` is a no-op. There is no ad SDK loaded anywhere (`index.html` has no ad script).
- **The share loop already exists** — it's the single most valuable marketing asset we have. Quiz (`shareQuizText` in `src/utils/quizLogic.ts`), ORDERLE (`shareOrderleText`), and the other games already generate share grids with the `yodoku.app/...` URL baked in.
- **Streaks exist** for Quiz (`src/utils/quizStorage.ts` — `getStreak`/`bumpStreak`), which is the retention hook the whole traffic engine leans on.
- **SEO basics are partly done:** `public/robots.txt` and `public/sitemap.xml` exist; `index.html` has a title, meta description, Open Graph + Twitter cards, and Pinterest verification. **But** the site is a client-rendered SPA — every route serves the *same* `index.html`, so there is no per-game title/description/JSON-LD, and the sitemap lists only 8 URLs (missing every `/about`, `/calendar`, `/play`, and `/previous` page).
- **Analytics is Vercel Analytics only** (`@vercel/analytics`). No Search Console / Google Analytics.
- **Business:** owner has a **Monetag publisher account** (fresh — $0 balance, no websites registered yet). AdSense is a future option, not yet applied for.

The conclusion that drives this whole plan: **traffic is the real problem, not monetization.** A display ad on a site with 1,000 monthly visitors earns single-digit dollars a month. We should spend ~80% of effort on traffic and ~20% on ads, and we should ship ads *cheaply and correctly* so they don't kill the product that grows the traffic.

---

## 1. Ad network sequencing: Monetag display now, AdSense later

### Monetag first — the honest trade-offs

**Why start here:** the account already exists, approval is essentially instant, there are no traffic minimums, and the minimum payout is low ($5 via PayPal). We can have real ads live this week with almost no friction.

**The honest downsides of Monetag display:**
- **Lower CPMs.** Monetag's web *display* ads pay meaningfully less than AdSense, especially for tier-2/3 geo traffic. Expect roughly $0.50–$2 RPM (revenue per 1,000 pageviews) on a good day, less on bad days.
- **Lower ad quality.** Monetag's fill tends toward the lower-quality end of programmatic. On a premium-looking neo-brutalist design, a spammy "YOU WON A PHONE" banner is off-brand and can cheapen the whole product.
- **Format trap.** Monetag pushes "OnClick" (popunder) and interstitial formats hard. Those pay better but are exactly the formats that hurt retention on a daily-game site. **We will not use them.** Display banners only.
- **Relevance is weak.** No strong contextual targeting like AdSense, so ads will often be irrelevant to puzzle players.

**What to actually do with Monetag now:**
1. Register `yodoku.app` as a **website** in the Monetag dashboard.
2. Create a **Display Ads** zone (banner). Skip OnClick/popunder and interstitials.
3. Put the loader script once in `index.html`, and a zone `<div>` at each placement in `AD-PLACEMENTS.md`.
4. Watch the Statistics tab for a week or two to learn real RPM per placement before adding anything.

### AdSense later — the honest realities

**Why it's worth it:** better CPMs (a word-game site can realistically do $5–15 RPM tier-1 vs Monetag's ~$1–2), far better ad relevance, and higher ad quality that matches the product.

**The approval reality — be honest about it:**
- AdSense requires: a real domain (have it), a **privacy policy** (we already have `/privacy` and `/terms`), original content, and enough "substantive" content to satisfy a human reviewer.
- **The risk:** a 6-game SPA with thin text content and no article/landing pages can get rejected for "insufficient content" or "low value." This is the most likely outcome if we apply *today*.
- **The fix before applying:** add a real text page per game (an "About / How to play" page already exists for each game — we should expand it with genuine explanatory copy, rules, tips, and a strategy paragraph), plus a proper home page intro paragraph. This is content we need for SEO anyway (Section 3), so it pulls double duty.
- Approval takes days to weeks; expect one or two rejection/resubmission cycles. Budget for that emotionally and don't let it block the Monetag launch.

**Sequencing:**
1. **Week 1:** launch Monetag display (banner-only). Ship the placement component now so AdSense is a drop-in later.
2. **Weeks 2–4 (parallel):** write the per-game content pages, then apply for AdSense.
3. **If/when approved:** move the premium placements (Hub, results screens) to AdSense; keep Monetag as geo/backfill or drop it. (Running both is allowed, but two networks on one page can slightly depress each other's CPMs — don't stack them on the same slot.)

**Rule of thumb:** Monetag is the "get something live now" network. AdSense is the "get paid properly later" network. Neither one matters until there's traffic.

---

## 2. Ad placement philosophy (the non-negotiable rules)

Daily games live or die on the core loop: **open → read the puzzle → solve → see result → share.** An ad that touches the loop costs more in retention than it earns in CPM.

**Hard rules:**
1. **Never put an ad on the playing board.** No banner over/under the puzzle, the question card, the tiles, the input, or the on-screen keyboard. Ever.
2. **Never block first-load gameplay.** No interstitial before the puzzle renders, no "wait to play" countdown, no ad between the Play button and the board.
3. **Monetize the *attention moments*, not the loop.** The two moments where a daily-game player is genuinely idle and ad-tolerant are:
   - **The results / reveal screen** — the task is done, dopamine just spiked, the user lingers to read the result and share. This is the single best ad moment on the site and we already render it in every game.
   - **Hub browsing** — the user is choosing what to play, not playing yet.
4. **Banner/inline only, below the fold.** No popunders, no auto-playing interstitials, no sticky overlays. An inline banner under the results card is harmless; a popunder is a one-way ticket to a bounce.
5. **One placement per screen, max.** A daily-game page is short. Two ads on one screen feels like a billboard, not a game.

**Where the money actually is (per-pageview reasoning):** the results screen is *shown on every completed play* — it's the highest-frequency real moment across all 6 games. The Hub is the highest-traffic single page. Everything else (homes, about, calendar) is filler.

The full concrete list is in **`AD-PLACEMENTS.md`** — each entry with exact page/route, exact UI moment, format, and priority.

---

## 3. The traffic engine

### 3.1 SEO for daily puzzle sites

The honest constraint: a client-rendered SPA is invisible-ish to Google for anything except the home page. The cheap, high-impact fixes (in order):

1. **Per-route meta tags.** Right now every route shares one `index.html` title/description. Add a tiny per-route head manager (React Helmet, or a 20-line custom hook that sets `document.title` and the meta tags on route change) so `/orderle` says "ORDERLE — daily sequence puzzle" instead of the generic home title. This is the #1 SEO fix and it's small.
2. **Per-game JSON-LD structured data.** Add a `WebApplication`/`Game` schema block per game page. Helps Google understand what each route is.
3. **Real text on each game page.** The `/about` pages exist but are thin. Add a few genuine paragraphs: what the game is, the rules, tips/strategy, an example. This is the "substantive content" both Google *and* AdSense reviewers want.
4. **Expand the sitemap** to include every indexable route: all 6 `/about` pages, `/calendar` pages, `/quiz/play`, `/wordpool/previous`. (`sitemap.xml` currently lists 8 URLs.)
5. **Submit to Google Search Console + Bing Webmaster Tools.** Free, and it's the only way to see real impressions/queries. Do this in week 1.
6. **Answer/hint pages — the honest call.** "Today's ORDERLE answer" is a genuinely large search query, and a hint page (not a full spoiler) can capture it *without* wrecking the daily challenge. Trade-off: it risks leaking spoilers into search results and cheapening the "everyone plays the same puzzle" magic. Recommendation: **hold this** until there's real traffic; if we do it, publish a "hints" page (first letter, category, a nudge), not the raw answer.

Set expectations: SEO for a brand-new domain takes **months**, and daily-puzzle terms are competitive (Wordle and its clones dominate). SEO is a long-horizon flywheel, not a week-1 growth channel.

### 3.2 The share-grid viral loop (this is the growth engine)

The mechanism already ships in the code (`shareQuizText`, `shareOrderleText`, etc.). The loop is:

```
play daily puzzle → results screen → "Copy share" → paste into group chat / Twitter / Discord → friend clicks yodoku.app/... → plays → shares
```

The grid format (🟩🟩🟥🟩⬜ + score + URL) is *exactly* the Wordle mechanic that went viral, and it's already built. What's missing is friction removal and reminders:

1. **One-tap Web Share API.** "Copy share" requires a paste step. Add a second button using `navigator.share()` that opens the native share sheet on mobile (most of the audience is mobile). `shareQuizText` output is already a perfect `navigator.share({ text })` payload. One line of logic, meaningful uplift.
2. **Every share already includes the URL — keep it that way** and make sure it deep-links to the game, not just the home page.
3. **"Come back tomorrow" hook on the results screen.** The results screen currently has Replay + Hub. Add a small "new puzzle in 6h" line + (later) a reminder that the streak is at stake. Streaks are the retention mechanic; put them on the results screen where they already show the 🔥 count.
4. **A hub-level "did you play all 6?" nudge.** The share loop works per-game, but the hub has 6 daily games — the superfan plays all 6. A "3/6 done today" ticker on the Hub turns one daily habit into six.

### 3.3 Social short-video "daily challenge"

The product *is* the content: a 30–60s screen-record of solving today's puzzle, with a voiceover or on-screen text, is a finished video.

- **Format:** "Today's ORDERLE — can you beat 3 swaps?" → 30s solve → "Play it yourself at yodoku.app". Screen-record on phone, minimal editing, one per game rotated across days.
- **Platforms:** TikTok, YouTube Shorts, Instagram Reels. One video, cross-post all three.
- **Cadence:** daily is ideal but 3×/week is a realistic solo-developer pace. Pick the most visual game first — ORDERLE (swap/sequence reveal) and Quiz Master (trivia format) are the most watchable; FERMI (guess the number) makes a great "pause and guess" format.
- **Honest expectation:** short-video is a lottery. Most posts get nothing; a rare one compounds. It's worth doing because the marginal cost is ~10 minutes and the upside is the only thing that can move this site from 1k → 100k visitors.

### 3.4 Community posting

The share grid was designed for this. Post daily scores into communities where people already post Wordle grids:

- **Reddit:** r/wordgames, r/puzzles, r/trivia, r/dailygames, r/wordle (check each sub's self-promo rules — post the grid + a "play it here" comment, don't spam the link).
- **Twitter/X:** post your own daily grid with the URL; the format is native there.
- **Discord:** puzzle/word-game servers with a daily-score channel.
- **Facebook groups:** word-game and trivia groups.

Rules that keep you from getting banned: lead with the *grid/score* (that's the content), put the link in the body or a reply, don't post the same thing to 10 places in one day, and never automate it in a spammy way. This is slow, manual, and unglamorous — and it's the most reliable source of the first 1,000–10,000 players.

---

## 4. Realistic revenue expectations (honest, low)

Assumptions: ~3 pageviews per visit (hub → game → result), display banners only, no popunders. Ranges are *estimates*, and the low end is more likely than the high end at every tier.

| Monthly visitors | ~Pageviews | Monetag display (now) | AdSense display (if approved) |
|---|---|---|---|
| **1,000** | ~3,000 | **$2–6 / mo** | $10–30 / mo |
| **10,000** | ~30,000 | **$20–60 / mo** | $100–300 / mo |
| **100,000** | ~300,000 | **$200–600 / mo** | $1,000–3,000 / mo |

**Read this correctly:**
- At 1k and 10k monthly visitors, ads are **pocket change** — this is coffee money, not income. Don't optimize around it.
- Only at ~100k visitors does AdSense become a real side income ($1–3k/mo), and even then it's a nice-to-have, not a salary.
- The *variance* is huge — geo mix, seasonality, and ad relevance swing these by 3× in either direction. Treat all numbers as order-of-magnitude, not forecasts.
- **The higher-CPM path for this exact owner** is the Telegram Mini App with Monetag *rewarded* ads (rewarded popups quoted at $5–6 CPM, ~$2+ rewarded interstitials), which pays per *engagement* rather than per *impression*. That's a later, separate build — worth noting now because the owner already has the Monetag account, but it is not a substitute for the web plan here.

**Bottom line on money:** the plan is not "make money with ads at low traffic." The plan is "don't leave free ad money on the table while you build the audience that actually makes money."

---

## 5. 30 / 60 / 90-day action plan

### Days 0–30 — Ship ads cheaply + lay SEO foundation
- [ ] Register `yodoku.app` as a **website** in Monetag; create a Display Ads (banner) zone.
- [ ] Build one reusable `<AdSlot format="banner" />` component (wraps the Monetag zone `<div>`, lazy-loads below the fold). Wire it into the **2 priority-1 placements** only (Hub below grid; Quiz results below share card).
- [ ] Add the Monetag loader script to `index.html` **once** (defer/async, after render).
- [ ] Add per-route meta titles/descriptions (small head hook). Add per-game `WebApplication`/`Game` JSON-LD.
- [ ] Expand the sitemap to all indexable routes; submit to **Google Search Console** and **Bing Webmaster Tools**.
- [ ] Add a `navigator.share()` button next to every "Copy share" button.
- [ ] Pick ONE community (start with r/wordgames or one Discord) and post daily grids there, manually.
- **Exit check:** real Monetag revenue data exists; Search Console is collecting impressions; share button is live.

### Days 31–60 — Content pass + AdSense application
- [ ] Expand each game's `/about` page with genuine rules/tips/strategy copy (SEO + AdSense content requirement, double duty).
- [ ] Add a home-page intro paragraph (what the hub is, list the 6 games).
- [ ] **Apply for AdSense** (expect possible "insufficient content" rejection — resubmit after the content pass; it's a loop, not a failure).
- [ ] Roll out the **priority-2 placements** (results screens for the other 5 games) using the same `<AdSlot>` component.
- [ ] Start the **short-video** habit: 3 posts/week (ORDERLE + Quiz Master + FERMI rotate), cross-posted TikTok/Shorts/Reels.
- [ ] Add the "3/6 done today" ticker to the Hub.
- **Exit check:** AdSense applied (or an actionable rejection in hand); 5+ placements live; short-video cadence established.

### Days 61–90 — Double down on what the data says
- [ ] Read Search Console + Monetag stats: kill placements with bad RPM/CTR, keep the winners.
- [ ] If AdSense approved → move Hub + results screens to AdSense, keep Monetag as backfill. If not → iterate the content pages and resubmit.
- [ ] Pick the best-performing *game* (by play-through and share rate) and make it the lead of every social post and the home page hero.
- [ ] Add the "new puzzle in Xh" + streak reminder to every results screen (retention → more daily shares → more traffic).
- [ ] Decide on the Telegram Mini App (rewarded-ads) build — a real decision now that web traffic + ad data exist to judge against.
- **Exit check:** a documented read on which placements/games/channels actually move numbers, and a go/no-go on AdSense + TMA.

---

## 6. What we will NOT do (guardrails)

- ❌ No popunders, OnClick, or auto interstitials — even though Monetag pays more for them. They kill daily-habit retention.
- ❌ No ads on any playing board, question card, or keyboard.
- ❌ No "wait to play" ad gates or rewarded ads on the *web* game (rewarded is a TMA/engagement play, not a display play — and `showRewardedAd()` should stay a no-op on web).
- ❌ No buying traffic until organic numbers prove the loop works (per the Monetag account's own ban-list warning, keep all traffic clean).
- ❌ No spoiler/answer pages before the daily challenge has an established audience.

---

*Companion file: `AD-PLACEMENTS.md` — the exact placement list a developer implements from.*
