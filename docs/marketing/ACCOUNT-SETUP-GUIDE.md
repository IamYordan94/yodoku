# Yodoku — Account Setup Guide

**Owner:** Yordan (solo operator, based in **Bulgaria**, non-developer)
**Brand:** Yordan Creatives · **Product:** Yodoku (https://www.yodoku.app) · **Price:** €19.99 / year subscription
**Site:** React/Vite static site on Vercel · **Audience:** global, English-speaking
**Guide written:** 3 October 2026 · **Status:** due diligence ONLY — do **not** register/sign up for anything yet.

> **How to read this:** every section has a **"Yordan does"** block (things only the human account owner can legally do: opening accounts, paying fees, uploading ID, connecting a bank) and a **"The build needs"** block (API keys / IDs / config values to hand to the developer agent). Facts are cited with source URLs at the end of each section.

---

## 0. Verdict at a glance

| Provider | Role | Bulgaria OK? | 2026 cost | Free-tier / integration catch |
|---|---|---|---|---|
| **Lemon Squeezy** (primary MoR) | Web subscriptions | ✅ Bank payouts to Bulgaria supported | 5% + 50¢ + surcharges (see §1) | Hosted checkout needs **no backend**; webhooks need an HTTPS endpoint (Vercel function is fine) |
| **Paddle** (backup MoR) | Web subscriptions | ✅ Not on the unsupported list | 5% + 50¢ | Monthly payout only; min $100; ID verification via Sumsub |
| **Brevo** (newsletter — primary pick) | Newsletter + Supabase SMTP | ✅ | Free $0 | **300 emails/day** (≈9,000/mo), up to 100,000 contacts; **REST API on every plan incl. Free** ✅. Doubles as Supabase's custom SMTP. French/EU (GDPR-friendly) |
| **Resend** (newsletter — alternative) | Newsletter + Supabase SMTP | ✅ | Free $0 | **3,000 emails/mo, 100/day**, 3 domains, DKIM/SPF/DMARC; Audiences + Broadcasts API on free (marketing sends have their own quota, separate from the 3,000 transactional) |
| **Supabase** | User accounts (magic-link) | ✅ | Free $0 | ❗ Built-in email = **2 emails/hour** and team-only. Must add custom SMTP |
| **RevenueCat** | Android IAP plumbing | ✅ (anything Google Play supports) | Free ≤ $2,500 MTR/mo, then 1% | Doesn't pay you — Google does |
| **Google Play Console** | Android app + IAP | ✅ **Developer + Merchant registration supported; currency EUR** | $25 one-time | ❗ New personal accounts must run a **closed test (12 testers, 14 continuous days)** before production; ID + device verification |

**Bottom line:** the stack is viable for a Bulgaria-based individual in 2026, with two hard corrections —
1. **Newsletter sending is free** — **Brevo or Resend** (decided 2026-10-03; both send via API on their free tiers, no need for a paid mailer tier).
2. **Supabase's free email service is unusable for real users** (2/hour, team-only) → you must configure custom SMTP.
Plus the known Google Play tax: a **12-tester / 14-day closed test** before you can go to production with a new personal account.

---

## 1. Lemon Squeezy (primary merchant of record)

### 1a. Is Bulgaria supported for sellers/payouts? — ✅ YES (verified)

Lemon Squeezy lists **Bulgaria** explicitly in its **bank-payout** supported countries. You can sell on Lemon Squeezy if you can be paid into a bank **or** PayPal account in a supported country. ([Supported Countries](https://docs.lemonsqueezy.com/help/getting-started/supported-countries))

- **Bank payouts** → Stripe; made in **USD** and auto-converted to your local currency (BGN/EUR) at the mid-market rate at payout time.
- **PayPal payouts** → always in **USD** (PayPal may then charge you to convert/withdraw).

### 1b. What Yordan must provide
- Legal name, email, country (Bulgaria), a short business/customer questionnaire.
- **Government-issued photo ID** — the store starts in *test mode*; you click **Activate your store**, fill a questionnaire, then **Verify your identity** by uploading a photo of your government-issued ID. Approval typically **2–3 business days**.
- Payout method: **bank (IBAN)** or **verified PayPal**.

### 1c. 2026 fees — platform fee is 5% + 50¢, plus surcharges
| Fee | Amount |
|---|---|
| Platform fee (card) | **5% + $0.50** per transaction, all-in (covers card processing, tax/VAT compliance, fraud) |
| International buyer (outside US) | **+1.5%** |
| PayPal payments | **+1.5%** |
| **Subscription** payments | **+0.5%** |
| Payout fee — Stripe bank, non-US | **1%** per payout |
| Payout fee — PayPal, non-US | **3%, capped at $30** per payout |

Worked examples on a **€19.99/yr** subscription (Yodoku is a subscription, sold globally, mostly non-US):
- Best case (US card customer): **$1.50** fee → you net ≈ **€18.49**
- Worst case (non-US card + subscription): **≈€1.90** → you net ≈ **€18.09** (VAT is additionally handled/remitted by Lemon Squeezy as MoR)

To **net €19.99** after the worst-case subscription fee you'd need to price ≈ **€22.03**. ([Fees](https://docs.lemonsqueezy.com/help/getting-started/fees) · [Pricing](https://www.lemonsqueezy.com/pricing))

### 1d. Payout minimums / currency gotchas
- **Minimum payout threshold: $50.** Below it, the payout stays "Pending" and rolls to the next cycle.
- Payouts created on the **1st and 15th**, with a **13-day hold**, then paid out **on the 14th and 28th**; 1–5 business days to land. ([Getting Paid](https://docs.lemonsqueezy.com/help/getting-started/getting-paid))
- Bank payouts settle in **USD** → converted to BGN/EUR, so you carry FX risk and a ~1% payout fee.

### 1e. Integration route for a static site — ✅ works with NO backend for checkout
- **Hosted checkout / shareable checkout links** → zero backend. Drop a link/button on the Vite site and Lemon Squeezy hosts the payment page.
- **Lemon.js overlay checkout** → also client-side, embeds a checkout overlay on the static page.
- **Webhooks** → need an **HTTPS receiver endpoint** that returns `HTTP 200`. On a static Vercel site you add a small **serverless function** (e.g. `/api/webhooks`) — no server to run, but *a receiver must exist*. If you skip webhooks entirely, the hosted checkout still sells fine; you just won't get programmatic "subscription_created / cancelled" events. Events include `order_created`, `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`, etc. ([Webhooks](https://docs.lemonsqueezy.com/help/webhooks) · [Developer webhooks](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks))
- Note: Lemon Squeezy is now a **Stripe company** ("Stripe Managed Payments" 2026 update) — expect continued Stripe-backed payouts. ([2026 Update](https://www.lemonsqueezy.com/blog/2026-update))

**Exact signup URL:** https://app.lemonsqueezy.com/register

**Yordan does:**
1. Open https://app.lemonsqueezy.com/register and create the account (email or Google).
2. Click **Activate your store** → answer the questionnaire honestly; **Verify identity** (photo of government ID); wait 2–3 business days.
3. **Settings → Payouts**: connect bank (IBAN) or verified PayPal.
4. **Settings → API**: create an API key; **Settings → Webhooks**: create webhook(s) with a signing secret. **Settings → Stores / Products**: create the Yodoku product + variant.
5. Copy out: store ID, product ID, variant ID, checkout URL, API key, webhook signing secret.

**The build needs (keys/IDs for the developer agent):**
- `LEMONSQUEEZY_API_KEY` (server-side only — never in the static bundle)
- `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_PRODUCT_ID`, `LEMONSQUEEZY_VARIANT_ID`
- Hosted **checkout URL** (safe to expose in the front-end)
- `LEMONSQUEEZY_WEBHOOK_SECRET` (validate signatures on `/api/webhooks`)
- The **checkout custom data** field can carry your Supabase `user_id` so webhooks can map a purchase to a user.

---

## 2. Paddle (backup merchant of record)

### 2a. Is Bulgaria supported for sellers/payouts? — ✅ YES (verified)
Paddle "works with software businesses anywhere in the world **except** the unsupported countries listed" — **Bulgaria is NOT on the unsupported list**, so it is supported. Paddle's own supported-locales table lists **BG · Bulgaria · EUR**. ([Unsupported countries](https://www.paddle.com/help/legal/sanctions/which-countries-are-supported-by-paddle) · [Supported countries (dev docs)](https://developer.paddle.com/concepts/sell/supported-countries-locales))

### 2b. What Yordan must provide
Account verification has **three** parts ([Setup checklist](https://developer.paddle.com/build/set-up-checklist)):
1. **Domain review** — add `yodoku.app` under *Settings → Website approval* and get it approved (Paddle must see you own the site you sell on).
2. **Business identification** — **not required for individuals/sole traders** (only registered companies upload company documents / ≥25% ownership docs). ([Business Identification](https://www.paddle.com/help/start/account-verification/what-is-business-verification))
3. **Identity verification** — as an individual/sole trader, **Yordan himself** verifies: government-issued ID + proof of address, sometimes a **liveness selfie**, via **Sumsub**. Typically instant; manual review 1–3 business days. ([Identity Verification](https://www.paddle.com/help/start/account-verification/what-is-identity-verification))
- Paddle requires a **website** and that payments come only through your website/app — you may **not** email buyers a raw checkout link. ([Seller handbook](https://www.paddle.com/seller-guides/seller-handbook))

### 2c. 2026 fees
- **5% + $0.50 per checkout transaction**, all-inclusive (card processing, global tax/VAT, billing, fraud, chargebacks). No monthly fee. Custom pricing only for very small (< $10) or high-volume sellers. ([Pricing](https://www.paddle.com/pricing) · [Fee calc, updated Sep 2026](https://fees.tools/paddle-fee-calculator))
- On €19.99 → **$1.50** → net ≈ **€18.49** (before any payout currency conversion).

### 2d. Payout minimums / currency gotchas
- **Monthly payout only** (no on-demand withdrawal). Balance over your threshold (min **$100**, or **€100** if your balance currency is EUR) converts to a payout on the **1st**; Paddle pays by the **15th**; +up to 3 working days.
- Paid by **wire transfer or Payoneer**. Most countries: no payout fee; **some countries incur a $15 SWIFT fee**; your bank may add charges. ([When and how do I get paid?](https://www.paddle.com/help/manage/get-paid/when-and-how-do-i-get-paid))
- EUR balance is possible, which suits a Bulgaria/EU seller — but the $100 threshold is higher than Lemon Squeezy's $50.

### 2e. Integration route for a static site
- **Paddle.js overlay or inline checkout** uses a **client-side token** → fits a static Vite site with a handful of lines of code. Sandbox first, then swap token + remove `Paddle.Environment.set('sandbox')` for live.
- **Webhooks / event stream** for subscription lifecycle (new, cancel, pause/resume, payment update, upgrade/downgrade) need a **receiver endpoint** — same Vercel serverless-function approach as Lemon Squeezy. ([Paddle Checkout](https://developer.paddle.com/concepts/sell/self-serve-checkout) · [Paddle.js](https://developer.paddle.com/paddle-js/))

**Exact signup URLs:** live → https://vendors.paddle.com/signup · sandbox → https://sandbox-vendors.paddle.com/signup

**Yordan does:** create the account; complete domain + identity verification; set balance currency; create product + subscription price; create a client-side token; copy API key + notification (webhook) secret.

**The build needs:** Paddle **client-side token** (front-end), `PADDLE_API_KEY` (server-side), `PADDLE_WEBHOOK_SECRET`, and the **price ID**.

---

## 3. Newsletter — Brevo or Resend (decided 2026-10-03)

### 3a. The decision
**DECIDED 4 Oct 2026: the existing Brevo account.** One account for all products, with a dedicated **API key**, **SMTP key** and contact **list** for Yodoku — Brevo's own recommendation for multiple apps (sub-accounts/subreports are Enterprise-only and not needed). Brevo's quota page shows no domain cap on Free (300 sends/day, 100k contacts, 300 lists, max 3 accounts per company), so `yodoku.app` is simply added as an extra authenticated domain. Resend stays documented as the fallback; the build supports either.

Why not the earlier candidates: **Beehiiv's free plan cannot send email via API** (the Send API is Pro/Enterprise only — verified) and **MailerLite is out** because Yordan prefers providers he already knows.

### 3b. Brevo — what the free plan actually gives
- **300 emails/day** (≈ 9,000/month), storage for up to **100,000 contacts**; unused daily sends do not roll over.
- **REST API + SMTP on every plan, including Free** — this is the important one: the marketing Campaigns API *and* the transactional API work on $0.
- **Doubles as Supabase's custom SMTP** (§4) — one account covers login emails *and* the newsletter.
- EU-based (France) — friendly for GDPR and for a Bulgaria-based operator.
- Signup: https://onboarding.brevo.com/account/register · API key: *Settings → SMTP & API → API Keys* · list ID: *Contacts → Lists* (the number in the list's URL).
- Sources: [Email API](https://www.brevo.com/features/email-api/) · [Free-plan limits FAQ](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan) · [Pricing](https://www.brevo.com/pricing/) · [Developer docs](https://developers.brevo.com/)

### 3c. Resend — what the free plan actually gives
- **3,000 emails/month with a 100 emails/day cap** on the Free plan, **3 custom domains**, 30-day data retention, DKIM/SPF/DMARC setup included.
- **Audiences + Broadcasts on the free tier**: the newsletter send is a *broadcast*, and broadcasts are counted against the marketing quota — **separate from the 3,000 transactional emails** (verified on Resend's own pricing page FAQ).
- Nice DX (modern API, good logs) but it does **not** includes a contact-list editor as rich as Brevo's; you manage contacts through the Audiences API/dashboard.
- Signup: https://resend.com/signup · API key: *API Keys → Create* · audience ID: *Audiences* (copy the `aud_...` id).
- Sources: [Pricing](https://resend.com/pricing) · [Docs](https://resend.com/docs/introduction)

### 3d. What is already built (no account needed to have it ready)
| Piece | Where it lives | State |
|---|---|---|
| **Signup endpoint** | `api/subscribe.js` (Vercel edge function) | ✅ built — **13/13 local tests pass** (Brevo path, Resend path, invalid email → 400, honeypot → silently ignored, provider failure → 502, unconfigured → 503) |
| **Signup form** | `src/components/NewsletterSignup.tsx`, mounted on the hub above the footer | ✅ built — renders **only** when `VITE_NEWSLETTER_ENABLED=true`, so visitors never see a dead form; sticker-styled, one field, graceful error states |
| **Daily sender + composer** | `yodoku-newsletter.py` (Hermes script) | ✅ built — composes the "seven fresh puzzles" email in English, sends via Brevo campaign API or Resend broadcast API, dry-runs (writes a preview) when no key is set |
| **Daily cron** | Hermes job **`Yodoku daily newsletter`** (08:30) | ⏸ **paused** — resumes the moment a key is set |

### 3e. What switching it on takes (5 minutes, once the account exists)
1. In your **existing Brevo account**: *Senders, Domains & Dedicated IPs → Domains → Add a domain* → `yodoku.app` → add the SPF/DKIM/DMARC records it shows in **Cloudflare** → wait for *Authenticated*.
2. Create the list/audience (e.g. "Yodoku Daily") → copy its ID.
3. Create an API key.
4. Set these in **Vercel → Settings → Environment Variables** (server-side):
   - Brevo: `BREVO_API_KEY`, `BREVO_LIST_ID`
   - or Resend: `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`
   and one public flag so the form appears: **`VITE_NEWSLETTER_ENABLED=true`**.
5. Tell the agent → the cron is resumed. From then on the email composes and sends itself every morning at 08:30.

### 3f. GDPR note (EU operator, EU subscribers)
Consent must be *explicit and provable*. Recommended: enable **double opt-in** in Brevo (*Settings → Double opt-in*) so every signup gets a confirmation email before it counts — that also protects sender reputation against typo'd addresses. The form's copy states exactly what the subscriber gets ("one email a morning — seven puzzles, no spam, unsubscribe in one click"), and every send carries a one-click unsubscribe.

**The build needs:** `BREVO_API_KEY` + `BREVO_LIST_ID` *(or* `RESEND_API_KEY` + `RESEND_AUDIENCE_ID`*)*, an approved sending domain (`yodoku.app` / `news@yodoku.app`), and `VITE_NEWSLETTER_ENABLED=true`.

---

## 4. Supabase (user accounts, magic-link email auth)

### 4a. Free-tier limits
Free plan: **50,000 monthly active users**, 500 MB database, 5 GB egress, 1 GB file storage, **unlimited API requests**, up to **2 active projects**, community support. **Free projects are paused after 1 week of inactivity** (a real risk for a low-traffic app — keep it active or upgrade to Pro $25/mo). ([Supabase pricing](https://supabase.com/pricing))

### 4b. ❗ Magic-link auth: the built-in email service will NOT work for real users
- The built-in email provider sends only **2 emails per hour**, is **best-effort with no SLA**, and **only delivers to addresses already on your project's team** — every other address fails with *"Email address not authorized."* It is explicitly "not meant for production use." (`https://supabase.com/docs/guides/auth/auth-smtp`)
- **Fix:** configure a **custom SMTP** provider in *Authentication → Settings → SMTP* (Supabase lists **Brevo**, Resend, AWS SES, Postmark, SendGrid, ZeptoMail). After you set custom SMTP, sending opens up to **all addresses** with a default **30 emails/hour** limit, which you can raise under *Authentication → Rate Limits*. ([Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) · [Rate limits](https://supabase.com/docs/guides/auth/rate-limits))
- Practical consequence: the "free newsletter Brevo account" can double as Supabase's SMTP sender, and the 30/hr cap should be raised before launch.

**Exact signup URL:** https://supabase.com/dashboard/sign-up

**Yordan does:** create the project (choose an EU region — e.g. Frankfurt — for GDPR/latency since you're in Bulgaria); enable Email → Magic Link; connect **custom SMTP** (paste host/port/user/password from Brevo); raise the email rate limit; copy keys.

**The build needs:** `SUPABASE_URL`, `SUPABASE_ANON_KEY` (safe for the static front-end), `SUPABASE_SERVICE_KEY` (**server-side only** — used by the webhook to grant/revoke Pro access), and the redirect URL whitelist for magic links (add `https://www.yodoku.app/**`).

---

## 5. RevenueCat (Android in-app subscriptions)

### 5a. Free-tier limits
- **Free up to $2,500 in Monthly Tracked Revenue (MTR)**; above that you pay **1% of MTR**. No credit card to start. MTR is measured **before** store commission and taxes. ([Pricing](https://www.revenuecat.com/pricing) · [MTR docs](https://www.revenuecat.com/docs/welcome/set-up-revenuecat/account-management))
- RevenueCat **does not pay you** — Google Play (via your Google Payments profile) handles payouts. RevenueCat just unifies purchases, entitlements and webhooks.
- Country: RevenueCat works wherever the underlying store (Google Play) works — **Bulgaria is fine**. ([RevenueCat community](https://community.revenuecat.com/featured-articles-55/is-revenuecat-supported-in-my-country-5422))
- At €19.99 through Google Play, Google takes **15%** (→ ≈ **€16.99** net to the payments profile), and RevenueCat's 1% only kicks in above $2,500/mo MTR.

**Exact signup URL:** https://app.revenuecat.com/signup

**Yordan does:** create the RevenueCat project; connect the **Google Play service account** (a JSON credential created in Google Cloud / Play Console); create Products + Entitlements mirroring the Play subscription.

**The build needs:** the RevenueCat **public SDK key** (Android), the **Entitlement identifier**, and (optional) the RevenueCat **webhook** auth header so your Vercel function can sync entitlement → Supabase.

---

## 6. Google Play Console (Android app + IAP)

### 6a. Can an individual in Bulgaria register AND sell subscriptions? — ✅ YES
Google's own registration table lists **Bulgaria: Developer registration ✔ / Merchant registration ✔ / default developer currency EUR.** Merchant registration is what lets you **sell paid apps and subscriptions**. ([Supported locations for developer and merchant registration](https://support.google.com/googleplay/android-developer/answer/9306917))

### 6b. What Yordan must provide (new INDIVIDUAL account, 2026)
- **Age ≥ 18** and a Google account.
- **US$25 one-time registration fee** (MasterCard/Visa/AmEx; Visa Electron outside the US; **prepaid cards not accepted**). No annual renewal. ([Get started with Play Console](https://support.google.com/googleplay/android-developer/answer/6112435))
- **Identity verification for personal accounts:** an **official government identity document**. (No D-U-N-S number — that's only for *organization* accounts.) You must link a **Google Payments profile**; you may be asked for a **valid government ID and a credit card, both under your legal name** — if invalid, the fee is **not refunded**. ([Verify your developer identity](https://support.google.com/googleplay/android-developer/answer/10841920))
- **Developer email + phone number** verification (phone must be in international format).
- **Device verification:** new personal accounts must verify access to an **Android device via the Play Console mobile app** before the app can go live.
- Accept the **Google Play Developer Distribution Agreement**.

### 6c. ❗ Closed-testing requirement for new personal accounts (the big one)
Personal accounts **created after 13 Nov 2023** cannot publish directly to production. They must first:
- Run a **closed test** with a **minimum of 12 testers** who are **opted in continuously for at least 14 days**;
- Then **apply for production access** from the Dashboard (answering questions about your testing, app and readiness). **Production and Pre-registration stay disabled until this is met.**
> ⚠️ Some third-party blogs still quote **20 testers** — Google's current official help page says **12**. Budget for **12+ testers, 2+ weeks of continuous opt-in** (recruit friends/colleagues; each tester stays opted in the whole time). ([App testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465))
- Also note the **separate** "Android developer verification" program taking effect **30 Sept 2026** (starting Brazil, Indonesia, Singapore, Thailand): it requires package-name registration for apps; **Play-distributed apps auto-register (~99%)**, so for a normal Play release it's largely automatic — don't confuse it with the closed-testing rule. ([Android developer verification](https://developer.android.com/developer-verification))

### 6d. Payouts
- Payouts run through your **Google Payments** merchant profile. Official help states the earned balance must reach the **US$100 minimum payout** at the end of the payment cycle; payouts are processed **monthly** (typically the 15th–21st for the prior month). ([Receiving payments from Google](https://support.google.com/googleplay/android-developer/answer/2700656))

**Exact signup URL:** https://play.google.com/apps/publish/signup (also reachable via https://play.google.com/console/signup)

**Yordan does:** pay the $25; choose **Personal** account type; upload government ID; complete email/phone/device verification; set up the Google Payments merchant profile with IBAN + Bulgarian tax details; accept the DDA; eventually create the Play **service account** credential for RevenueCat; run the 12-tester closed test.

**The build needs:** the app's **package name** (e.g. `app.yodoku`) — permanent, never changeable; a **keystore / upload key**; the **Play service-account JSON** (given to RevenueCat); the **license-tester** emails for the closed test.

---

## 7. Payout minimums & currency gotchas — quick reference

| Channel | Payout method | Currency | Minimum | Cadence | Fee |
|---|---|---|---|---|---|
| Lemon Squeezy | Bank (Stripe) | Settled USD → local | **$50** | Paid 14th & 28th | 1% (non-US bank) |
| Lemon Squeezy | PayPal | USD only | $50 | Paid 14th & 28th | 3% (cap $30) |
| Paddle | Wire / Payoneer | balance currency (EUR ok) | **$100 / €100** | Monthly (by the 15th) | $15 SWIFT for some countries |
| Google Play | Google Payments | EUR | **$100** | Monthly | — |
| RevenueCat | n/a (tracks only) | — | — | — | 1% of MTR over $2,500/mo |

**Currency gotchas:** Lemon Squeezy always settles in **USD** (you eat FX on the way to BGN/EUR). Payoneer/wire for Paddle may add SWIFT/bank charges. Bulgarian tax: you'll invoice/report as a self-employed/individual seller; Lemon Squeezy and Paddle provide **"reverse invoices"** for payouts, and both are the **merchant of record**, so they remit VAT — keep those statements for your Bulgarian tax filing.

---

## 8. Consolidated "keys/IDs the developer agent needs"

| From | Value | Sensitivity |
|---|---|---|
| Lemon Squeezy | `API_KEY`, `STORE_ID`, `PRODUCT_ID`, `VARIANT_ID`, `WEBHOOK_SECRET`, hosted `CHECKOUT_URL` | API key + secret server-side only |
| Paddle | `CLIENT_TOKEN` (front-end), `API_KEY` (server), `WEBHOOK_SECRET`, `PRICE_ID` | key/secret server-side only |
| Newsletter (Brevo **or** Resend) | `BREVO_API_KEY` + `BREVO_LIST_ID` *or* `RESEND_API_KEY` + `RESEND_AUDIENCE_ID`; verified sending domain | server-side only |
| Supabase | `SUPABASE_URL`, `ANON_KEY` (front-end), `SERVICE_ROLE_KEY` (server), SMTP creds | service key + SMTP server-side only |
| RevenueCat | Android `PUBLIC_SDK_KEY`, `ENTITLEMENT_ID`, webhook auth | public key safe front-end |
| Google Play | package name, keystore, service-account JSON, license-tester emails | JSON + keystore secret |

> **Rule:** only the Supabase `ANON_KEY`, the Paddle client token, the RevenueCat public SDK key, the Lemon Squeezy checkout URL and the app package name are safe to ship in the static front-end. Everything else lives in Vercel environment variables / serverless functions.

---

## 9. Recommended order of operations (once Yordan decides to proceed)
1. **Supabase** (free) — fastest to stand up; gives user accounts.
2. **Brevo** (free) — newsletter sender **and** Supabase custom SMTP in one account.
3. **Lemon Squeezy** — signup → activate store → connect bank → create product/variant → API key + webhook.
4. Wire the static site: hosted checkout button + `/api/webhooks` Vercel function → write subscription status into Supabase.
5. **Google Play Console** ($25) → personal account + ID + device verification → build app → connect **RevenueCat**.
6. Start the **12-tester / 14-day closed test** early (it gates production).
7. *Contingency:* if Lemon Squeezy rejects the store, fall back to **Paddle** (same 5% + 50¢).

---

## 10. Source URLs (all verified October 2026)

**Lemon Squeezy**
- Supported countries: https://docs.lemonsqueezy.com/help/getting-started/supported-countries
- Getting paid / threshold / schedule: https://docs.lemonsqueezy.com/help/getting-started/getting-paid
- Fees: https://docs.lemonsqueezy.com/help/getting-started/fees
- Merchant of record: https://docs.lemonsqueezy.com/help/payments/merchant-of-record
- Activate your store: https://docs.lemonsqueezy.com/help/getting-started/activate-your-store
- Verify your identity: https://docs.lemonsqueezy.com/help/getting-started/verify-your-identity
- Webhooks: https://docs.lemonsqueezy.com/help/webhooks · https://docs.lemonsqueezy.com/guides/developer-guide/webhooks
- Pricing / signup: https://www.lemonsqueezy.com/pricing · https://app.lemonsqueezy.com/register

**Paddle**
- Supported countries (help): https://www.paddle.com/help/legal/sanctions/which-countries-are-supported-by-paddle
- Supported countries (dev docs, BG/EUR): https://developer.paddle.com/concepts/sell/supported-countries-locales
- Business identification: https://www.paddle.com/help/start/account-verification/what-is-business-verification
- Identity verification: https://www.paddle.com/help/start/account-verification/what-is-identity-verification
- Setup checklist: https://developer.paddle.com/build/set-up-checklist
- Checkout / Paddle.js: https://developer.paddle.com/concepts/sell/self-serve-checkout · https://developer.paddle.com/paddle-js/
- Payouts: https://www.paddle.com/help/manage/get-paid/when-and-how-do-i-get-paid
- Pricing: https://www.paddle.com/pricing

**Newsletter**
- Beehiiv pricing: https://www.beehiiv.com/pricing
- Beehiiv Send API / Create post (Pro+Enterprise): https://www.beehiiv.com/support/article/36759164012439 · https://product.beehiiv.com/p/send-api
- Resend pricing / free tier (3,000 emails/mo, 100/day; broadcasts counted separately): https://resend.com/pricing
- Resend docs (Audiences, Broadcasts, API keys): https://resend.com/docs/introduction
- Brevo developer docs (contacts, campaigns, transactional): https://developers.brevo.com/
- Brevo email API: https://www.brevo.com/features/email-api/ · Free-plan limits: https://help.brevo.com/hc/en-us/articles/208580669

**Supabase**
- Pricing: https://supabase.com/pricing
- Auth rate limits (2 emails/hr built-in): https://supabase.com/docs/guides/auth/rate-limits
- Custom SMTP: https://supabase.com/docs/guides/auth/auth-smtp

**RevenueCat**
- Pricing / MTR: https://www.revenuecat.com/pricing · https://www.revenuecat.com/docs/welcome/set-up-revenuecat/account-management
- Country support: https://community.revenuecat.com/featured-articles-55/is-revenuecat-supported-in-my-country-5422

**Google Play**
- Developer & merchant registration by country (Bulgaria ✔, EUR): https://support.google.com/googleplay/android-developer/answer/9306917
- Get started / $25 fee / personal verification: https://support.google.com/googleplay/android-developer/answer/6112435
- Verify developer identity (government ID): https://support.google.com/googleplay/android-developer/answer/10841920
- Closed-testing requirement (12 testers / 14 days): https://support.google.com/googleplay/android-developer/answer/14151465
- Android developer verification (Sept 2026): https://developer.android.com/developer-verification
- Receiving payments / payouts: https://support.google.com/googleplay/android-developer/answer/2700656

---

*Prepared as pre-signup due diligence. Prices, tester counts and free-tier limits change without notice — re-check the linked official pages on the day you actually register.*


---

## UPDATE — 2026-10-03 (evening)

**Newsletter provider: DECIDED — Brevo or Resend** (Yordan's pick; already comfortable with both). MailerLite is out; Beehiiv's free plan can't send via API. §3 above is now the authoritative newsletter section (the MailerLite analysis is removed, not just superseded).

**Built the same day, waiting only on the account:** `/api/subscribe` endpoint (13/13 tests), hub signup form behind `VITE_NEWSLETTER_ENABLED`, the English composer/sender script (Brevo campaign API **or** Resend broadcast API), and a **paused** daily 08:30 cron. Nothing on the live site changed: the form stays hidden until the flag is set at the same time as the provider key.
