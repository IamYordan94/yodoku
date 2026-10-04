# RECOVERY — if the laptop dies, this is how Yodoku comes back

Plain English. Written for the owner, not for a developer.

---

## The one thing to understand first

**This is the easy one.** Yodoku is a static site — no server, no
database, no secret keys. Everything that makes it what it is (the code and all
1180+ quiz questions) is already in GitHub. If the laptop dies tomorrow,
`yodoku.app` keeps working and nothing is lost that cannot be re-cloned.

The only thing that would be lost is the **weekly quiz growth job**, because
that runs from the laptop. It restarts as soon as you have a machine again.

---

## What it is

A free browser word-games hub (Yodoku) served at **yodoku.app** — an
umbrella of small daily word games. It earns nothing directly; its value is
traffic, SEO and as a showcase of what can be shipped.

## Where it runs

| What | Where |
|---|---|
| Code | GitHub — https://github.com/IamYordan94/yodoku |
| Live site | https://yodoku.app (redirects to https://www.yodoku.app) |
| Hosting | Vercel (static build, no server functions) |
| Database | **None** — it is a static site |
| Secrets | **None** — there is nothing to protect |
| Routing | `vercel.json` rewrites everything to `/index.html` (single-page app) |

## The asset that matters

`public/data/quiz-bank.json` — the question bank (1180+ questions across 11
categories). **It is in the repo**, so it is already safe. It is generated from
the per-category sources in `scripts/quiz-bank/*.json` and merged with
`node scripts/merge-quiz-bank.mjs`.

If the bank is ever wrong, `node scripts/test-quiz-logic.mjs` must print
`ALL CHECKS PASSED` before anything is pushed.

## Rebuilding from zero

1. `git clone https://github.com/IamYordan94/yodoku`
2. `npm install`
3. `npm run build`
4. Deploy the `dist` folder to Vercel (or connect the repo — Vercel builds it
   automatically on every push to `main`).

That is the whole procedure. There is no database to restore and no key to find.

## What to check after a rebuild

- The home page loads and shows "Yodoku".
- `https://www.yodoku.app/data/quiz-bank.json` returns the questions.
- `https://www.yodoku.app/sitemap.xml` is present (SEO depends on it).

All three are checked automatically by the daily fleet check.

## If you only have five minutes

1. `git clone` from GitHub.
2. `npm install && npm run build`, push, let Vercel deploy.
3. Done — the quiz bank came with the repo.
