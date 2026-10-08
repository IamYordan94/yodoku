# WHERE WE ARE — Yodoku handoff (2026-10-08)

This file exists so a **fresh Hermes session (or future me) continues without the old chat**.
Read this first, then load the `yodoku` skill (the project bible).
History of the long build session is searchable: `session_search("Yodoku6/7")`.

---

## Live things

| Thing | State |
|---|---|
| Web | **https://www.yodoku.app** — Vercel auto-deploy from GitHub `IamYordan94/yodoku` (`main`) |
| Android | Play Console app **"Yodoku"**, package `app.yodoku`, Play app id `4975677602769221995`, dev id `5115309915099098890` ("Yordan Creatives", Personal account) |
| Play release | **Internal testing v1 (1.0, 12.4 MB) PUBLISHED** — "Available to internal testers". Dashboard 67%: only **Select testers** left |
| Lemon Squeezy | Store `yodo.lemonsqueezy.com`, product **Yodoku+ €19.99/yr**, webhook `139559` → `/api/lemonsqueezy-webhook`. Test-mode chain proven end-to-end. **Activation review — reply to their 3 questions drafted 2026-10-08** |
| Newsletter | Brevo live — list "Yodoku Daily", `POST /api/subscribe` → `{"ok":true,"provider":"brevo"}` |
| Accounts | Supabase `ibsbdwttksfuwiyywqlu` — magic-link sign-in live, `entitlements` table feeds Yodoku+ |
| Spanish | Branch `es/p1-i18n` = **Phase 1 done** (i18n engine + EN/ES locales + language switcher wired; build + ad-guard green). Phase 2 (content) next. Never destabilize live English |

## Next actions (in order)

1. **Play testers:** add the user's email (`mihaylovyordan94@gmail.com`) under *Test and release → Internal testing → Testers* → fetch the opt-in link → he installs from Play (he uninstalls the sideloaded APK first — signatures differ). He is tester #1.
2. **Collect ~14 tester emails** from the user (Google-account emails, Android phones). Add in batches. Internal = instant installs; the **closed test** (12+ opted-in, 14 continuous days → production application) is the gate that counts — same people get re-added there.
3. **Play store setup** — store listing, content rating, data safety, screenshots + feature graphic (assets in `docs/play-store/`). Required before the closed test can start.
4. **Lemon Squeezy go-live** once activated (~10 min): test mode OFF → create LIVE webhook → swap `LS_WEBHOOK_SECRET` in Vercel env → redeploy (`vercel redeploy <url> --target production`) → flip `PAID_ENABLED`.
5. **Spanish Phase 2** after Phase 1 review/merge.

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
