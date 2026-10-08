# WHERE WE ARE — Yodoku handoff (2026-10-08)

This file exists so a **fresh Hermes session (or future me) continues without the old chat**.
Read this first, then load the `yodoku` skill (the project bible).
History of the long build session is searchable: `session_search("Yodoku6/7")`.

---

## 🟢 UPDATE 2026-10-08 (late): Play setup 100% + everything submitted for review

- **All App content forms are SAVED**, including the two that resisted all evening: **Data safety** (email address: collected, optional, not shared; purposes = App functionality / Developer communications / Account management; deletion URL = yodoku.app/privacy) and **Financial features** ("no financial features"). The missing block was the **advertising ID declaration** (answer: **No**) — required before submission; it now clears the quick-check.
- The dashboard checklist reached **11/11** ("Finish setting up" section disappears) and the Publishing overview lock lifted.
- **Closed testing track created and fully configured**: "Closed testing - Alpha", all **178 countries**, the **"Yodoku Testers" email list** attached (3 users) + feedback channel set, and release **2 (1.1)** created from the existing bundle (notes copied from the internal-test release).
- **All 16 changes submitted for review** ("Changes in review", sent 2026-10-08 late; Google says typically ≤7 days). After approval: closed test goes live → join links appear on the track's Testers tab.
- **Key console trap (cost hours):** on this window the Console's fixed footer lays out wider than the viewport, so the footer **Save button sits off-screen (x≈1655 > inner width ≈1540)** and silently swallows clicks — the form never saves and the UI gives no error. **Save via the footer ⋮ overflow menu** instead, and verify saves by their network POST (e.g. `.../declarations/POLICY_DECLARATION_ID_*`, `.../storelistings/0`). Full recipe: `screen-reading-and-gui-driving` → `references/play-console-cdp.md` §6–8.
- **After the review passes:** re-check the console, grab the closed-test join links, share with testers — the gate needs **12+ opted-in for 14 continuous days**, then **apply for production access**. List currently has 3 users; recruit the rest.

---

## Live things

| Thing | State |
|---|---|
| Web | **https://www.yodoku.app** — Vercel auto-deploy from GitHub `IamYordan94/yodoku` (`main`) |
| Android | Play Console app **"Yodoku"**, package `app.yodoku`, Play app id `4975677602769221995`, dev id `5115309915099098890` ("Yordan Creatives", Personal account) |
| Play release | **App setup 100% COMPLETE + ALL CHANGES SUBMITTED FOR REVIEW (2026-10-08 late)** — internal testing v2 (1.1) live; **closed testing track "Closed testing - Alpha" (id 4700729803229515224)** set up (178 countries, "Yodoku Testers" list attached, release 2 (1.1)) and submitted together with the store listing + every App content declaration. Publishing overview shows **"Changes in review"** (typically ≤7 days) |
| Lemon Squeezy | Store `yodo.lemonsqueezy.com`, product **Yodoku+ €19.99/yr**, webhook `139559` → `/api/lemonsqueezy-webhook`. Test-mode chain proven end-to-end. **Activation review — reply to their 3 questions drafted 2026-10-08** |
| Newsletter | Brevo live — list "Yodoku Daily", `POST /api/subscribe` → `{"ok":true,"provider":"brevo"}` |
| Accounts | Supabase `ibsbdwttksfuwiyywqlu` — magic-link sign-in live, `entitlements` table feeds Yodoku+ |
| Spanish | Branch `es/p1-i18n` = **Phase 1 done** (i18n engine + EN/ES locales + language switcher wired; build + ad-guard green). Phase 2 (content) next. Never destabilize live English |

**Recent (2026-10-08 — vocabulary & difficulty wave SHIPPED):** audit→decision→implementation cycle done; everything is LIVE on www.yodoku.app (verified: today's CST = leap/nemo/world/germ · horned/assent/pounded/sermons/tribune/manager; 7 Letters = 180 clean boards, 0 junk; quiz = 1,209 questions; CBO ≤8 steps; the 15MB `words.json` no longer ships — moved to `scripts/data/words.json`). Also live: home games band + `#games` deep link, boot loader min 1.8 s. **App v2 (versionCode 2 / 1.1) built — rolling to Play internal testers** (carries loader + home band + all vocabulary fixes; testers must update from Play, not sideload).

## Next actions (in order)

1. **App v2 rollout:** upload the built AAB to Play internal testing (release notes + rollout; same recipe as v1). Then the app on testers' phones matches the web.
2. **Vocabulary wave follow-ups (flagged, not blocking):** quiz 30-day explanation gate rolls — backfill explanations with the next content batch or the weekly validator will redden; WP level re-themes (names-blocklist consequence) can be softened later if the owner dislikes any category; sustainer cadence note in `docs/vocab-audit/06`.
3. **Play testers:** add more emails under *Test and release → Internal testing → Testers* → opt-in link `https://play.google.com/apps/internaltest/4701234309554419473` (emails must be ON the list first; Enter makes a chip). He is tester #1, Christina added. Target ~14.
4. **Collect ~14 tester emails** from the user (Google-account emails, Android phones). Internal = instant installs; the **closed test** (12+ opted-in, 14 continuous days → production application) is the gate that counts.
5. **Play store setup** — store listing, content rating, data safety, screenshots + feature graphic (assets in `docs/play-store/`). Required before the closed test can start.
6. **Lemon Squeezy go-live** once activated (~10 min): test mode OFF → create LIVE webhook → swap `LS_WEBHOOK_SECRET` in Vercel env → redeploy (`vercel redeploy <url> --target production`) → flip `PAID_ENABLED`.
7. **Spanish Phase 2** after Phase 1 review/merge.

## Where things live

- Code: `Desktop\AI STUFF DIFFERENT AGENTS\Build and Online\YODOKUAPP` (this repo)
- Project bible: Hermes skill **`yodoku`** (auto-loads; keep it updated)
- Secrets (**paths only, never values**): `hermes\secrets\yodoku-brevo.key`, `hermes\secrets\yodoku-lemonsqueezy.key` (read the `LS_API_KEY` LINE for LS API calls — reading the whole file gives a fake 401), keystore `~/yodoku-release.keystore`
- Play artifacts: `android/app/build/outputs/bundle/release/app-release.aab` (= the published v1); preview APKs on Desktop/Downloads (v5)
- Play Console browser: robot Chrome, profile `hermes\cache\browser-use\chrome-auto`; relauncher `...\cache\scratch\launch-console.cmd`
- Runbook: LS switchover steps in `...\cache\scratch\yodoku-go-live-runbook.md`

## Hard rules (do not relearn)

- **English only** in product + docs. **No emojis** in the product. Sticker Pack design everywhere. Home page = no menus, no icons.
- `PAID_ENABLED` stays `false` until LS live secrets land; every paid feature ships dormantly safe.
- Native app never loads ads; web free users only (Monetag zone `11640179`). Yodoku+ hides the LS checkout inside the native app (Play Billing rule).
- Agent never types card numbers anywhere; 2FA codes are entered by the user.
- Testers see temporary name **"app.yodoku (unreviewed)"** until the listing review completes.
