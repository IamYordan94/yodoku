# Quiz Master — bank audit (2026-10-08)

Scope: factual correctness, ambiguity, safety, difficulty mix, explanation coverage, data hygiene.
Read-only audit. All numbers produced by throwaway scripts run against the merged bank
(`public/data/quiz-bank.json`) and its sources (`scripts/quiz-bank/*.json`). Nothing in the repo was edited.

## Commands run

```bash
node scripts/merge-quiz-bank.mjs            # shape/id/difficulty/dupe-id gate
node scripts/test-quiz-logic.mjs            # determinism, diversity, no-repeat, 365-day scan, explanation gate
node scripts/sustain/runway.mjs             # official runway per game
node <scratch>/quiz-audit.mjs               # counts, dupes, spread, giveaways, 30-day explanation sim, runoff, 60-sample
node <scratch>/quiz-audit2.mjs              # in-set text dupes, id gaps, orphan explanations, formatting giveaways, safety scan
node <scratch>/quiz-audit3.mjs              # 365-day repeat rate, source-sum check, spot inspection
```

## (a) Counts

Merged bank (`public/data/quiz-bank.json`): **1224 questions, 11 categories**, `version:1`.
Sum of the 11 source files = 1224 → merge is faithful (no drops).

| category | n | easy/med/hard | id range |
|---|---|---|---|
| general | 134 | 44/48/42 | 1–60, 86–110, 361–409 |
| sports | 109 | 35/40/34 | 1–109 |
| movies | 109 | 35/40/34 | 1–109 |
| geography | 109 | 35/40/34 | 1–109 |
| science | 109 | 35/40/34 | 1–109 |
| history | 109 | 35/40/34 | 1–109 |
| music | 109 | 35/40/34 | 1–109 |
| technology | 109 | 35/40/34 | 1–109 |
| food | 109 | 35/40/34 | 1–109 |
| art | 109 | 35/40/34 | 1–109 |
| animals | 109 | 35/40/34 | 1–109 |

The ten named categories are contiguous 1..109. `general` is fragmented: the known dead
range **61–85** plus a second dead range **111–360** (250 ids never issued). Harmless to
runtime (ids are unique, validator enforces it) but confusing for authoring — the next
batch must continue from 410, not from the count.

## (b) Factual sample check — 60 random questions across all 11 categories

Deterministic seed sample (`audit-sample-2026`), 6 per category. Reviewed individually:

- **Factually wrong: 0.**
- **Ambiguous (two defensible answers): 0.** `gen-055` "credited with inventing the
  telephone" → Bell is the standard credited answer and Meucci is not offered, so it is
  unambiguous as authored. `spo-029` (most men's Grand Slam singles titles → Djokovic) is
  correct as of writing.
- **Distractor quality: good** on the sample — plausible same-domain wrong answers
  (e.g. `geo-089` Myanmar: Yangon/Mandalay/Naypyidaw/Bagan; `mus-103`: all four Beatles).
- **Unsafe: 0.** No sample item is unsafe; the sensitive-content scan below is all
  substring false positives (grape→"rape", Christopher→"christ") plus classic-history items
  (WWII years, Titanic, Hitler-as-answer, Senna's death). These are conventional trivia, not
  unsafe, though `his-023`/`spo-043` are the two most "heavy" and worth keeping in mind.

## (c) Explanation coverage (design: optional `explanation`, source `explanations.json`)

- Bank-wide: **130/1224 explained (10.6%)**; every category has 10–14.
- `explanations.json`: 130 keys, **0 orphans, 0 empty values** — clean.
- **Next 30 days: only 126/300 slots covered (42%)**; 19 of the next 30 daily sets contain
  at least one unexplained question (first gap 2026-10-19).
- **The existing gate is RED right now.** `node scripts/test-quiz-logic.mjs` throws:

```
Error: next-14-day questions missing explanations: geo-008, mus-006, anim-010, gen-022,
his-074, spo-077, ... (25 ids)
```

The "next 14 days are covered" invariant the test asserts is currently violated — the
near-window picks (Oct 19–21) include 25 questions with no explanation. Coverage is not a
"nice to have": it is a claimed feature that regressed and the repo's own test catches it.

## (d) Duplicate text + answer-index spread

- **Exact-normalised duplicate question text: 14 distinct texts / 15 duplicate instances.**
  One is intra-category (`gen-095` and `gen-371`, both "What is the chemical symbol for
  gold?"). Thirteen are cross-category, e.g.:
  - `gen-371` ≡ `sci-002` (chemical symbol for gold)
  - `sci-020` ≡ `anim-004` (how many legs does a spider have)
  - `sci-054` ≡ `anim-050` (how many hearts does an octopus have)
  - `gen-106` ≡ `his-005` (Titanic sinking year) · `gen-026` ≡ `art-001` (Mona Lisa)
  - `gen-021` ≡ `art-003` (Romeo and Juliet) · `gen-100` ≡ `art-020` (A Christmas Carol)
  - `his-064` ≡ `art-010` (Sistine Chapel) · `gen-377` ≡ `sci-024` (DNA) and others.
  These break the bank's "never duplicate text" rule. They do **not** currently collide
  inside a daily set (365-day scan = 0 days with an in-set text duplicate), but with
  cross-category picks (general+science both eligible) a future date can serve the same
  question twice in one quiz — a latent defect the id-only test cannot see.
- Paraphrase guard (Jaccard ≥ 0.75, ≤1 differing token): 418 pairs, but these are the
  intended shared *templates* ("capital city of X", "chemical symbol for X") with different
  facts — allowed and pervasive by design. Only the 14 exact dupes above are genuine.
- **Answer-index spread (raw bank)** — heavily biased:

| scope | idx0 | idx1 | idx2 | idx3 |
|---|---|---|---|---|
| GLOBAL | 30.8% | 37.2% | 22.9% | **9.2%** |
| history | 17% | **60%** | 20% | 3% |
| music | 22% | 46% | 29% | 3% |
| food | 23% | 46% | 27% | 5% |
| animals | 43% | 38% | 17% | 2% |
| art | 40% | 40% | 16% | 4% |

Index 3 (fourth option) is under-used almost everywhere. Player-facing impact is **low**:
`buildDailyQuiz` reshuffles the four options per question per day (`qm-opt:<id>:<date>`), so
stored indices are not the positions players see. Still a raw-bank hygiene issue.

## (e) Answer giveaways + difficulty sanity

- **Longest-option bias: none.** The correct option is the unique-longest in
  **266/1224 = 21.7%**, *below* the ~25% random baseline. Longest is tied in 351 questions.
  Only `technology` is elevated (39%) — not a systematic giveaway, but the one category to
  watch. Per-category longest-correct: general 18%, sports 18%, geography 17%, science 16%,
  history 15%, art 20%, animals 22%, music 23%, food 25%, movies 28%, **technology 39%**.
- **Formatting giveaway: 3 minor cases** where the answer is the only all-caps-looking
  option — the chemical-symbol questions where the true symbol is the sole *single
  uppercase letter* among two-letter distractors: `sci-011` (O vs Om/Ox/Og), `sci-090`
  (C vs Ca/Co/Cr), `sci-092` (N vs Ni/Na/Ne). A sharp player can beat these by pattern.
- No question had the answer as the only pure-numeric option; the 3 flagged "duplicate
  option text" cases (`gen-089`, `sci-034`, `tech-030`) are false positives of an
  aggressive normaliser (0 vs -10, 10 °C vs -10 °C, symbolic single-chars) — no real issue.
- **Difficulty distribution sane:** diff1 394 (32.2%), diff2 448 (36.6%), diff3 382 (31.2%).
  Per category the ten games sit at 35/40/34 (easy/med/hard); general 44/48/42. The daily
  RAMP needs 4/3/3, and the pools (≥34 hard, 35 easy per category) comfortably supply it.

## (f) Runway / repeat exposure

- Official `node scripts/sustain/runway.mjs`: **Quiz Master 1224 → 122 days OK**
  ("17 weeks left") — this is the *perfect-partition* ceiling (1224/10), not the real
  player experience.
- Real behaviour (seeded picks are independent per date, no cross-day exclusion):
  **first repeat on day 3**; over a 365-day horizon **68.5% of question-slots are repeats**
  (3650 slots, only 1151 unique ids ever shown). A daily player meets a repeat within the
  first week and, across a year, sees the same question roughly two-thirds of the time.
- Honest "days of non-repeating content" is therefore far below the headline 122: the game
  does not dedupe across days, so runway is effectively governed by repetition tolerance,
  not bank size.

## Safety scan result

Keyword scan over all 1224 questions + options returned only substring false positives and
classic-history items. **No unsafe / controversial / off-limits question found.**

## DECISION TABLE

| Aspect | Keep or change | Exact numbers | Why |
|---|---|---|---|
| Bank size / merge integrity | Keep | 1224 = 134 general + 109×10; source sum == merged | Faithful, plenty of volume |
| Factual correctness (60-sample) | Keep | 0 wrong, 0 ambiguous, distractors plausible | No content edits needed |
| Safety | Keep | 0 unsafe (scan = false positives only) | Brand-safe |
| Difficulty mix | Keep | 32/37/31 globally; 35/40/34 per cat vs RAMP 4/3/3 | Sane, supplies daily ramp |
| Longest-option giveaway | Keep | 21.7% unique-longest (< 25% random) | No bias; only technology 39% to watch |
| Explanation coverage | **Change** | 130/1224 (10.6%); next-30d 42%; next-14d gate FAILS (25 ids) | Claimed feature regressed; own test red |
| Duplicate question text | **Change** | 14 distinct dup texts / 15 instances (1 intra-general) | Violates "never duplicate"; latent in-set collision |
| Formatting giveaway (symbols) | Change (cheap) | 3 items: sci-011, sci-090, sci-092 | Answer is the lone single-letter option |
| Answer-index spread | Change (low prio) | global idx3 9.2%; history idx1 60% | Raw-bank bias; reshuffled so player-facing = low |
| general id fragmentation | Cosmetic | dead 61–85 and 111–360; next id 410 | Confusing but harmless; document, don't backfill |
| Runway / repetition | **Change (content cadence)** | first repeat day 3; 68.5% of yearly slots repeat | Real repeat exposure ≫ the "122-day" headline |

**Recommended default:** Keep the question content and difficulty mix as-is (correct, safe,
well-balanced). Prioritise in this order: (1) **restore explanation coverage** — backfill
`explanations.json` so `test-quiz-logic.mjs` passes and extend the assertion from 14 to 30
days; (2) **dedupe the 14 duplicate texts** (drop the redundant copies or reword, keeping
`general` as the canonical home); (3) fix the 3 chemical-symbol formatting giveaways by
padding distractors; (4) treat answer-index spread and `general` id gaps as cosmetic
hygiene; (5) raise the sustainer cadence or add cross-day exclusion, because a 122-day
runway headline hides a ~3-day first-repeat and a 68% yearly repeat rate.
