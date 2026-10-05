# Yodoku — Launch Checklist (Yordan's side)

**Written 4 Oct 2026.** Everything here needs a human: accounts, payments, ID checks, DNS.
All the code is already written, tested and waiting; each item says what happens once it is done.
Running time: **~2 hours of your time**, spread over a few days because of ID/verification waits.

---

## Already done (no action for you)

- Site live at **https://www.yodoku.app** (Vercel, auto-deploys from GitHub) — shop window, /plus page, archive gating ready but off.
- **Android release build ready**: signed AAB + APK (~14 MB) — `android/app/build/outputs/bundle/release/app-release.aab`.
  Keystore + password README: `~/yodoku-release.keystore` — **back it up** (password manager is fine). Never lose it.
- **Play Store assets ready**: 8 phone screenshots + feature graphic in `docs/play-store/`; listing text in §5a below.
- **Yodoku+ plumbing built & tested**: checkout button, webhook receiver (`/api/lemonsqueezy-webhook`, signature-verified), entitlement scaffold — dormant until §3 + §4 exist.
- **Newsletter — LIVE end-to-end (4 Oct)**: signup form + `/api/subscribe` run through Brevo; first subscriber + first real campaign delivered; **daily 08:30 send is active**. (Details in §1.)

---

## Where your DNS lives (important for §1 and §2)

`yodoku.app` uses **Cloudflare** nameservers. All email records (Brevo DKIM/SPF/DMARC, email forwarding)
are added in **Cloudflare dashboard → yodoku.app → DNS**. There is currently **no mailbox** on the
domain (no MX records), so `hello@yodoku.app` cannot receive mail yet.

---

## 1. Brevo — newsletter + login emails — ✅ DONE (agent-assisted, 4 Oct)

**Done 4 Oct 2026 (via the live Chrome session), all on your existing Brevo account:**
- Sender **Yodoku <hello@yodoku.app>** added and **Verified** — domain authentication made it instant, no confirm-email needed.
- List **"Yodoku Daily"** created (in "Your First Folder") — **list ID 3**.
- API key "Yodoku site" generated → stored in `C:\Users\veria\AppData\Local\hermes\secrets\yodoku-brevo.key` **and** added to **Vercel** as `BREVO_API_KEY` + `BREVO_LIST_ID=3` + `VITE_NEWSLETTER_ENABLED=true` (environment: Production), then redeployed without build cache.
- Live proofs: `/api/subscribe` returns `{"ok":true,"provider":"brevo"}`; the test subscriber appears in list 3; **first real campaign was sent and delivered**; the daily 08:30 cron (`6456c75707b9`) is **resumed**.
- Still optional from the list below: **SMTP key** (item 5 — only needed for Supabase login emails in §3) and **double opt-in** (item 6).
- Note: the earlier "email is not valid" rejection was solved by hand-typing `hello@yodoku.app` into the form (paste can carry invisible characters).

**One account for everything — decided 4 Oct 2026.** Your existing Brevo account stays as-is; Yodoku gets
its own **API key**, its own **SMTP key** and its own **contact list** inside it. That is Brevo's own
recommendation for multiple apps, and per-app keys can be revoked independently. (Sub-accounts would need
Enterprise; not needed.) One behaviour to just know: **unsubscribes are account-wide** — someone who
unsubscribes from any of your products' campaigns stops receiving campaigns from all senders in the account.

Steps:
1. **Add the domain**: *Senders, Domains & Dedicated IPs → Domains → Add a domain* → `yodoku.app`.
   Copy the 4–5 DNS records (Brevo code, DKIM ×2, DMARC) into **Cloudflare** (Brevo can often connect to
   your DNS provider and add them for you). Wait for **Authenticated**. Your account is already approved for
   sending, so there is no new review.
2. **New sender**: *Senders* → add **hello@yodoku.app** (the receive side is §2).
3. **New list**: *Contacts → Lists* → create **"Yodoku Daily"** → copy the **list ID** (the number in its URL).
4. **New API key**: *Settings → SMTP & API → API keys → Add a new key* → description "Yodoku site" → copy `xkeysib-…`.
5. **New SMTP key**: same page, **SMTP** tab → *Add a new SMTP key* (description "Yodoku / Supabase") →
   copy it together with the SMTP host and login — Supabase needs those in §3.
6. Optional: **Settings → Double opt-in** — tell me if you want it and I wire the confirmation flow.

**Where the keys go (never in chat):** the API key goes into **Vercel** env vars (§7), and into one local file
for the daily sending bot — I will create `C:\Users\veria\AppData\Local\hermes\secrets\yodoku-brevo.key`
for you to paste it into with Notepad. The SMTP key goes into Supabase (§3). Nothing else is needed.

**What I do after:** ✅ done 4 Oct — cron resumed, real signup + real first email sent end-to-end.

## 2. hello@yodoku.app — receive and reply — ✅ DONE

**Done 4 Oct 2026 (agent-assisted, via the live Chrome session):**
- Cloudflare **Email Routing enabled** for `yodoku.app` — MX records `route1/2/3.mx.cloudflare.net` + SPF TXT are live in DNS (verified externally).
- Routing rule **`hello@yodoku.app → ver.iamyo94@gmail.com`** created and **Active** (verified in the Routing rules table).

Note: the old stray *Pending* entry for `hello@yodoku.app` under **Destination addresses** is harmless junk (it was added as a destination by mistake). Delete it whenever from that tab's row menu (⋯ → Delete) — **do not** delete `ver.iamyo94@gmail.com` there, that’s the real, verified destination.

Brevo's domain authentication also came through — verified externally: `brevo-code` TXT, DKIM (`brevo1/brevo2._domainkey` CNAMEs) and DMARC are all live.

## 3. Supabase — user accounts / logins — ✅ DONE (agent-assisted, 4 Oct)

**Done 4 Oct 2026 on project `ibsbdwttksfuwiyywqlu` ("Yodoku"):**
- **Email provider + magic links**: enabled (Email Enabled by default).
- **Custom SMTP**: ON — `smtp-relay.brevo.com`, port **587**, login `b9fde1001@smtp-brevo.com`, password = the Brevo **SMTP key "Yodoku Supabase"** (stored in the local secrets file). Sender: **Yodoku <hello@yodoku.app>**.
- **URL config**: Site URL = `https://www.yodoku.app`; Redirect URLs = `https://www.yodoku.app/**`.
- **`entitlements` table** created via SQL Editor (email PK, status, plan, ls_subscription_id, updated_at; RLS on, no public policies — service key only). Verified via REST: `GET /rest/v1/entitlements` → `[]` HTTP 200 with the secret key.
- **Keys captured**: publishable key + secret key → stored in the local secrets file; both were added to **Vercel** (see §7). The secret key is stored in Vercel as a Config var (functionally identical to Secret; can be flipped anytime from the row menu).
- **Live proof**: a real magic-link/confirm email was requested through the API and **arrived in Gmail via Brevo SMTP** (sender "Yodoku", 12:56 PM). The user `ver.iamyo94@gmail.com` exists in Auth → Users.
- Known extras: the SMTP save UI shows a "Minimum interval per user: 60s" default (fine). One stale Gmail artifact: none.

## 4. Lemon Squeezy — web subscriptions — ✅ DONE (agent-assisted, 4 Oct)

**Live in TEST mode with the full chain proven end-to-end:**
- Store subdomain: `yodo.lemonsqueezy.com` (store "Yodo").
- Product **"Yodoku+"** — subscription, **€19.99 / year** — published. Product ID `1411063`, variant UUID `61be7410-ab34-4c63-bfed-1a1ffb5030f7`.
- Checkout URL: `https://yodo.lemonsqueezy.com/checkout/buy/61be7410-ab34-4c63-bfed-1a1ffb5030f7` → in Vercel as `VITE_CHECKOUT_URL` (Config, Production).
- Webhook id `139559` → `https://www.yodoku.app/api/lemonsqueezy-webhook`, events `subscription_created/updated/cancelled/resumed/expired`, signing secret set (⚠️ LS caps secrets at **40 chars**); secret stored in `~/AppData/Local/hermes/secrets/yodoku-lemonsqueezy.key` + Vercel as `LS_WEBHOOK_SECRET` (Secret, Production + Preview).
- **Full-chain proof (real test purchase, 4 Oct 12:49):** test-mode checkout (user entered `4242…` test card) → LS fired `subscription_created` → endpoint verified HMAC → **Supabase `entitlements`: `ver.iamyo94@gmail.com / active / ls_subscription_id 2579971`**. Unsigned POSTs correctly rejected with 401. Signed request earlier: `{"ok":true,"persisted":true}`.
- Vercel gotcha: dashboard "Redeploy" clicks can silently fail → use `vercel redeploy <deployment-url> --target production` (CLI on this machine is logged in as `veriamyo94-9489`).
- To go live: switch store out of Test mode → create the **live** webhook (same URL) → swap `LS_WEBHOOK_SECRET` to the live signing secret → redeploy → flip `PAID_ENABLED`.
- ✅ Variant renamed **"Default" → "Yodoku+ Yearly"** (4 Oct). Path in the dashboard: product → **Variants** → "**Add variant →**" (⚠️ that button actually opens the *variant editor* for the existing default variant; the variant is NOT listed as a row in the section) → edit **Variant name** → **Save and go back**. The LS API cannot do this (PATCH /v1/variants → 405; products/variants are read-only in the API).
- LS **API key "Yodoku ops"** created (test-mode key; default expiry 2027-04-04) → stored as `LS_API_KEY` in the local LS secrets file.

## 4-old. (original steps, kept for reference)

1. https://app.lemonsqueezy.com/register → **Activate your store** → questionnaire → **Verify identity**
   (photo of government ID) → wait 2–3 business days.
2. **Settings → Payouts** → connect bank (IBAN) or verified PayPal.
3. **Store → Products** → new product **Yodoku+** → variant **€19.99 / year** (the price you approved).
4. Copy out: **checkout URL** (product's *Share* button), **Store ID**, **Product ID**, **Variant ID**,
   **API key** (Settings → API), and create a **Webhook**:
   - URL: `https://www.yodoku.app/api/lemonsqueezy-webhook`
   - Events: `subscription_created`, `subscription_updated`, `subscription_cancelled`,
     `subscription_expired`, `subscription_resumed`
   - Copy the **signing secret**.
5. In **test mode**, run one test purchase yourself → I confirm the webhook received and logged it.

## 5. Google Play Console — the Android app ($25 · ~1 hour + verification + a 14-day test gate)

**⚡ PROGRESS (4 Oct 2026, agent-assisted):**
- Developer account **CREATED**: **Personal** account, developer name **Yordan Creatives**, account ID **`5115309915099098890`**, owner `ver.iamyo94@gmail.com`, address Amstelveen NL, website yodoku.app. **$25 registration PAID** (Revolut Mastercard ••5314).
- Signup completed together: account type, identity documents (submitted), payments profile, public profile, "About you" (experience text + website yodoku.app + no other accounts), "Apps" (2–5 apps; earning: In-app purchases + Subscriptions; no special categories), Terms accepted.
- **CURRENT STATE — WAITING ON GOOGLE:** identity documents in review ("To publish apps, finish setting up your developer account"). `Create app` is **locked** until this clears. Contact phone **+31628849735** entered; **phone verification (SMS/call) only unlocks AFTER the ID approval** — then it's a 1-minute user step.
- **WHEN APPROVED (usually 1–2 business days):** user verifies phone → agent takes over: create app **Yodoku** (package `app.yodoku`), upload the signed AAB, fill listing (texts in §5a, screenshots + feature graphic in `docs/play-store/`), content rating (§5b), data safety (§5c), then set up the **closed test** → needs **12+ tester emails** from the user → **14 continuous days** → apply for production access.
- Prep while waiting: collect the 12+ tester email addresses.
- **Android app-shell fixes (4 Oct, before first upload):** `viewport-fit=cover` + safe-area insets so Android 15 edge-to-edge doesn't clip the sticky nav bars / home masthead (`header.sticky` rule in `index.css`; masthead padded inline); the Lemon Squeezy checkout button is now hidden **inside the native app** (`isNativeApp()` in `src/utils/platform.ts`; /plus shows "coming to Google Play" instead — Play policy: digital subs must use Play Billing); external links (WhatsApp share etc.) open in the system browser in the native app (`ExternalLinks` listener in `App.tsx`); removed the dead AdMob test meta-data from `AndroidManifest.xml`. Sign the next AAB with `bash scripts/build-android.sh`.
- **Still NOT done in the Android shell (candidates, not blockers):** in-app magic-link return (email link opens the browser, not the app — needs a deep link / App Link); status-bar icon styling; bottom gesture-bar inset for last-row content.

1. https://play.google.com/console/signup → **Personal** account → pay **$25** (normal card — prepaid
   cards are refused) → upload government ID → verify email/phone → install the **Play Console app on
   your phone** and verify the device.
2. Create the **Google Payments merchant profile**: IBAN + Bulgarian tax details.
3. **Create app**: name **Yodoku**, English, type **App**, **Free**.
   Package name (permanent, cannot ever change): **app.yodoku**.
4. **Upload the AAB**: `android/app/build/outputs/bundle/release/app-release.aab`, accept **Play App
   Signing** (our keystore stays the *upload key*).
5. **Store listing**: paste §5a text; upload the 8 screenshots + feature graphic from `docs/play-store/`.
   Privacy policy URL: `https://www.yodoku.app/privacy`.
6. **Content rating** → answers in §5b. **Data safety** → answers in §5c. **Target audience**: 13+.
7. **Closed testing** (this is the launch gate): create a **closed track**, upload the AAB, add
   **12+ testers** (friend/colleague emails). They install via the link and must **stay opted in for
   14 continuous days**. Then **apply for production access** from the dashboard.
8. Subscriptions (Play billing): create later, once §6 exists — I will give you the exact product IDs.

Note (handled on my side): Google forbids selling digital subscriptions through an external payment
link inside an Android app. So in the Android build the Lemon Squeezy checkout button will be replaced
by the "already subscribed? sign in" path, and Play subscriptions will run through Play Billing
(RevenueCat). The web version keeps the Lemon Squeezy checkout.

### 5a. Listing copy (copy-paste)

**App name:** Yodoku

**Short description (≤80 chars):**
Seven daily word & logic games. One minute each. Free forever.

**Full description:**
Seven daily games. One minute each. Free forever.

Yodoku is a daily puzzle pack: seven small games, each playable in about a minute, one fresh
puzzle per day — the same puzzle for everyone.

- Clear the String — find the answer words hidden inside a scrambled string and clear every letter.
- Change by One — turn one word into another, one letter at a time.
- Word Pool — name every word you can in a category; each round narrows the constraint.
- ORDERLE — put five things in the right order, then learn why the order matters.
- FERMI — guess the real-world number and calibrate your intuition.
- Quiz Master — ten questions a day across eleven categories.
- 7 Letters — seven letters, one centre; build words and chase the pangram.

Why people stick with it:
- No signup. Open it and play.
- No streaks, no points, no guilt trips — just a good minute a day.
- Past puzzles stay available.
- Share your result as a clean card — no spoilers.

Built by Yordan Creatives.

### 5b. Content rating (the shape of the answers)
Category: **Game → Puzzle**. Violence / sexuality / language / substances / gambling: **No**.
Real-money gambling: **No** (Yodoku+ is a subscription; nothing is wagered). Users interact: basic
sharing of your own scores only. Location sharing: **No**. Digital purchases: **Yes** once Play billing
is added — **No** for the first release.

### 5c. Data safety (the shape of the answers)
- Data collected: **Email address** — only if the user voluntarily types it into the newsletter form.
  Purpose: newsletter (app functionality / marketing), not shared with third parties, encrypted in transit.
- **No** location, no contacts, no photos, no health data, no in-app activity profiling; no ads SDK in
  the Android build today.
- Data deletion: unsubscribe link in every email + contact address `hello@yodoku.app`.

## 6. RevenueCat — Android subscriptions (~15 min, after §5)

1. https://app.revenuecat.com/signup → project **Yodoku**.
2. Play Console → **Setup → API access** → create a **service account** (grant financial + app-level
   permissions) → download the JSON key → upload it in RevenueCat's Play Store integration.
3. Play Console → **Monetise → Products → Subscriptions** → create `yodoku_plus_monthly` /
   `yodoku_plus_yearly` → add the same IDs in RevenueCat as products; create entitlement **plus**;
   attach the products to it.
4. Copy the **RevenueCat public SDK key (Android)** + entitlement id → hand them to me.

## 7. Vercel — environment variables (~10 min)

Vercel → project **yodoku** → Settings → Environment Variables → add each for **Production**,
then trigger a **Redeploy** (env changes only apply on the next build):

| Name | Status | Exposure |
|---|---|---|
| `VITE_NEWSLETTER_ENABLED` | ✅ set (4 Oct) | public (shows the signup form) |
| `BREVO_API_KEY` | ✅ set (4 Oct) | secret |
| `BREVO_LIST_ID` | ✅ set (4 Oct, value `3`) | secret |
| `VITE_CHECKOUT_URL` | ✅ set (4 Oct) | public |
| `LS_WEBHOOK_SECRET` | ✅ set (4 Oct; 40-char LS cap) | secret |
| `SUPABASE_URL` | ✅ set (4 Oct) | server |
| `SUPABASE_SERVICE_KEY` | ✅ set (4 Oct; saved as Config — flip to Secret any time) | server secret |
| `VITE_SUPABASE_URL` | ✅ set (4 Oct) | public |
| `VITE_SUPABASE_ANON_KEY` | ✅ set (4 Oct, publishable key) | public |

Note: Vercel requires **`VITE_`-prefixed vars to be type Config** (it rejects Secret for public framework
prefixes). Multi-variable `.env` text can be pasted straight into the Add-Environment-Variable modal's
**Key** field. After any env change, **redeploy with "Use existing Build Cache" UNCHECKED**. Vercel
project slug is `gamehub` (the repo is `yodoku`) — URL: `/yordan-s-projects-5f63c0d5/gamehub/settings/environment-variables`.

(If you ever prefer Resend over Brevo: `RESEND_API_KEY` + `RESEND_AUDIENCE_ID` instead of the two
BREVO_ ones.)

## 8. Then tell me — I finish everything else

- Real end-to-end test: signup → contact appears in Brevo → first newsletter sent to you; cron resumed.
- Lemon Squeezy test purchase → entitlement written; `/plus` "sign in" flow wired to Supabase.
- Android: swap external checkout for Play-Billing path, rebuild + hand you the fresh AAB.
- Flip Yodoku+ live for users — one-line change, only when you say go.

## 9. Native shell pass — DONE & merged (5 Oct)

- PR #1 (magic-link fix) + PR #2 (feat/native-shell-pass) merged to main; Vercel auto-deployed.
- Features live in the app: ad-free app always; ad-free for Yodoku+ web subscribers; daily reminder
  notification (local, opt-in); status bar theming; Android back-button UX (double-press exit);
  native share sheet; haptic taps; phone-viewport fixes (390/360/320 — 96/96 checks pass).
- Live verification: free web keeps the Monetag tag; `?native=1` / `?plus=1` withhold it; 0 JS errors.
- Fresh signed AAB/APK built (12.6M / 12.8M, versionCode 1). Go-live sequence in `docs/GO-LIVE-RUNBOOK.md`.
- **LS store activation pending their review** → payments switch waits on Lemon Squeezy email.
