# Yodoku — Master Plan (PROPOSAL)

> **Status: PROPOSAL — nothing executed yet.** This document is the full proposed plan
> discussed before any action is taken. Companion: `COMPETITIVE-ANALYSIS.md`.
> Date: October 2026.

---

## 0. Your two questions, answered first

**Q1: "Should we use the website and domain for something else?"**
**No — keep yodoku.app as the home of the hub.** It is a working, deployed, bug-free product. Repurposing it would reset every bit of accumulated value (search indexing, the working infra, the 7 finished games) and we have no better use for it. A daily-games hub is exactly the kind of asset that compounds: content grows automatically (bots), subscriptions recur, and it costs ~nothing to run. The domain name is short and brandable — keep it.

**Q2: "Should we make this a game?"**
It already IS games — seven of them. What's missing is not a new product. What's missing is:
1. **a flagship** — one game that leads the story and the marketing (the hub keeps all seven),
2. **charging rails** — the subscription layer (archive + convenience),
3. **a distribution engine** — this is what every success story we studied actually had, and what we don't have yet.

So the plan is: **keep the hub, add a charge-ready core, pick ONE game as the spearhead, and run distribution like a machine.** No repurposing, no pivot, no throw-away.

---

## 1. Where we actually stand (facts, not hopes)

- **Product:** 7 daily games live on yodoku.app (Clear the String, Change by One, Word Pool, ORDERLE, FERMI, Quiz Master, 7 Letters). Free, no signup, share cards, calendars, PWA + Android shell, automated content bots (quiz curator +44 q/week), audit-clean, deployed via GitHub → Vercel.
- **Money today:** one low-yield ad unit (Monetag in-page push). Near-zero revenue at current traffic.
- **Audience today:** none. **This is the bottleneck.**
- **Market reality (checked):** daily games are SATURATED — a catalogue lists **1,458 Wordle-style games**; the estimation niche has 6+ live competitors (fermi.gg, estimania, ballparkdaily, napkin, guesscale…); ordering has Disorderly (300+ puzzles), Orderdle, Timdle, Chronle. Trivia and word games are the most crowded of all.
- **What the winners had (all five studied):** a distribution engine (creator audience / press / publisher partner / brand), a frictionless free daily, a shareable score, and a paywall that sells **"more"** (archive, extra modes, ad-free) — never today's puzzle.

**Conclusion:** we can't win by finding an empty mechanic — there are none. We win by (a) a better PACKAGE (7 games, 1 minute each, no ads junk, one sub), (b) a polish + content advantage (bots), and (c) distribution channels that don't require an existing audience.

---

## 2. The strategy in one page

**The product story:** *"Seven daily games. One minute each. Free forever. No signup."* — the daily puzzle page. Seven different brains for seven moods: word, logic, numbers, trivia.

**Publisher brand:** **Yordan Creatives** — the name on the door (Play Store developer name, email/newsletter sender, site footer, press kit). Yodoku stays the product name that players see.

**The shop window: ALL SEVEN games** — the hub always presents the full set (hero copy: "Seven daily games. One minute each. Free forever."), and every listing/pitch features all of them.
**Strategic lead: Quiz Master** gets the extra push — standalone seeding in its 11 category communities, first position in app-store copy, sponsor angle later. It leads; the others ride the same shop window.
- Why Quiz Master for the extra push: the **only automated content machine** in the stack (the curator bot grows it weekly — nobody studied has that); **11 categories = 11 seeding angles**; the most **sponsor-friendly** format for later; universal playability.
- Rotation rule: if Phase A data shows another game clearly dominates engagement, the extra push rotates to it within 2 weeks. Rotation is cheap — everything lives on the same hub.
- Do NOT build a brand-new game now ("hook lab" only if two rotations fail — keep focus).

**The money — three rails, in order:**
1. **Yodoku+ subscription** (web): €2.99/month or €19.99/year — full archive back to launch, ad-free, stats synced across devices, unlimited practice/random rounds. Today's puzzles stay free forever.
2. **Play Store app** ("Yodoku") with Google Play Billing — same subscription, second payment rail, free store-search distribution.
3. **Later upside:** sponsored Quiz Master card (brands already cold-pitch successful dailies), premium ad network at scale, licensing/white-label only if a partner arrives (the Puzzmo–Hearst path).

**The distribution engine (the actual work):** directories/catalogues that list daily games, newsletter plugs (one plug took GeoSports from 575 → 4,000 players in a day), community seeding with the code of conduct from `DISTRIBUTION-PLAN.md`, app-store search, press with the story angle ("solo dev + AI agents, 7 games, no ads, no signup"), and the share loops inside every game. Outreach = one-time pitches prepared by me; **no client hunting, ever.**

---

## 3. The plan — phases

### Phase A — Numbers + foundation (days 1–3)

| # | Task | Who |
|---|------|-----|
| A1 | Per-game engagement telemetry (plays/day per game, share-button clicks) so the flagship push is data-backed | me |
| A2 | Baseline traffic from the Vercel dashboard (you copy numbers or give me access) | you |
| A3 | `hello@yodoku.app` email + newsletter skeleton ("today's puzzles", 1 email/day) — **Brevo or Resend** (Beehiiv's free plan cannot send via API — verified 2026-10-03; Yordan's pick — 2026-10-03 — already comfortable with them; both free tiers work and both also serve as Supabase SMTP; the send script supports BOTH, one-line config) | me · **BUILT & TESTED 2026-10-03**: `/api/subscribe` (13/13 tests), hub signup form behind `VITE_NEWSLETTER_ENABLED`, English composer/sender for **both** providers, **paused** 08:30 cron — waiting only on the account + API key. |
| A4 | Front-door copy refresh to the hub pitch; audit per-page titles already done | me |

### Phase B — Flagship + distribution (weeks 1–6, continuous)

| # | Task | Who |
|---|------|-----|
| B1 | Quiz Master flagship treatment: landing copy, share-text v2, themed editions (Sports/Movies/Science…) as seeding hooks | me |
| B2 | Directory submissions (daily-game catalogues, aggregators, awesome-daily-minigames GitHub, dailydle-type sites) — concrete list in execution | me |
| B3 | Newsletter pitch campaign: 20 candidate newsletters (puzzle/games/productivity/sports), drafted by me, approved by you, sent from the yodoku email | me → you approve |
| B4 | Press kit + one launch story; Show HN / Product Hunt / subreddit posts scheduled per the distribution code of conduct | me |
| B5 | Bots upgraded: daily results auto-post to WhatsApp/Telegram channel; curator keeps growing content | me |

### Phase C — Charge-ready core (weeks 2–5)

| # | Task | Who |
|---|------|-----|
| C1 | Accounts-lite: email magic-link (Supabase free tier), anonymous play stays default, progress merges on first login | me |
| C2 | Lemon Squeezy checkout (merchant of record — they handle all EU/VAT globally, 5% + 50¢/txn) + webhook → entitlement in Supabase | me |
| C3 | Paywall: free = today + last 7 days; Yodoku+ = full archive (all calendars, back to launch), ad-free, cross-device sync, unlimited practice/random rounds | me |
| C4 | Legal: privacy/terms update, refund policy, pricing page | me |

### Phase D — Play Store app (weeks 3–6)

| # | Task | Who |
|---|------|-----|
| D1 | Signed release build from the existing Capacitor shell (release keystore workflow already exists) | me |
| D2 | Play Console account ($25 one-time), listing, ASO copy, screenshots, content rating | you (account) + me (everything else) |
| D3 | Play Billing via RevenueCat (free at our scale) — same Yodoku+ entitlement as web | me |
| D4 | Store release + first ratings push (in-app, calm) | me |

**Play gate (verified 2026-10-03):** Google requires new *personal* developer accounts to run a closed test with **12 testers opted in continuously for 14 days** before production access. We recruit the 12 testers from early users / the newsletter when we get there; the account can be opened and the app submitted to closed testing while the paywall work continues.

### Phase E — Monetization ladder (ongoing, threshold-based)

| # | Trigger | Action |
|---|---------|--------|
| E1 | now | keep Monetag in-page push (only unit that doesn't wreck the experience) |
| E2 | ≥ ~500k sessions/mo | apply to a premium gaming ad network (Playwire-class; GeoSports runs Playwire) |
| E3 | ≥ 50k monthly players | sponsored Quiz Master card (weekly sponsor slot) |
| E4 | inbound only | licensing/white-label conversations |

### Phase F — Decision gates (day 60 and day 90)

- **Gate 1 (day 30):** flagship ≥ 1,000 weekly players; ≥ 100 newsletter subscribers; ≥ 3 directory listings live; app submitted.
- **Gate 2 (day 60):** ≥ 10 paying subscribers; share-clicks trending up.
- **Gate 3 (day 90):** ≥ 0.5% conversion of engaged players; organic traffic growing week-over-week.
- **On miss:** rotate flagship (same hub, cheap) and re-run Phase B; if two rotations fail with zero traction, we stop the monetization push and keep the hub as a compounding asset — written down now so "success" and "stop" are both defined.

---

## 4. Split of labor

**Only you can do:** Lemon Squeezy account (name/bank), Play Console account ($25), approve outreach sends, paste Vercel numbers, 10 minutes of decisions in section 8.
**I do everything else:** all code, infra, bots, content, listing copy, screenshots, pitch drafts, monitoring, and the reports.

---

## 5. Costs & timeline

- **Cash to be fully chargeable:** ≈ €25 (Play Console) + payment fees (Lemon Squeezy 5% + 50¢/txn; Play Billing 15%). Everything else is agent work — domain, Vercel, Supabase, Brevo/Resend, RevenueCat all on free tiers at our scale.
- **Charge-ready core:** ~2–3 weeks of work. **App:** ~1–2 weeks after that. **Readable distribution results:** 60–90 days.
- **No spend on ads.** Organic only until the funnel proves itself.

---

## 6. Honest revenue math (so "success" isn't fuzzy)

Conversion benchmarks in this space: **0.5–1.5%** of engaged players pay (GeoSports ≈1,000 subs early; NYT single-product ARPU $3.36; Puzzmo $40/yr).

| Monthly active players | Paying (0.5–1.5%) | Sub revenue at €19.99/yr | + ads |
|---|---|---|---|
| 10,000 | 50–150 | €1k–3k/yr | minor |
| 50,000 | 250–750 | €5k–15k/yr | some |
| 200,000 | 1,000–3,000 | €20k–60k/yr | meaningful |

GeoSports' ~$40k/month rides on ~95–150k daily players that came from a 3.5M-follower creator + a mega-newsletter. **Charging is a multiplier on distribution, not a substitute for it.** The plan therefore spends most of its energy on distribution, with the smallest possible build for the rails.

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Saturated market | Hub package (7 games) + polish + "no ads junk" positioning + speed (1-min games) |
| No audience | Distribution channels that don't need one (directories, app store, pitches, communities) |
| Newsletter pitches ignored | Volume + quality: 20 targets, personalized, from a real product; some are free, some paid ($50–300 — only if we choose) |
| Content dries up | Bots: quiz curator already autonomous; extend to other games |
| Churn after novelty | Daily ritual + streaks/stats + archive value; free tier remains generous |
| API cost traps (GeoGuessr's lesson) | We have zero per-play costs (static data) — a structural advantage. Keep it that way |
| Google Play review friction | Standard app, no restricted content; listing prepared carefully |
| VAT/tax headaches | Merchant of record (Lemon Squeezy / Google) handles all of it |

---

## 8. Decisions needed from you (recommended defaults in bold)

1. **✅ DECIDED — all 7 games in the shop window; Quiz Master gets the strategic extra push** (rotate on data).
2. **✅ APPROVED — pricing: €2.99/mo · €19.99/yr**, today's puzzles free forever.
3. **✅ DECIDED — publisher brand: Yordan Creatives** (product brand stays Yodoku; hello@yodoku.app) + newsletter via **Brevo or Resend** (English, runs autonomously — bots compose and send; you own the account; Beehiiv free can't automate).
4. **You open two accounts when I say go:** Lemon Squeezy + Google Play Console ($25). I prepare everything; you click.
5. **Outreach:** I draft all pitches; you approve the target list and sends (newsletters + directories). Directory submissions I can do directly. ✱ recommended
6. **✅ GREENLIT — Phase A + B building now** on branch `yodoku-plus` (nothing public without approval). Execution tracker: `docs/EXECUTION.md`.

---

## 9. What we deliberately do NOT do

- No repurposing or renaming the domain; no second site (the nibble.games lesson: one domain ships faster).
- No paywalling today's puzzles. Free daily is the whole growth engine.
- No popunder/vignette ads (they once made the game unplayable — never again).
- No paid advertising until the funnel proves itself.
- No gamification junk (no XP/coins), no dark patterns.
- No client hunting. Inbound only.
- No building a brand-new game until two flagship rotations fail.

---

## 10. Immediate next steps after your greenlight

1. Phase A days 1–3 (telemetry, email, newsletter, copy).
2. Phase B kickoff (flagship treatment + first 10 directory submissions).
3. Phase C build (accounts + Lemon Squeezy + paywall) — first code change, on a branch, tested locally before anything goes near main.
4. Report back with real numbers at Gate 1 (day 30).
