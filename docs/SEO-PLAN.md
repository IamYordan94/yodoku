# Yodoku — SEO Plan

> Grounded in the actual `YODOKUAPP/` repo (React 19 + TypeScript + Vite 7 + React Router 7 `BrowserRouter`, client-rendered SPA on Vercel). No hype, no invented numbers. Every item here is implementable by one developer and points at a real file.
>
> Companion docs this aligns with: `docs/MARKETING-ADS-PLAN.md` (traffic engine + ads) and `docs/AD-PLACEMENTS.md`. SEO is the long-horizon half of the traffic engine in that plan.

---

## 0. What the repo actually looks like (facts, checked on 2026-08-22)

- **Client-rendered SPA.** One `index.html` is served for every route (`vercel.json` rewrites `/(.*)` → `/index.html`, and `public/_redirects` does the same — the two are redundant; keep `vercel.json`, drop `_redirects` to avoid confusion).
- **Canonical host is `www.yodoku.app`.** `https://yodoku.app/` returns **307 → `https://www.yodoku.app/`**. **But `public/sitemap.xml` lists non-www `https://yodoku.app/…` URLs** — a real mismatch that should be fixed (see §5).
- **`index.html` already has:** `lang="en"`, `<title>`, meta description, Open Graph + Twitter cards, Pinterest verification, `theme-color`, `manifest.json`, favicon, Google Fonts with preconnect, and a service-worker registration.
- **`index.html` is missing:** `rel=canonical`, any JSON-LD, per-route title/meta (there is no head manager anywhere — no react-helmet, no custom hook), and a proper 1200×630 social share image (it points the OG image at the square 1024×1024 logo).
- **`public/sitemap.xml`** lists **8 URLs** — home + 6 game homes + `/quiz/play`. Missing every `/about`, `/calendar`, `/play`, `/previous`, and `/settings` route. `lastmod` is hardcoded.
- **`public/manifest.json` is stale:** it still says **"Five daily word and logic puzzles — free, no ads, no tracking"** (it's six games now, and ads are being added per the marketing plan), and it points both the 192 and 512 icon entries at the same 1024×1024 PNG.
- **`public/robots.txt`** is fine (allows everything, points at the sitemap).
- **Analytics:** Vercel Analytics only. No Google Analytics, no Search Console / Bing Webmaster (to be confirmed by the owner).
- **Content that already exists and is genuinely good:** each game has an About page with real copy ("What is it", "How to play", rules, ORDERLE even has a "Weekly Rotation" section). This is the seed content the plan builds on — it is thin, not absent.

---

## 1. Honest expectations: a new SPA vs. NYT Games / Wordle

### The reality, stated plainly

A brand-new domain in the daily-games space is **not going to outrank the New York Times Games, Wordle, Merriam-Webster, or the big Wordle-clone aggregators for head terms like "word games" or "daily word games" — this decade, realistically.** Those sites have ~20 years of domain authority, millions of backlinks, and enormous engagement signals. SEO is not a channel that closes that gap; it's a channel that works *around* it.

What SEO *can* realistically do for Yodoku:

1. **Own its own brand queries.** Nobody else ranks for "ORDERLE", "FERMI game", "Clear the String game", "Change by One word game", or "Yodoku". These are zero-competition queries that you will rank #1 for within days of being indexed — *if* the pages carry the name in the title, H1, URL, and JSON-LD. This is the fastest, most certain SEO win on the table and it's why per-route titles matter.
2. **Win low-competition long-tail mechanics queries.** "sequence puzzle daily", "word ladder daily game", "estimation game", "how to play [game]" — these are low-volume (tens–hundreds of searches a month each) but winnable in months, not years.
3. **Compete for mid-tail on content pages**, not on the home page. "games like wordle", "daily quiz", "word puzzle of the day" are competitive but a genuinely good content page can land page 2–3 in 6 months and creep up.
4. **Feed the real growth loop.** SEO's biggest hidden value here is that ranking for branded queries and "today's [game] answer/hints" turns the share-grid loop (already built into every game's share text) into *organic, repeatable, daily* visits.

### Realistic timeline (assuming this plan is executed)

| Phase | Timeframe | What actually happens |
|---|---|---|
| **Indexing** | Days 0–30 | Site is indexed. Brand queries ("orderle", "yodoku hub") start showing up. Near-zero clicks — maybe single digits/day. This is normal; it is not a failure signal. |
| **Brand wins** | Month 1–3 | #1 for all six game names + "how to play [game]" long-tails. A few hundred visits/month total. |
| **Mid-tail creep** | Months 3–6 | Content pages for "games like wordle", "daily quiz", "word puzzle of the day" enter page 3–10 and slowly climb. Maybe 500–2,000 visits/month *if* content + a handful of real links happen. |
| **Compounding** | Months 6–12 | 2,000–10,000 visits/month is achievable **only** if the content pass (§4) and link-building (§6) actually ship. Not guaranteed. |
| **Real scale** | Year 1–2+ | 10k+ organic visits/month is possible but depends on winning a competitive cluster (e.g. becoming a go-to "Wordle alternatives" page) and on the share/video loop from the marketing plan driving branded search volume up. |

**Bottom line:** set the KPI for month 1 to "indexed + branded queries rank + Search Console collecting data," not "traffic." SEO here is a 6–24 month flywheel. The share-grid loop (marketing plan §3.2) and short-video are the *fast* channels; SEO is the *durable* one that catches people who search for the game later.

---

## 2. Per-route title / meta strategy + exact implementation

### Recommendation: a tiny `usePageMeta` hook (no dependency)

**Do not add `react-helmet` (or `react-helmet-async`).** It's an extra dependency, heavier than needed, and its ecosystem is half-deprecated. A ~40-line custom hook using `useEffect` does everything this site needs: set `document.title`, upsert the description/OG/Twitter meta tags, set `rel=canonical`, and optionally set `noindex`. React 19 + React Router 7 make this trivial.

**Why this is good enough:** Google renders and executes JavaScript, so titles/descriptions/canonicals set in `useEffect` **are** read by Google. This is the standard, accepted approach for client-rendered SPAs.

**The honest caveat (know it, don't fear it):** Bing and social *link unfurlers* (WhatsApp, Telegram, Discord, iMessage, X cards, Facebook) do **not** reliably execute JS — they read the static HTML. So:
- Google ranking metadata → the hook works fine. ✅
- Rich link previews for *deep links* (e.g. someone pastes `yodoku.app/orderle` into WhatsApp) → will fall back to the static `index.html` OG tags unless we pre-render. ⚠️

This is a **social-preview concern, not a ranking concern.** It matters because the share-grid loop pastes URLs into chat apps constantly. Mitigation (do later, not now): add a static default OG image that is good enough for any route (a single 1200×630 hub card), and optionally pre-render the 6 game landing pages in phase 2 (see §7).

### Step 1 — create `src/hooks/usePageMeta.ts`

```tsx
import { useEffect } from 'react';

export type PageMeta = {
  title: string;
  description: string;
  /** Canonical path, e.g. '/orderle/about' */
  path: string;
  ogImage?: string;
  noIndex?: boolean;
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function usePageMeta({ title, description, path, ogImage, noIndex }: PageMeta) {
  useEffect(() => {
    document.title = title;

    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', `https://www.yodoku.app${path}`);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    if (ogImage) {
      upsertMeta('property', 'og:image', ogImage);
      upsertMeta('name', 'twitter:image', ogImage);
    }

    // Canonical
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = `https://www.yodoku.app${path}`;

    // Robots (default index; pass noIndex for utility/param pages)
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
  }, [title, description, path, ogImage, noIndex]);
}
```

### Step 2 — use it at the top of each page component

```tsx
// src/pages/OrderleAbout.tsx  (top of the component body)
import { usePageMeta } from '../hooks/usePageMeta';

export default function OrderleAbout() {
  usePageMeta({
    title: 'ORDERLE — Daily Sequence Puzzle | Yodoku',
    description:
      'How to play ORDERLE, the free daily sequence-deduction game. Tap two tiles to swap, ' +
      'read the cited reveal that explains why the order matters. New puzzle every day.',
    path: '/orderle/about',
  });
  // ... rest of the component unchanged
}
```

Every page — all 6 game homes, every `/about`, `/calendar`, `/play`, `/previous`, the Hub, `/privacy`, `/terms`, `/quiz/about` — gets one `usePageMeta` call. It's one line each.

### Step 3 — the title/description table to implement

Formula for every page: **`[Game] — [what it is] | Yodoku`**, ≤ 60 chars for the title, ≤ 155 for the description, unique per route, with the game name first (it's the brand query).

| Route | Title | Meta description (target terms in **bold**) |
|---|---|---|
| `/` | Yodoku — 6 Free Daily Word Games | Play **6 free daily word games**: **word puzzles**, **sequence**, **word ladders**, **trivia** and more. New puzzles every day. |
| `/lettermix` | Clear the String — Daily Word Puzzle | Yodoku | A **daily word puzzle**: find the hidden words in a scrambled string and clear every letter. Free, new each day. |
| `/lettermix/about` | How to Play Clear the String | Yodoku | **How to play Clear the String** — rules, tips and strategy for the daily scrambled-string **word game**. |
| `/changebyone` | Change by One — Daily Word Ladder Game | Yodoku | A **daily word ladder game**: change one word into another, one letter at a time. Free **word ladder** puzzle every day. |
| `/changebyone/about` | How to Play Change by One (Word Ladder) | Yodoku | **How to play Change by One**, the daily **word ladder** game. Rules, examples and tips. |
| `/wordpool` | Word Pool — Daily Category Word Game | Yodoku | **Name every word in the category** in this free **daily category word game**. New constraints every day. |
| `/wordpool/about` | How to Play Word Pool | Yodoku | **How to play Word Pool** — the daily **category vocabulary game**. Rules, levels and tips. |
| `/orderle` | ORDERLE — Daily Sequence Puzzle | Yodoku | A **daily sequence puzzle**: arrange six items in the right order, then read why. Free **ordering puzzle game**. |
| `/orderle/about` | How to Play ORDERLE (Daily Sequence Puzzle) | Yodoku | **How to play ORDERLE**, the daily **sequence puzzle** with a cited reveal. Rules, swap mechanic and strategy. |
| `/fermi` | FERMI — Daily Estimation Game | Yodoku | A **daily estimation game**: guess the real-world number and calibrate your intuition. Free **number guessing game**. |
| `/fermi/about` | How to Play FERMI (Estimation Game) | Yodoku | **How to play FERMI**, the daily **estimation / quantity guessing game**. Rules and tips. |
| `/quiz` | Quiz Master — Daily Quiz | Daily Trivia | Yodoku | A free **daily quiz**: 10 questions across 7 categories. Play the **daily trivia quiz** and share your score. |
| `/quiz/play` | Daily Quiz — Play Today's Questions | Yodoku | Play **today's daily quiz** — 10 trivia questions across 7 categories. New questions every day. |
| `/quiz/about` | How Quiz Master Works (Daily Trivia) | Yodoku | **How the daily trivia quiz works** — scoring, categories, streaks and the daily question set. |
| `/coming-soon` | Coming Soon | Yodoku | *(noindex — utility page, see §5)* |
| `/privacy` | Privacy Policy | Yodoku | Privacy policy for Yodoku. |
| `/terms` | Terms of Service | Yodoku | Terms of service for Yodoku. |

**`noIndex: true` should be set on:** `/coming-soon`, `/privacy`, `/terms`, `/wordpool/settings`, and any calendar/play param page you don't want indexed (see §5 for the full list). These are utility pages that dilute crawl budget and send weak signals.

---

## 3. JSON-LD structured data (WebSite + VideoGame)

### 3.1 Paste-ready WebSite block → goes in `index.html` `<head>`

This is static and belongs directly in `index.html` (it's about the whole site). Replace the `og:image` width/height with the real values (the logo is 1024×1024 today).

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.yodoku.app/#org",
      "name": "Yodoku",
      "url": "https://www.yodoku.app/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.yodoku.app/images/yodoku-logo.png",
        "width": 1024,
        "height": 1024
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://www.yodoku.app/#website",
      "url": "https://www.yodoku.app/",
      "name": "Yodoku",
      "description": "Six free daily word, logic and trivia games — Clear the String, Change by One, Word Pool, ORDERLE, FERMI and Quiz Master. New puzzles every day.",
      "inLanguage": "en",
      "publisher": { "@id": "https://www.yodoku.app/#org" }
    }
  ]
}
</script>
```

> Note: no `WebSite` → `SearchAction` (sitelinks searchbox) — the site has no search. Don't declare a search action you don't have; Google may drop the whole block.

### 3.2 Per-game VideoGame block → injected by the hook

Google does **not** currently show a rich-result carousel for `VideoGame` — be honest that this is about **entity clarity** (helping Google understand each route is a distinct game, and disambiguating "ORDERLE" the brand from "Wordle"), not about a visible SERP star. It's cheap and correct, so do it.

Extend the hook with an optional `jsonLd` field and an `injectJsonLd` helper:

```tsx
// add to usePageMeta.ts
export function injectJsonLd(id: string, obj: Record<string, unknown>) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.textContent = JSON.stringify(obj);
  document.head.appendChild(script);
}
```

Then in the hook's `useEffect`, accept `jsonLd?: Record<string, unknown>` and call `injectJsonLd('page-jsonld', jsonLd)` when present (and remove it when absent). Concrete ORDERLE example:

```tsx
usePageMeta({
  title: 'ORDERLE — Daily Sequence Puzzle | Yodoku',
  description: 'A daily sequence puzzle: arrange six items in the right order, then read why. Free ordering puzzle game.',
  path: '/orderle',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    '@id': 'https://www.yodoku.app/orderle#game',
    'name': 'ORDERLE — Daily Sequence Puzzle',
    'url': 'https://www.yodoku.app/orderle',
    'description': 'A free daily sequence-deduction game. Arrange six items in the correct order one swap at a time, then read a cited explanation of why the order matters.',
    'applicationCategory': 'GameApplication',
    'operatingSystem': 'Web',
    'inLanguage': 'en',
    'genre': ['Puzzle game', 'Word game', 'Daily game'],
    'gamePlatform': ['Web browser', 'Android', 'iOS'],
    'playMode': 'SinglePlayer',
    'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
    'publisher': { '@id': 'https://www.yodoku.app/#org' }
  },
});
```

Same shape for the other five games (swap `name`/`url`/`@id`/`description`/`genre`). This gives six clean `VideoGame` entities all linked to one `Organization`.

---

## 4. Keyword / content strategy — 10 concrete pages

Scale: **Easy** = rank in weeks, **Medium** = rank in months, **Hard** = rank in 6+ months or realistically never for #1. Volume estimates are honest *ballparks* for the English web — treat as order-of-magnitude.

| # | Page / content | Route | Primary keyword | Secondary keywords | Difficulty | Why / what to write |
|---|---|---|---|---|---|---|
| 1 | **ORDERLE about/how-to page (expand what's there)** | `/orderle/about` | "orderle" / "how to play orderle" | "daily sequence puzzle", "ordering puzzle game" | **Easy** | Already has good copy. Add 150–250 words of strategy ("read the middle tiles first…"), an example puzzle, and FAQ. Owns the brand query outright. |
| 2 | **Per-game "How to play" pages ×6** | `/…/about` | "how to play [each game]" | "[game] rules", "[game] tips" | **Easy** | The single cheapest win. Every game name is an unowned query; "how to play X" long-tails convert to players. One short strategy + example paragraph each. |
| 3 | **"Daily quiz" landing (Quiz Master hub)** | `/quiz` | "daily quiz" | "daily trivia quiz", "quiz of the day" | **Hard** | Competitive head term (Britannica, Sporcle, Trivia apps). Rankable long-tail is "daily trivia quiz with answers" / "10 question daily quiz". Write an intro paragraph + FAQ on the `/quiz` home. Expect page 2–3, not #1. |
| 4 | **"Word puzzle of the day" hub page** | `/` (home intro) or a `/daily-word-games` page | "word puzzle of the day" | "daily word games", "free daily word puzzles" | **Hard** | Head term dominated by NYT/Wordle clones. Win by *category listing* angle: "6 free daily word games, no download". 150+ word intro on the Hub + internal links to all six games. Long-horizon. |
| 5 | **"Games like Wordle" / "Wordle alternatives" listicle** | `/wordle-alternatives` (new page) | "games like wordle" | "wordle alternatives 2026", "word games like wordle" | **Hard** | Genuinely high-value, high-competition listicle. You can honestly list your 5 word games + ORDERLE/FERMI. Needs a real, useful list (include non-you games for credibility). This is the page that, if it ever wins, becomes a top-3 traffic source. Months of patience. |
| 6 | **"Today's [game] hints" (hint-only, no spoiler)** | `/orderle/hints` (later) | "orderle answer today", "orderle hints" | "[game] hint today" | **Easy (brand) / strategic risk** | The marketing plan flags spoiler pages as risky. Compromise: a **hints** page (first letter / category / a nudge), never the raw answer. Brand queries are yours to lose; do this *after* the daily audience exists. |
| 7 | **"Daily trivia questions" archive / explainer** | `/quiz/trivia-questions` (later) | "daily trivia questions" | "trivia questions and answers" | **Medium** | Huge query, medium competition. A page of *sample* categories + "how our daily quiz works" (not the live answers) captures search intent without giving away the daily set. |
| 8 | **"Word ladder" explainer (Change by One)** | `/changebyone/about` (expand) | "word ladder game online" | "word ladder daily", "word ladder solver" | **Medium** | "word ladder" is a known puzzle term with steady search. Expand the about page into a short explainer (what a word ladder is, an example, how the daily one works). Captures both players and solvers. |
| 9 | **"Estimation / number guessing" explainer (FERMI)** | `/fermi/about` (expand) | "estimation game" | "guess the number game", "order of magnitude game" | **Medium** | Low competition, steady niche interest (Fermi problems). Explain what an estimation/quantity game is + how the daily one works. FERMI is also the most distinct game — lean into "calibrate your intuition." |
| 10 | **"Daily brain games" roundup** | `/daily-brain-games` (new) | "daily brain games" | "brain games daily", "daily logic puzzles" | **Medium/Hard** | Broader than word games; lets you rank for the "daily brain training" audience that word-only pages miss. List all 6 games grouped by type (word / logic / trivia). |

**Honest note on volume:** ideas #1–2 win fast but are low-volume (the whole point is they're *uncontested*). Ideas #3–5, #7, #10 are where real volume lives but they are real fights. The realistic sequencing: ship #1–#2 and #4's home intro in the first 30 days (fast, certain wins), then layer #8–#10 in days 31–60, and treat #5 as the one "moonshot" content page you invest in over months.

---

## 5. Technical SEO checklist — this codebase specifically

### Already done ✅ (verified in the repo)

- `lang="en"` on `<html>`.
- Home-page `<title>` + meta description (unique, on-brand).
- Open Graph + Twitter cards (home page only).
- `theme-color`, favicon, `manifest.json`, service worker.
- `robots.txt` allows all + points to the sitemap.
- `sitemap.xml` exists (but see fixes below).
- SPA fallback works on Vercel (`vercel.json` rewrites + `_redirects`).
- HTTPS, and `yodoku.app` 307s → `www.yodoku.app` (single canonical host, good).

### Missing / broken ❌ (fix in order)

1. **No `rel=canonical` in `index.html`.** Add `<link rel="canonical" href="https://www.yodoku.app/" />` now, and per-route canonicals via the hook (§2). All canonicals use `www`.
2. **Sitemap uses non-www URLs.** The site canonical is `www.yodoku.app`; the sitemap lists `https://yodoku.app/…`. Fix every `<loc>` to `https://www.yodoku.app/…` and regenerate. A sitemap pointing at URLs that 307 is a sloppy signal.
3. **Sitemap is missing most routes.** Add all indexable routes: the 6 `/about` pages, the `/calendar` pages, `/quiz/about`, `/wordpool/previous`, `/quiz/play`, `/coming-soon` (or mark noindex and drop it). Regenerate `lastmod` instead of the hardcoded date. Either hand-maintain or generate with a tiny script (a 20-line Node script reading the routes from `App.tsx` beats editing XML by hand).
4. **No JSON-LD anywhere.** Add §3.1 to `index.html`, §3.2 per game.
5. **No per-route titles/meta.** Add the `usePageMeta` hook (§2). This is the single highest-impact item on this list.
6. **Stale `manifest.json`.** Update to "Six daily word, logic and trivia games" and remove "no ads" (ads are being added). Provide real 192×192 and 512×512 icons (resize the existing PNG once; don't reference a 1024px file at both sizes).
7. **Duplicate/param routes are indexable.** `/wordpool/:date`, `/wordpool/category/:categoryId`, `/lettermix/play/:date/:level`, `/changebyone/play/:date` are all renderable as URLs but are the *same* game with different data — classic duplicate-content surface. Set `noIndex: true` on these param pages (via the hook) and/or canonicalize them to the game home. Same for `/wordpool/settings`, `/coming-soon`, `/privacy`, `/terms`.
8. **OG image is a square logo, not 1200×630.** Generate one 1200×630 hub share card (`public/images/og-default.png`) and point `og:image`/`twitter:image` at it (both in `index.html` and the hook default). This is a *social* win, not a ranking win, but the share loop makes it worth it.
9. **`_redirects` and `vercel.json` both do the SPA rewrite.** Delete `public/_redirects`; keep `vercel.json` (single source of truth).
10. **No Search Console / Bing Webmaster.** Not a code fix, but the highest-leverage "technical" step: submit `https://www.yodoku.app/sitemap.xml` to Google Search Console and Bing Webmaster Tools. This is the only way to see real impressions/queries and confirm indexing.
11. **Lighthouse basics to verify after the above:** single H1 per page (Hub uses one; game pages use `<h2>` for the game label inside `<h1>` contexts — check each game page has exactly one H1), no missing `alt` on the logo images, fonts are `display=swap` (they are), and no console errors from the head hook.

---

## 6. Link building — real, manual, no shortcuts

Rules that govern this whole section: **no PBNs, no buying links, no link exchanges with spam farms.** Everything here is manual, slow, and legitimate. The goal in the first 90 days is a *small number of real, relevant, editorial-style* links — 10–30 is a great year-one outcome, and even 5 good ones move a new domain.

1. **Claim brand profiles and link back.** Reddit (`r/wordgames`, `r/puzzles`, `r/dailygames`, `r/trivia` — read each sub's self-promo rule first), X/Twitter bio, Discord (puzzle/word-game servers with a daily-score channel), Facebook word-game/trivia groups, Pinterest (verification already in `index.html`), GitHub (the repo `IamYordan94/yodoku` exists — make sure it has a README linking to the live site). These are mostly `nofollow` but they establish the entity and drive real traffic.
2. **Directory / listing submissions (the ones that are actually indexed and free).** AlternativeTo (list as a Wordle/Wordle alternative), Product Hunt (a "Yodoku — 6 daily puzzle games" launch), Slant, IndieGame directories, and web-app catalogs like Toolify. These are editorial and durable. Do them once, honestly, with real screenshots.
3. **"Games like Wordle" roundup outreach.** Many blogs maintain "best word games" / "Wordle alternatives" lists. Email the author a 3-sentence pitch: *what Yodoku is, one distinctive angle (six games in one place; ORDERLE's cited "why the order matters" reveal; FERMI's calibration angle), and a working link.* Expect a <5% reply rate; 20 emails → 1 link is a win.
4. **Answer real questions where you're relevant.** r/puzzles "recommend a daily word game" threads, Quora "best free word games", Reddit "what do you play besides Wordle" — answer genuinely and include the link only where it's on-topic. Never drop bare links; always add value first.
5. **Small press / newsletters.** Puzzle and indie-game newsletters (there are several covering "daily games") and local/small tech blogs are reachable with a one-page "about the game" note. Lower effort, occasionally a real dofollow link.
6. **The share-grid loop feeds branded search, which feeds links.** Every share (marketing plan §3.2) puts `yodoku.app` in front of people; some will search "orderle" or "yodoku hub" and some will link it. This is why §2's branded-title work matters — it converts the loop into links.
7. **Free tools / utility pages (long-term).** A genuinely useful "word ladder solver" or "today's [game] hints" page (idea #6/#8) is the kind of thing other sites link to naturally. This is the only "link magnet" in the plan and it's worth building eventually.

**What we explicitly do NOT do:** buy links, join PBNs, private blog networks, spam blog comments, forum signature spam, mass directory blasts, or automated outreach. Those either don't work in 2026 or actively risk a manual penalty on a domain that can't afford one.

---

## 7. 30 / 60 / 90 checklist

### Days 0–30 — Ship the technical foundation (the "get indexed correctly" sprint)

- [ ] Add `rel=canonical` to `index.html` (www host).
- [ ] Create `src/hooks/usePageMeta.ts` and wire it into **every** page (Hub + all game homes/abouts/play/calendar/quiz). Use the title/description table in §2.
- [ ] Add the WebSite JSON-LD block (§3.1) to `index.html`; add per-game VideoGame JSON-LD (§3.2) to the six game homes.
- [ ] Add `noIndex: true` to `/coming-soon`, `/privacy`, `/terms`, `/wordpool/settings`, and the param/date routes.
- [ ] Fix `sitemap.xml`: switch to `www`, add all indexable routes, regenerate `lastmod`. Add a tiny generation script so it's not hand-edited.
- [ ] Fix `manifest.json` (six games, no "no ads", real 192/512 icons). Delete `public/_redirects`.
- [ ] Create a 1200×630 default OG image and point `og:image`/`twitter:image` at it.
- [ ] **Submit the sitemap to Google Search Console + Bing Webmaster Tools** (needs owner's account; the single most important "do this week" item).
- [ ] Add the home-page intro paragraph (150+ words, list the 6 games) — content for idea #4.
- [ ] Verify: run `npm run build`, deploy, then check 3 routes with a curl + `rich results test` / `validator.schema.org` on the JSON-LD.
- **Exit check:** Search Console is collecting data; every route returns a unique `<title>` and canonical; JSON-LD validates; brand queries ("orderle") resolve to the right page.

### Days 31–60 — Content pass (the "win the long-tail" sprint)

- [ ] Expand the 6 `/about` pages with strategy, an example, and FAQ paragraphs (ideas #1, #2, #8, #9).
- [ ] Write the "Games like Wordle / Wordle alternatives" listicle page (`/wordle-alternatives`) — the one moonshot content asset (idea #5).
- [ ] Write the "Daily brain games" roundup (`/daily-brain-games`, idea #10).
- [ ] Add the intro/FAQ to the `/quiz` landing (idea #3).
- [ ] Start the manual link work from §6: claim the 5–6 brand profiles, submit to 3–4 directories, and send the first 10–20 roundup-outreach emails.
- [ ] Check Search Console for the first real query data; adjust titles on any page that's indexing but not earning impressions.
- **Exit check:** 10 content pages live with unique titles/meta; 3+ real profiles/directories linking; first "how to play X" impressions appearing in Search Console.

### Days 61–90 — Double down on what the data says

- [ ] Read Search Console: find which 3–5 queries actually send impressions/clicks and expand the winning pages (more depth, FAQ, internal links from the Hub).
- [ ] Fix any page Google flags (crawl errors, "Duplicate, Google chose different canonical", soft-404s from the param routes).
- [ ] Build the "Today's [game] hints" page (idea #6) for the best-performing game *only* — hint-only, no spoilers.
- [ ] Decide on pre-rendering: if social unfurls matter (they will, given the share loop), add a static pre-render for the 6 game landing pages (e.g. `vite-plugin-prerender` or Vercel's static output) so WhatsApp/Discord/Twitter show per-game titles. One day of work, worth it now that traffic is real.
- [ ] Continue the manual link/outreach cadence (a few emails a week); it compounds.
- [ ] Re-assess against the §1 timeline — is the site tracking toward "brand queries ranked + mid-tail creeping"? Adjust targets, don't panic.
- **Exit check:** documented top queries; every indexable route has unique title/meta/canonical; ≥5 real referring domains; a go/no-go on the spoiler-hint experiment and pre-render.

---

### Quick reference — the 5 files this plan touches

| File | Change |
|---|---|
| `index.html` | canonical, WebSite JSON-LD, 1200×630 OG image, (keep static title/meta) |
| `src/hooks/usePageMeta.ts` | **new** — the head manager (title/meta/canonical/robots + JSON-LD injection) |
| `src/pages/*.tsx` | one `usePageMeta(...)` call per page |
| `public/sitemap.xml` | www host, all routes, dynamic `lastmod` (add a generator script) |
| `public/manifest.json` | correct count/copy, real icon sizes |

*End of SEO plan. Pairs with `MARKETING-ADS-PLAN.md` (fast growth channels) and `AD-PLACEMENTS.md` (where the ads go once the traffic arrives).*
