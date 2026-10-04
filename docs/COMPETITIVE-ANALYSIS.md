# Competitive Analysis + Monetization Plan

**Created:** October 2026
**For:** Yodoku (yodoku.app) — 7 daily games, currently free, ad-supported (Monetag in-page push only)
**Companion docs:** `DISTRIBUTION-PLAN.md`, `MARKETING-ADS-PLAN.md`

---

## 1. The case study: GeoSports (geosports.app)

**What it is:** A daily sports-geography game. Five questions per day ("tap where it happened on the globe"), 60–90 seconds to play, score shared as a little emoji grid. Web + iOS app + Android.

**Who built it:** Frank Michael Smith — a sports content creator with 3.5M+ followers (1.8M TikTok, 1.4M YouTube), founder of Rhino Studios (raised $500k at a $4M valuation in 2025). His two earlier studio games (5 Card Draw, Solo Survivor) never took off.

**How it was built:** ~12 hours, one weekend in May 2026, "vibe coded" with Claude Code. He says he knows almost nothing about software engineering. Development then moved to his four-person studio team; he still writes all the questions himself because AI "doesn't understand the pulse of the sports fan."

**Trajectory:**
- Day 1: 79 players → Day 2: 575 → Day 3: 4,000+
- Day 3 trigger: a plug in Kendall Baker's Yahoo Sports newsletter ("one of the most popular daily sports newsletters")
- Week 1 peak: **150,000 daily players**; 1M unique users in under a month
- Steady state ~95,000 players on weekdays

**The money:**
- Pro tier: **$5/month or $40/year** — features: Sport Specific mode, Random Rounds, Previous Days (the full archive), Pro Leaderboard
- ~1,000 members within 2 weeks of launching it → **~$47k ARR with $0 marketing spend**
- Reported **~$40k/month total** by month 3 (Starter Story, Sept 2026) — subscriptions + ads + apps
- Ads run through **Playwire** (a premium gaming ad network — `ads.txt` shows DIRECT), not cheap AdSense
- He turned down betting/fantasy sponsorship offers to keep the game "pure"
- He says he won't sell the company for under $4M

**The other games around it:** GeoFooty (geofooty.app — soccer version, "League Specific" pro mode), a combat-sports version announced, plus the two failed Rhino games. The pattern: one hook that works → spin up niche variants of the same mechanic.

**Why it actually worked (in order of importance):**
1. **Distribution** — a 3.5M-follower creator + one mega-newsletter plug = the rocket. The code was the easy part.
2. **A 60-second loop** — no email, no signup, no phone. Play, get a score, share it. Zero friction.
3. **A shareable result format** — the emoji grid in group chats is the growth engine (same loop as Wordle).
4. **The right paywall** — the archive and extra modes. Power users pay to play MORE, never to play at all.

---

## 2. Three more people/companies doing this (and what they earn)

### 2a. MapTap — John Donham (solo developer)

The game that inspired GeoSports. Five locations per day on a borderless world map; score /1000; shareable grid; each answer comes with a few paragraphs of well-written history.

- Solo weekend project. Idea from 2008, built in 2023 "to knock the rust off his coding." **Last year ~3,000 people played; by July 2026, over 2 million do.**
- TechCrunch: "my new Wordle." Also featured by NPR. Listed on the nibble.games daily-games hub ("over 2.5 million players").
- **Monetization:** late and light — he calls it "a labor of love" — but it now runs **MapTap+ subscriptions (Stripe-based web + iOS app)**: satellite imagery mode, personalized practice, progress tracking, continent XP. No display ads.
- **Lesson:** solo devs can win this space; growth came from press + word of mouth; the premium tier arrived only after the audience did. Prep time: 2008 → 2023 build → 2026 breakout. Patience is part of the recipe.

### 2b. GeoGuessr — the company-scale version (Stockholm, founded 2013)

Street-View location guessing. 80+ employees, Orkila Capital investor, **estimated ~$17M/year revenue**, 15–16M monthly visits. iOS app alone ~$400k/month estimated (Sensor Tower).

- **Pricing (2026):** Pro Basic $4.99/mo ($35.88/yr), Pro Unlimited $6.99/mo ($47.88/yr), Pro Elite $10.99/mo ($71.88/yr); first-year promos from $2.99/mo.
- **The cautionary arc:** in early 2024 they went from freemium to **fully paid** to cover Google Maps API costs → user backlash (Trustpilot 1.4/5) → by 2026 they ship a free tier again.
- **Lesson:** geography games carry real server/API costs; word and number games (ours) don't. And killing the free daily burns goodwill — don't.

### 2c. Puzzmo — Zach Gage & Orta Therox → acquired by Hearst (Dec 2023)

**A hub of ~7 daily games** (Cross|word, SpellTower, Really Bad Chess, Flipart, Wordbind, Cube Clear, Typeshift) — the "one hub, many dailies" model, the closest structural match to Yodoku.

- 100,000 puzzlers before launch; built by a famous game designer (brand matters).
- **Money:** most games free; **"Puzzmo Plus" ~$40/year** unlocks: the archive of past puzzles, ad-free, 2-player access, exclusive games, stats, leaderboards, groups.
- **Distribution:** Hearst newspapers bundle it into their subscriptions (also Postmedia/Canada). The publisher deal IS the distribution engine.
- **Lesson:** the hub model works when you pair it with a distribution partner. Free daily stays free; subscribers buy archive + convenience + social.

### 2d. Backdrop — NYT Games (the gold standard)

11.1 billion puzzles played in 2024 (Wordle 5.3B of them); 10M+ daily players. Games exist to convert players into subscriptions: single-product ARPU $3.36 vs $12.92 for the bundle. **The archive is the paywall** for Wordle/Connections. 12.8M digital subscribers, ~$408M quarterly digital-subscription revenue (Q2 2026).

**Lesson:** the free daily is the point; the money is in archive/convenience; and sticky daily games are the cheapest acquisition channel anyone has found.

---

## 3. Side-by-side comparison

| | Games | Business | Price | Paywall | Ads | Distribution engine | COGS |
|---|---|---|---|---|---|---|---|
| **GeoSports** | 1 (+GeoFooty) | Creator-led studio | $5/mo, $40/yr | Archive + modes + leaderboard | Playwire (premium) | 3.5M creator audience + newsletter plug | Low-medium (map tiles) |
| **MapTap** | 1 (+nibble hub) | Solo dev | MapTap+ (Stripe) | Satellite mode, practice, XP | None | Press (TechCrunch, NPR) + word of mouth | Medium (map tiles) |
| **GeoGuessr** | 1 ecosystem | Company, 80+ staff | $4.99–10.99/mo | Modes + limits | None visible | 12 years, competitive scene, streamers | **High** (Street View licensing) |
| **Puzzmo** | ~7 | Zach Gage → Hearst | $40/yr Plus | Archive + ad-free + social | Display ads (free tier) | Newspaper partners (Hearst, Postmedia) | Low |
| **NYT Games** | 11 | NYT division | Bundle subscription | Archive | Some | NYT audience + cultural ubiquity | Low |
| **Yodoku (ours)** | **7** | Solo + agents | Free | **None yet** | 1 low-yield unit (in-page push) | **None yet** | **Lowest — static data, zero API cost per play** |

### Where we already match the leaders
- **7 games** — as many dailies as Puzzmo; more than GeoSports, MapTap, GeoGuessr combined.
- Free, frictionless daily with shareable result formats (share cards + grids).
- Puzzle supply is automated (curator bot grows the quiz bank weekly) and static (no per-play cost — unlike GeoGuessr's Street View bill).
- PWA + Android shell (Capacitor) already in the repo.
- Archive infrastructure exists (calendars / "play previous puzzles").

### What we're missing vs every monetized player
1. No **accounts** → no subscriptions possible, no cross-device progress.
2. No **payments** (Stripe / Play Billing).
3. No **paywall** — the archive is currently given away unbounded.
4. No **app-store presence** (distribution surface).
5. No **flagship identity** or audience — the historical bottleneck.

---

## 4. The pattern: what every winner has in common

1. **Free, frictionless daily — never gated.** (All five.)
2. **A shareable score format** that spreads in group chats. (All five.)
3. **A "more" paywall** — archive, extra modes, stats, ad-free. Capacity & convenience, never the day's puzzle. (GeoSports, Puzzmo, NYT; MapTap added it late.)
4. **One real distribution engine** — creator audience (Frank), press (MapTap), publisher partner (Puzzmo), a decade of compounding (GeoGuessr/NYT).
5. **Cheap marginal cost.** GeoGuessr pays for Street View and had to go paid-only; word/number/trivia games cost ~nothing per play.

---

## 5. What we should work on to charge — recommendation

**The pick: keep the daily free forever, sell the "more" — a Yodoku+ subscription built on what already exists — and put the app on the Play Store. Then optional upside (sponsorship, licensing).**

### Phase 1 — charge-ready core (build; days of agent work, no new infrastructure vendors)

1. **Accounts-lite.** Email magic-link (no passwords), merge anonymous progress on first login. Anonymous play stays the default — the daily never asks for anything (GeoSports' zero-friction rule).
2. **Yodoku+ subscription.** **€2.99/month or €19.99/year** (deliberately under GeoSports $40/yr and Puzzmo $40/yr). Stripe on web.
3. **The paywall = archive + capacity** (the exact combination that works everywhere):
   - **Free:** today's puzzles + last 7 days + everything currently free.
   - **Yodoku+:** the **full archive** back to launch (we already have the calendars), **ad-free** once AdSense arrives, **stats & streaks synced across devices**, and **unlimited replay / random rounds** (GeoSports' "Random Rounds" is one of their most loved pro features).
4. **Keep the promise:** "Daily puzzles free forever. Yodoku+ is for people who want more."

### Phase 2 — distribution (the actual bottleneck; do it in the same push)

1. **Android app on the Play Store** with **Play Billing** for the same Yodoku+ (the Capacitor shell already exists; he prefers native installable apps; store search = free discovery, and it's a second payment rail that needs no Stripe).
2. **Get listed where daily-game players look:** daily-game directories (e.g. dailydle.org style aggregators), r/WebGames and friends, and — most important — **the newsletters that plug daily games**. One newsletter plug took GeoSports from 575 to 4,000 players in a day and to 150k that week.
3. **Start the yodoku newsletter** (a simple "today's puzzles" email). Owned distribution is what makes later pushes cheap.

### Phase 3 — upside, only when traffic justifies it

1. **Quiz Master sponsor card** — one sponsor per week, newsletter-style. Brands cold-pitch successful daily games (that's literally how GeoSports got its offers). We don't hunt; we become pitchable.
2. **License/white-label the hub** to a publisher — the Puzzmo–Hearst route. A 1–2 year option, not a launch plan.

### Honest math (so "success" isn't fuzzy)

Conversion benchmarks across this space: ~0.5–1.5% of engaged players pay (GeoSports ~1,000 subs early; Puzzmo/NYT similar magnitudes at their scales).

| Monthly active players | Paying at 0.5–1.5% | Revenue at €19.99/yr |
|---|---|---|
| 10,000 | 50–150 | €1k–3k/year |
| 50,000 | 250–750 | €5k–15k/year |
| 200,000 | 1,000–3,000 | €20k–60k/year |

Plus ads on the free tier, plus app-store discovery. **The conclusion is unavoidable: charging is a multiplier on distribution, not a substitute.** Every case study here had a distribution miracle (creator audience, press coverage, or a newspaper partner). Building the paywall takes days; earning the audience is the long pole.

### What "succeed" looks like realistically
- **Month 1–2:** Yodoku+ live, Android app submitted, 3–5 directory/newsletter placements, first subscribers (even 10–50 validates everything).
- **Month 3–6:** a working funnel — traffic → subs at ≥0.5% — and one press/newsletter moment of our own.
- **Month 6–12:** €500–2,000/month combined (subs + ads) if a distribution push lands; more only with a viral moment or a partner.

---

## 6. Sources

- GeoSports: geosports.app (site), x.com/frankmikesmith, Sportico "GeoSports Trivia Game Went From 'Vibe Code' to Viral Fame" (May 28, 2026), FMS newsletter "I locked in and created a viral mini game" (May 6, 2026), Starter Story interview (Sept 2026), geosports.app/ads.txt (Playwire), geofooty.app.
- MapTap: maptap.gg, TechCrunch "MapTap, a daily geography game, is my new Wordle" (Jun 18, 2026), nola.com interview with John Donham (Jul 26, 2026), Qiaeru write-up, nibble.games.
- GeoGuessr: geoguessr.com/pro and geoguessr.support "Price Changes 2026" (Jan 22, 2026), growjo/compworth estimates (~$17M), ReviewBolt traffic (15.8M visits, Sept 2026), Sensor Tower app estimate.
- Puzzmo: hearst.com acquisition announcement (Dec 4, 2023), puzzmo.com, mssv.net write-up ($40/yr Plus features), National Post coverage.
- NYT Games: NYT Q2 2026 earnings release, Wikipedia "The New York Times Games", Stratrix analysis (ARPU $3.36 vs $12.92), AP News (Crossplay launch).
