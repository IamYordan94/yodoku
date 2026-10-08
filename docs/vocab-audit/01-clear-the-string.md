# Clear the String (LetterMix) — vocabulary & difficulty audit

**Scope:** `public/data/lettermix-puzzles.json` (4,122 dated entries / 1,372 distinct dates,
2025-01-01 → 2028-10-05; 5 + 7 + 9 = 21 solution words per date → 28,854 solution slots),
generator `scripts/generateLetterMixPuzzles.js`, dry-run rebalancer `scripts/rebalance-lettermix.mjs`,
acceptance logic `src/utils/lettermixLogic.ts` + `src/utils/englishWords.ts` + `src/hooks/useWordDatabase.ts`.
**Fairness bar:** `scripts/data/english-common.txt` (17,705 curated common English words, 3–8 letters)
minus `scripts/data/names-blocklist.txt` = **14,820 words** (`bar`). This is exactly the pool the
rebalancer draws from (`loadPools()` = `public/words-cbo.json` minus the name blocklist; `words-cbo.json`
is byte-for-byte the same 17,705 words as `english-common.txt`). Read-only audit — no data, code or
script was modified.

## Verdict up front

1. **The live data is broken, right now, on every single day.** 0 of 1,372 dates have a clean
   solution set. 74% of easy solutions, 87% of medium and 92% of hard solutions are words outside
   the curated bar; for hard, 91% are not in `english-common.txt` at all. Today's hard tier is
   `ignobly, aplasia, pruritus, myogenic, hyalite, songster, unmocked, splicing, undodged` — nobody
   clears that in a minute, or in an hour.
2. **Even the "curated" fix is not clean enough.** The pool the rebalancer draws from still contains
   683 three-letter "words", 95 of which (13.9%) are abbreviations / initialisms (`abc, atm, fbi,
   ppm, apr, lcd, mpg, rpm, epa, cpu, bbl, hrs, sds`). A post-fix easy puzzle from the rebalancer's own
   dry-run is `jai, mus, would, fix, yarn` — `jai` and `mus` are the same class of junk as `bac`/`leno`.
3. **The 5/7/9 band cannot meet "one minute per game" as configured.** Hard needs **76.5 letter-taps +
   submits minimum** — 61 s of *pure mechanical input at 1.25 taps/s with zero thinking* — before any
   cognition. Medium needs 49 interactions, ~36% over the Wordle-equals-one-minute anchor of ~36.
   Bands must ease.
4. **The rebalancer's approach is sound and safe to run, with two fixes:** its own determinism claim
   is false (`usedWordsGlobal` makes generation order-dependent — verified), and it silently blesses
   the residual 3-letter abbreviation junk. Regenerating only `>= today` and keeping the past
   byte-identical is the correct, conservative call.

---

## Method (exact commands)

All measurement was done with throwaway Python/Node scripts in the Hermes scratch dir; nothing was
written inside the repo except this file.

### Source-set comparison + per-tier "not in bar" rate

```
python scratch/lmix/audit.py
```

```
english-common.txt      : 17705 lines, 17705 unique
names-blocklist.txt     : 21973 unique
curated bar (common-names): 14820
words-cbo.json          : 17705 unique  (from english-common, 3-8 letters)
cbo minus bar           : 2885        (names that double as words)
bar minus cbo           : 0

--- EASY : 6870 solution-word slots, 5467 unique
    not in curated bar : 5109 slots = 74.37%  (4181 unique)
    not in english-common at all : 4105 slots = 59.75%
--- MEDIUM : 9618 solution-word slots, 9093 unique
    not in curated bar : 8326 slots = 86.57%  (7889 unique)
    not in english-common at all : 7956 slots = 82.72%
--- HARD : 12366 solution-word slots, 11619 unique
    not in curated bar : 11352 slots = 91.80%  (10666 unique)
    not in english-common at all : 11250 slots = 90.98%
```

Per-date `%` non-bar (`python scratch/lmix/audit2.py`): **1372 of 1372 dates are >50% junk**, including
the last one (`2028-10-05`: 90.5%). No date is clean → the whole file, past *and* future, was produced
by the old `words.json` dictionary; the just-refactored generator has not regenerated anything yet.

**Worst offenders** (most frequently served non-bar words in the live file):

| Tier | Worst examples |
|---|---|
| easy | rus, abb, liz, vau, cur, crax, kohl, quet, ketu, yark, bucky, gey |
| medium | damnous, unioval, sarah, regga, iceni, lucian, mopus, rappe, chontal, lampman, unrent, gretel, pataria, eelpot, detinue, vexful |
| hard | ordines, bismite, skelper, spherics, jointer, rhizogen, fairtime, silvered, blickey, cotutor, anaitis, unrainy, axilemma, catfoot, camoodi, choanate, guttable, erenach, whiggify, tweedle, otoscopy |

### Interaction budget and time-to-win

```
python scratch/lmix/audit2.py    # letters per puzzle, min-clicks-to-solve
python scratch/lmix/gen_analyze.mjs
```

```
easy   words/puzzle 5.00  avg word len 4.01   letter-taps/puzzle 20.1  min interactions 25.1
medium words/puzzle 7.00  avg word len 6.01   letter-taps/puzzle 42.0  min interactions 49.0
hard   words/puzzle 9.00  avg word len 7.51   letter-taps/puzzle 67.6  min interactions 76.6
```

"Interactions" = one tap per letter + one submit per word. This is a *floor*: it assumes the player
already knows every word and never mis-taps. The "one minute" promise is anchored on Wordle, which is
5×6 taps + 6 submits = **~36 interactions** and is universally experienced as about a minute.

| Tier | Interactions (live) | Pure-input floor @1.25 taps/s | vs one-minute (36) |
|---|---|---|---|
| easy | 25.1 | 20.0 s | under |
| medium | 49.0 | 39.2 s | 36% over |
| hard | 76.5 | 61.2 s | 112% over |

A thinking-time model (`s = base + per·len`, `scratch/lmix/audit2.py`) gives median solve times of
**65–95 s / 126–182 s / 197–283 s** for easy/medium/hard at best-case parameters (3 s + 2.5 s/letter).
Hard exceeds the promise by 3–5× before you account for the fact that its words are unguessable.
Promised: one minute each. Delivered (live data): minutes, or never.

### Residual junk in the curated pool

```
python scratch/lmix/audit.py   # per-length strict abbreviation/initialism flagging
```

```
len 3:  683 words, 95 flagged (13.91%)  e.g. abc, abd, abt, abu, acc, adc, adm, adp, ads, adv, aes, afb
len 4: 1491 words,  6 flagged ( 0.40%)  e.g. dept, nasa, prep, rsvp, swat, ussr
len 5: 2383 words,  1 flagged ( 0.04%)  e.g. vitro
len 6: 3227 words,  0 flagged ( 0.00%)
len 7: 3658 words,  0 flagged ( 0.00%)
len 8: 3378 words,  1 flagged ( 0.03%)  e.g. thankyou
```

Band-level residual junk (mean of per-length rates, the generator picks the length uniformly then a
word): easy 3–5 = **4.78%**, easy 4–5 = **0.22%**, medium 5–6 = 0.02%, hard 6–7 = 0.00%, hard 7–8 = 0.01%.
**The junk is concentrated almost entirely in the 3-letter bucket.** `PROVENANCE.md` says the list is
`wordfreq_en_top_20000 ∩ words_alpha`: `words_alpha` is a broad dictionary that keeps abbreviations and
initialisms that happen to be high-frequency tokens, so raising the floor to 4 letters removes the
problem at the source without needing a new list.

### Rebalancer dry-run

```
node scripts/rebalance-lettermix.mjs
```

```
Word pool exhausted at 8822 words, resetting...
rebalance: 2184 entries regenerated (>= 2026-10-08), 1938 kept, past identical: true
post-check: 0 non-curated solution words remain from 2026-10-08 onward
  2026-10-08 easy: jai, mus, would, fix, yarn
  2026-10-08 hard: harvest, artists, postcard, sentient, trainers, marshals, handbag, shippers, thankyou
  2026-10-08 medium: claws, remade, clean, vitro, toxin, yanks, rents
```

### Determinism probes

```
node -e "import('file:///…/generateLetterMixPuzzles.js').then(m=>{const p=m.loadPools();console.log(m.generateOne('2026-10-08','hard',p).solutionWords)})"   # run twice, two processes
node scratch/lmix/order.mjs   # same 40 dates, forward vs reverse order
```

```
two separate processes, same date+level : identical  ✓
forward vs reverse generation order     : DIFFER
  forward 2026-11-16 easy: thong,vices,tolls,def,cusp
  reverse 2026-11-16 easy: thong,vices,tolls,wen,inn
```

---

## Section A — Fairness of the live file

Measured against the curated bar (section above). The result is unambiguous: **the live file is not
fair at any tier.** 74–92% of the words a player is asked to find are outside the curated list, and
for hard 91% are not in a common-English list at all. This matches the owner's report exactly
(today's hard = `ignobly, aplasia, pruritus, myogenic, hyalite…`; today's easy = `bac, bey, leno, gonad,
nob`). This is not a calibration nit — the live data is generated from a dictionary full of non-words.
Every tier must be regenerated from the curated pool; the number and lengths then need re-tuning
(Section C) because even a fair list cannot make 9×7.5-letter anagrams a one-minute task.

## Section B — Can difficulty stay as-is?

No. Per tier:

* **easy** — 5 words, 3–5 letters, 25.1 interactions. Meets the one-minute bound on interaction count,
  but the live words are junk and the post-fix pool still leaks 3-letter abbreviations.
* **medium** — 7 words, 5–7 letters, 49.0 interactions: ~36% over the Wordle anchor, and finding seven
  common 5–7 letter words from a 42-letter jumble in a minute is unrealistic for a casual player even
  when the words are fair.
* **hard** — 9 words, 7–8 letters, **76.5 interactions = 61 s of pure input with zero thinking**. The
  tier is arithmetically incapable of meeting "one minute" regardless of vocabulary. Add the cognitive
  cost of nine 7–8 letter anagrams and it is a multi-minute task at best; with the live junk words it
  is simply unwinnable.

## Section C — Recommended bands

Target: keep the one-minute promise credible (≤ ~36–45 interactions), fix the junk, keep a visible
easy→medium→hard ramp, never serve a non-word.

| Tier | Live | Recommended | Interactions | Residual junk (bar) |
|---|---|---|---|---|
| easy | 5 words, len 3–5 | **4 words, len 4–5** | 25.1 → **22.0** | 4.78% → 0.22% |
| medium | 7 words, len 5–7 | **5 words, len 5–6** | 49.0 → **32.5** | 0.02% |
| hard | 9 words, len 7–8 | **6 words, len 6–7** | 76.5 → **45.0** | 0.00% |

Rationale: (i) dropping `minLen 3` from easy removes the abbreviation class at the source (0.22%
residual vs 4.78%); (ii) medium and hard must lose word count *and* a length step — shortening lengths
alone is not enough (`9 words, 6–7` is still 67.5 interactions); (iii) hard at 45 interactions is
deliberately above the Wordle anchor so it still feels hard, but is sub-minute for a confident player
and finite for everyone. If the owner prefers to preserve more of the "hard = long words" feel, an
acceptable alternative is hard = 5 words × 6–8 letters (37.5 interactions) rather than 6 × 6–7; do not
keep 9 words.

## Section D — Rebalancer review + the `words.json` question

**Is the approach sound? Yes.** `scripts/rebalance-lettermix.mjs`:

* Regenerates only entries `>= FROM` (default today, 2026-10-08), keeps 1,938 past entries and asserts
  `past identical: true` before writing. Correct for a calendar game — rewriting a day a player already
  finished is worse than leaving it unfair.
* Asserts every regenerated word is in the curated pool and inside the band, and refuses duplicate words
  per puzzle (`throw` aborts before any write). Fail-closed. Good.
* `--apply` is opt-in; the default is a dry run. Good.
* Deterministic for a fixed `(start date, call order)` — verified identical across processes.

**Two things to fix before running it:**

1. **The "deterministic per (date, level)" claim in its header is false.** `pickWords` uses the
   module-level `usedWordsGlobal` set, which carries state across `generateOne` calls, so the output for
   a given date depends on the order and the set of earlier calls (verified above: forward vs reverse
   order produce different words for `2026-11-16`). Rebalance and the append keeper both walk
   chronologically, so the current file stays self-consistent — but any future caller that generates a
   different date range/order (e.g. re-running with an advanced `--from`) will silently get different
   words for the same date. Fix: reset `usedWordsGlobal` inside `generateOne` so each `(date, level)` is
   independent of history.
2. **The bands live in two places.** `BANDS` in the rebalancer and `CONFIG` in the generator are the same
   numbers by hand; changing one without the other breaks the rebalancer's `word count` assertion.
   Import one from the other (export `CONFIG`/`BANDS` from a single module).
3. **It blesses residual 3-letter junk.** Its "0 non-curated solution words remain" check passes while
   easy still serves `jai, mus`. Change the band to `minLen 4` (Section C) or add a small
   abbreviation/initialism blocklist to `loadPools`.

**`public/data/words.json` (14.8 MB) — can Clear the String drop it?**

At runtime the page only uses it in two places: acceptance (`isValidWord` → `isValidDictionaryWord`
in `isAcceptedGuess`) and the "Stuck!" probe (`getWordsByLength` → `hasFormableWord`). Both already
have a curated fallback (`isCommonEnglishWord` / `getCommonEnglishWordsByLength` from
`/words-cbo.json`), and `scripts/test-lettermix-logic.mjs` asserts the exact migration: `hands`/`flood`
accepted, `wran` rejected, and a solution word always accepted, **even with `words.json` absent**. So:

* **Runtime acceptance does NOT need `words.json`.** Dropping the fetch makes acceptance *stricter*
  (stops accepting `ignobly`, `hyalite`, etc. as bonus words) and saves the 14.8 MB download on the
  Clear the String route — a real mobile win. The only cost: a few legitimate bonus words outside the
  17,705-word curated list would be rejected. Self-consistent, since the same list now backs solutions.
* **The file itself cannot be deleted from the repo.** It is still read by `scripts/sustain/runway.mjs`,
  `scripts/sustain/keepers/cbo.mjs` (Change by One pair generation) and `scripts/generate-seven-boards.mjs`.
  The move is therefore: remove `useWordDatabase` from `LetterMixPage.tsx` (wire
  `isValidDictionaryWord` to `isCommonEnglishWord` and keep the solution-always-accepted rule), and leave
  the file for the build/sustain scripts.

---

## DECISION TABLE

| # | Tier / item | Keep or change | Exact numbers | Why (recommended default in bold) |
|---|---|---|---|---|
| 1 | easy band | **CHANGE** | 5 words·3–5 → **4 words·4–5** (25.1 → 22.0 interactions, junk 4.78% → 0.22%) | Dropping minLen 3 removes the 13.9% abbreviation class (`abc`, `atm`, `fbi`, `jai`, `mus`) at the source; 4 words of 4–5 letters fits one minute. |
| 2 | medium band | **CHANGE** | 7 words·5–7 → **5 words·5–6** (49.0 → 32.5 interactions, junk 0.02%) | 49 interactions is ~36% over the Wordle=one-minute anchor; seven 5–7 letter words in a minute is not casual-realistic. |
| 3 | hard band | **CHANGE** | 9 words·7–8 → **6 words·6–7** (76.5 → 45.0 interactions, junk 0.00%) | 76.5 interactions = 61 s of pure input with zero thinking, before cognition; the tier cannot honour "one minute". Alt: 5 words·6–8 = 37.5. Never keep 9 words. |
| 4 | Regenerate data | **CHANGE** | regenerate 2,184 entries `>= 2026-10-08`; 0/1,372 dates are currently clean | Live file is 74–92% non-bar; every tier must be rebuilt from the curated pool. |
| 5 | Past entries (< 2026-10-08) | **KEEP** | 1,938 entries byte-identical | Calendar game — a day players already finished must never change; the rebalancer already guards this. |
| 6 | `usedWordsGlobal` determinism | **CHANGE** | reset per `generateOne` (order-dependence verified) | The header's "deterministic per (date, level)" claim is false; state across calls changes words for the same date. |
| 7 | Generator bands source | **CHANGE** | single shared export (BANDS == CONFIG) | Duplicated hand-copied bands silently drift and trip the rebalancer's count assertion. |
| 8 | `words.json` in LetterMix runtime | **CHANGE (drop fetch)** | remove `useWordDatabase`; acceptance = curated + solutions | Acceptance already works from `words-cbo.json` (asserted by `test-lettermix-logic.mjs`); saves 14.8 MB on the route. Keep the file for CBO sustainer / seven-boards / runway scripts. |
| 9 | Rebalance script approach | **KEEP** | run `node scripts/rebalance-lettermix.mjs --apply` after fixes 6–8 | Generation itself is correct and fail-closed: curated-only, no dupes, past byte-identical, dry-run by default. |
