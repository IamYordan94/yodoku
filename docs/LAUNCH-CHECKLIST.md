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
- **Newsletter built & tested**: signup form + `/api/subscribe` endpoint (13/13 tests), daily composer, paused 08:30 cron — dormant until §1 exists.

---

## Where your DNS lives (important for §1 and §2)

`yodoku.app` uses **Cloudflare** nameservers. All email records (Brevo DKIM/SPF/DMARC, email forwarding)
are added in **Cloudflare dashboard → yodoku.app → DNS**. There is currently **no mailbox** on the
domain (no MX records), so `hello@yodoku.app` cannot receive mail yet.

---

## 1. Brevo — newsletter + login emails (~15 min)

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

**What I do after:** resume the 08:30 daily cron, send a real signup + a real test email end-to-end.

## 2. hello@yodoku.app — receive and reply — ✅ DONE

**Done 4 Oct 2026 (agent-assisted, via the live Chrome session):**
- Cloudflare **Email Routing enabled** for `yodoku.app` — MX records `route1/2/3.mx.cloudflare.net` + SPF TXT are live in DNS (verified externally).
- Routing rule **`hello@yodoku.app → ver.iamyo94@gmail.com`** created and **Active** (verified in the Routing rules table).

Note: the old stray *Pending* entry for `hello@yodoku.app` under **Destination addresses** is harmless junk (it was added as a destination by mistake). Delete it whenever from that tab's row menu (⋯ → Delete) — **do not** delete `ver.iamyo94@gmail.com` there, that’s the real, verified destination.

Brevo's domain authentication also came through — verified externally: `brevo-code` TXT, DKIM (`brevo1/brevo2._domainkey` CNAMEs) and DMARC are all live.

## 3. Supabase — user accounts / logins (~15 min)

1. https://supabase.com/dashboard/sign-up → create project, region **Frankfurt (EU)**.
2. **Authentication → Sign In / Providers → Email** → enable **Magic Link**.
3. **Authentication → Settings → SMTP** → custom SMTP → paste the **Brevo SMTP** values from §1.5
   → then raise the email rate limit (default is low).
4. **Authentication → URL Configuration → Redirect URLs** → add `https://www.yodoku.app/**`.
5. **Settings → API** → copy three values: **Project URL**, **anon public key**, **service_role key**
   (the last one is a real secret — it goes into Vercel in §7 only, never into chat).
6. When the project exists, I give you a small SQL snippet to paste into the **SQL Editor**
   (it creates the `entitlements` table the webhook writes to).

## 4. Lemon Squeezy — web subscriptions (~30 min + 2–3 days for ID verification)

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

| Name | Value from | Exposure |
|---|---|---|
| `VITE_NEWSLETTER_ENABLED` | `true` | public (shows the signup form) |
| `BREVO_API_KEY` | §1.5 | secret |
| `BREVO_LIST_ID` | §1.4 | secret |
| `VITE_CHECKOUT_URL` | §4.4 Lemon Squeezy checkout URL | public |
| `LS_WEBHOOK_SECRET` | §4.4 signing secret | secret |
| `SUPABASE_URL` | §3.5 | server |
| `SUPABASE_SERVICE_KEY` | §3.5 service_role key | **secret** |
| `VITE_SUPABASE_URL` | §3.5 | public |
| `VITE_SUPABASE_ANON_KEY` | §3.5 | public |

(If you ever prefer Resend over Brevo: `RESEND_API_KEY` + `RESEND_AUDIENCE_ID` instead of the two
BREVO_ ones.)

## 8. Then tell me — I finish everything else

- Real end-to-end test: signup → contact appears in Brevo → first newsletter sent to you; cron resumed.
- Lemon Squeezy test purchase → entitlement written; `/plus` "sign in" flow wired to Supabase.
- Android: swap external checkout for Play-Billing path, rebuild + hand you the fresh AAB.
- Flip Yodoku+ live for users — one-line change, only when you say go.
