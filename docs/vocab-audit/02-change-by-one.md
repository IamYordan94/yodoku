# Change by One — Word-Pool & Difficulty Audit (02)

Scope: (a) re-verify the word pools are junk-free against the curated bar, (b) the
`optimal_steps` distribution per length, (c) whether 9-14 step ladders fit the marketing
promise "one minute per game", (d) names / odd words slipping through and whether any
shortest ladder relies on words a casual player would never think of, (e) data bugs.
Read-only: no game data, code or script was modified. The only write is this file.
The previous incident (2026-10-05 daily `wran→ming`) was fixed by regenerating the
dictionary from wordfreq+words_alpha; this report re-checks that fix independently.

## 0. Source of truth

| Thing | Location |
|---|---|
| Play dictionary | `public/words-cbo.json` (buckets 3-8, here 4-7 used) |
| Pair pools | `public/cbo-pairs-{4,5,6,7}.json` (400 pairs each) |
| Curated bar | `scripts/data/english-common.txt` (17,705 common words) |
| Name blocklist | `scripts/data/names-blocklist.txt` (21,985 given names, TitleCase) |
| Generator (BFS over dict) | `scripts/gen-cbo-pairs.mjs` — excludes blocklist names from starts/ends and from the reconstructed shortest path |
| Validator | `scripts/validate-cbo.mjs` — endpoint membership + BFS distance == optimal_steps + 731-day date scan |
| Daily pick | `src/utils/cbo-dailyChallenge.ts` — mulberry32(date) → one pair per length 4/5/6/7 = **4 puzzles per day** |
| Play rules | `src/utils/cbo-gameLogic.ts` + `cbo-gameState.ts` — reset if moves ≥ `max_moves` |
| Page | `src/pages/ChangeByOnePage.tsx` — shows "Optimal: N steps · Up to M moves"; `starsFor` = 3★ iff moves ≤ optimal |

`max_moves` = {4L:10, 5L:12, 6L:12, 7L:14}.

## 1. Method / exact commands (all read-only, scratch scripts outside the repo)

```bash
node scripts/validate-cbo.mjs                     # in-repo validator
# independent re-implementation (Python BFS over the same JSON):
uv run --with wordfreq python "$TMPDIR/cbo_audit.py"   # token/zipf + path extraction
uv run --with wordfreq python "$TMPDIR/cbo_scan3.py"   # suspicious-token path scan
uv run --with wordfreq python "$TMPDIR/cbo_clean.py"   # solvability with odd tokens banned
```
`wordfreq` (the same library the bar was built from) was used only as a second opinion on
token obscurity; membership checks are pure set operations on `english-common.txt` and
`names-blocklist.txt`.

## 2. (a) Junk re-verification — PASS

```
words-cbo.json: 4L=2157 5L=3095 6L=3860 7L=4012
cbo-pairs-4.json: 400 pairs ok ...  pair checks: 1600 pairs validated
date scan: 731 days × 4 lengths = 2924 daily picks valid
ALL CHECKS PASSED
```

Independent re-check (my own BFS, not the repo script):

| Check | Result |
|---|---|
| Pairs | 1600 (4×400) |
| Endpoint tokens (2 per pair) | 3200; **3200/3200 ∈ `english-common.txt`** |
| Endpoint tokens ∈ `names-blocklist` | **0** |
| `optimal_steps` == my recomputed BFS distance | **1600/1600 match (0 mismatches)** |
| Every intermediate word of the shortest path ∈ `english-common.txt` | **yes (0 non-common)** |
| Every intermediate word ∈ `names-blocklist` | **0** |
| Unsolvable pairs | 0 |
| Self pairs (start == end) | 0 |
| Duplicate pairs (normalised, within & across lengths) | 0 |

The whole 4-7L dictionary is a subset of `english-common.txt` (2157/3095/3860/4012 words,
all present), so the scrabbly dump that produced `wran/aani/aaru/adad/acar` is gone — those
tokens no longer exist in `words-cbo.json`. **The incident is fixed and the fix verifies.**

## 3. (b) `optimal_steps` distribution per length

| Length | n | min | median | mean | max | histogram (steps:count) |
|--|--:|--:|--:|--:|--:|--|
| 4 | 400 | 3 | 5 | 5.00 | 10 | 3:67 4:101 5:104 6:64 7:35 8:16 9:10 10:3 |
| 5 | 400 | 4 | 7 | 7.51 | 12 | 4:44 5:52 6:54 7:54 8:58 9:45 10:45 11:28 12:20 |
| 6 | 400 | 5 | 7 | 7.63 | 12 | 5:104 6:63 7:50 8:45 9:32 10:38 11:38 12:30 |
| 7 | 400 | 5 | 7 | 7.74 | 14 | 5:119 6:58 7:42 8:35 9:36 10:43 11:24 12:13 13:14 14:16 |

Share by band:

| Length | ≤6 steps | 7-8 steps | **≥9 steps** | ≥10 steps |
|--|--:|--:|--:|--:|
| 4 | 84% | 13% | 3% | 0.8% |
| 5 | 38% | 28% | **34%** | 23% |
| 6 | 42% | 24% | **34%** | 27% |
| 7 | 44% | 19% | **36%** | 28% |

## 4. (c) Fairness under "one minute per game"

- The daily serves **4 ladders** (one per length 4/5/6/7) in a single session — the promise
  holds only if "per game" means one ladder, not the Change by One screen.
- Median ladder is 5 (4L) / 7 (5-7L) — plausible in ~1 minute for a fluent player. But
  **~1/3 of the 5/6/7-letter pools are 9-14 steps**, and the pool is indexed uniformly, so
  roughly every third day a 5-7L ladder is a 10-14 move chain. At ~15-25 s/step that is
  3-6 minutes, plus the reset when `moves ≥ max_moves` (12-14) is hit while exploring.
- 3★ requires the *exact* optimal path (`starsFor` → 3 iff moves ≤ optimal). For a 12-14
  step ladder that is a unique chain the player cannot know — and, worse, the shortest
  ladder frequently routes through tokens nobody would guess (section 5).
- Making "everyday words only" (wordfreq zipf ≥ 4.0, 850-1164 words/bucket) the play dict
  leaves only 46/400 (4L) and 0-9/400 (5-7L) solvable within max_moves — confirming the
  5-7L ladders lean on mid-frequency vocabulary (beamed, seams, spores, spares).

Verdict: the calibration is fine for a would-be 3-5 minute daily, but **too heavy for "one
minute"** once the 30%+ tail of 9-14 step ladders and the 4-puzzles-per-day format are
counted.

## 5. (d) Names / odd words slipping through

Endpoint tokens are 0 against `names-blocklist`, but the blocklist is *given names only*
(TitleCase, e.g. `Cindy`). It does not contain place names, months, demonyms or
abbreviations that `wordfreq∩words_alpha` happily admits. **15 served puzzles have such a
token as a start/end word** (0.9% of the pool; ~1 odd daily puzzle every ~27 days):

```
cuba  july  amit  coll  pres  ares  eros  copa  twas  benin  vegas  banda  yanks  lenin  texan
```

And a few shortest ladders route through an odd/intermediate token a player would not
think of (`cont`, `opec`, `pres`, `tres`, `ares`, `amit`, `coll`, `cree`):

```
L4 cuba->cont   cuba cube cure core cone cont                         (cont = abbrev, cuba = country)
L4 july->acts   july duly dull duel dues dies pies pres ares aces acts (july/ares)  -- a 10-step daily
L4 oven->buns   oven open opec spec sped sued sues suns buns          (opec = acronym)
L4 exit->draw   exit emit amit amid arid grid grad grab drab draw     (amit = given name)
L4 ages->zone   ages ares tres toes tons tone zone                    (ares/tres)
```
Banning a 22-token odd set (`ares pres opec coll amit tres cuba july cree eros twas banda
benin lenin vegas texas texan yanks gaia copa mono`) breaks only **17/1600 pairs** (11 in
4L, 6 in 5L; 0 in 6L/7L); of those, just **3 lose their only in-budget ladder** —
`malt→acer`, `ever→cuts` (4L) and `sewer→panda` (5L). So the leakage is real but small.

## 6. (e) Data bugs

None found. 0 duplicate pairs (normalised, and none repeated across length files), 0
self-pairs, 0 impossible/unsolvable pairs, 0 length mismatches. `optimal_steps` is exact
for every pair. The pool is internally consistent and reproducible.

## 7. DECISION TABLE

| Aspect | Keep or change | Exact numbers | Why |
|--|--|--|--|
| Pool cleanliness / junk | **Keep** | 1600/1600 pairs; 3200/3200 endpoints ∈ english-common; 0 in names-blocklist; 0 BFS-distance mismatches; 0 dup/self/unsolvable | 2026-10-05 `wran→ming` incident verified fixed independently; validator is trustworthy |
| Abbrev/proper-noun leakage | **Change** | 15 endpoints (cuba, july, amit, pres, coll, ares, eros, copa, twas, benin, vegas, banda, yanks, lenin, texan); 3 ladders depend on odd tokens | blocklist covers given names only; `cont/opec/pres/ares/cuba` are not game words for a casual player |
| Difficulty spread | **Change — bias shorter** | ≥9 steps = 3% / 34% / 34% / 36% (4/5/6/7L); max = 10/12/12/14 | a 12-14 move chain is 3-6 min, not "one minute"; midpoint target ≈ ≤8 steps |
| Daily format | Change or relabel | 4 ladders/day (4L-7L) in one session | "one minute per game" only true if game = one ladder |
| 3★ rule | **Change** | `starsFor`: 3★ iff moves ≤ optimal (+2 → 2★) | forces the unique shortest path, often through odd tokens |
| Data bugs | **Keep (none)** | 0 dup / 0 self / 0 impossible | pool is consistent and reproducible |

**Recommended default:** keep the generator, the dictionary and the pair pools as-is
(they are clean and verified), but (1) extend `names-blocklist.txt` with the abbreviation/
proper-noun tokens above (or filter endpoints/intermediates to wordfreq zipf ≥ ~3.5 minus a
curated abbrev list) and regenerate; (2) bias the served 5-7L pools toward ≤8 steps so the
typical daily ladder fits ~1 minute; (3) either split the four daily ladders across the
promise or soften the "one minute each" copy for Change by One; (4) make 3★ `optimal+2`
since the exact optimal is unknowable.
