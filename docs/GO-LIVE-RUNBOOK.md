# YODOKU GO-LIVE RUNBOOK — "All switches on"

Decision (2026-10-05, user): All switches ON now, regardless of Google Play.
- No tester recruitment. User provides up to 3 of his own emails. Test as we go (no waiting ceremony).
- Play production access stays parked until Google approves; app is distributed as APK meanwhile.

## ⚠️ BLOCKER FOUND (2026-10-05, verified in LS dashboard)
**Lemon Squeezy store activation: APPLICATION RECEIVED, UNDER REVIEW.**
Sidebar: "Your application has been received and will be reviewed as soon as possible".
→ Live selling (web) blocked on LS's review queue — same shape as Google's. Nothing actionable on our side; watch email.
→ PAID_ENABLED stays false until LS approves (flipping now = TEST-mode checkout shown to visitors).
→ Setup checklist: profile/identity/2FA/product/bank done; only optional marketing steps open. Not blockers.

## Done already (2026-10-05)
- [x] PR #1 (fix/android-app-link-signin) merged to main
- [x] PR #2 (feat/native-shell-pass) merged to main — ad-free native app, daily reminder,
      status bar, back-button UX, native share, haptics, phone-viewport fixes (390/360/320)
- [x] Live verified on yodoku.app: free web keeps the Monetag tag; ?native=1 / ?plus=1 withhold it; 0 JS errors
- [x] Fresh signed AAB (12.6M) + APK (12.8M) built; versionCode stays 1 for first Play upload

## On LS approval (10-minute ceremony)
1. [ ] LS: turn Test mode OFF (dashboard sidebar toggle; Google login ver.iamyo94@gmail.com + user 2FA)
2. [ ] LS: Webhooks page (live context) → create webhook → https://www.yodoku.app/api/lemonsqueezy-webhook
      (5 subscription events) → capture LIVE signing secret (40 hex)
3. [ ] Store live secret in yodoku-lemonsqueezy.key; update Vercel `LS_WEBHOOK_SECRET`;
      `vercel redeploy <production-url> --target production`
4. [ ] Flip `PAID_ENABLED = true` (src/utils/monetization.ts), commit, push (auto-deploy)
5. [ ] LIVE verification on https://www.yodoku.app: /plus shows real checkout; archive locks render;
      unsigned webhook POST → 401; newsletter ok
6. [ ] Optional real-purchase test (user's card) → verify entitlements row → refund/cancel in LS

## Native app notes at go-live
- LS checkout is hidden inside the native app (Play policy) — /plus shows "coming to Google Play".
- INTERIM: archive gating in the NATIVE app stays dormant until Play Billing exists
  (locks visible in-app with no purchase path = bad UX). Web gating fully live.
- Daily reminder notifications are LOCAL (no Firebase); SCHEDULE_EXACT_ALARM deliberately removed
  (reminders may fire a few minutes after 09:00 — avoids the Play exact-alarm declaration).

## Google gate (cannot be switched off — their rule)
- New personal dev accounts: production access requires a closed test with 12+ testers / 14 continuous days.
- We skip the ceremony; when Google approves identity, revisit with user (options: minimal closed test,
  or direct production request).
- Everything else (web + APK) works WITHOUT this.
