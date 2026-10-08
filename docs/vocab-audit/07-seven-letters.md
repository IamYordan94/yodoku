# 7 Letters — board / vocabulary / difficulty audit (2026-10-08)

Scope: word fairness vs the curated bar, the serving bug, tier-ladder fairness, data integrity.
Read-only audit. All numbers produced by throwaway scripts run against the shipped data
(`public/data/seven-boards.json`, 180 boards) and the project's own fairness lists
(`scripts/data/english-common.txt`, `scripts/data/names-blocklist.txt`). Nothing in the repo was edited
except this file.

## Commands run

```bash
node --version                                   # v26.7.0
node -e "..."                                    # board count / structure / words.json keys
node <scratch>/seven-audit.mjs                   # junk rate per board, missing-real, tier math, sanity, dupes
node -e "..."                                    # distribution stats + curated/words-cbo cross-check
grep -rn "words.json|isValidWord|seven-boards" src/
```

Key source refs: `src/pages/SevenLettersHome.tsx:7,10-15` (NUM_BOARDS + rotation),
`src/pages/SevenLettersPage.tsx:71` (fetch), `:132` (`board.words.includes(w)` validation),
`src/utils/sevenLettersLogic.ts:102-122` (tier ladder), `scripts/generate-seven-boards.mjs` (generator).

## (a) Serving bug — CONFIRMED: only 60 of 180 boards ever appear

`SevenLettersHome.tsx:7` hardcodes `const NUM_BOARDS = 60;`. `getTodayIndex()` returns `days % 60`,
and `SevenLettersPage.tsx:92` does `getTodayIndex() % boards.length` = `(days % 60) % 180` = `days % 60`.

- Simulated 400 consecutive days: **60 distinct daily indices, max index 59.**
- Boards **60–179 (120 boards, 67% of the file) are unreachable as the daily.** They are reachable
  only via the archive (`/seven/play?board=N`, `SevenArchive.tsx`) which lists all 180.
- Daily rotation also repeats every **60 days**, not every 180 — a daily player meets the same board
  twice as often as the data supports.

The file has 180 boards because `generate-seven-boards.mjs` was re-run with `--append --count=180`
(default `--count=60`); the page constant was never updated.

## (b) Word fairness vs the curated bar — 57.8% of board answers are NOT common English

Fairness bar = `scripts/data/english-common.txt` (17,705 curated words), which is also shipped to
clients verbatim as `public/words-cbo.json` (17,705 words, 0 curated words missing) — so the bar the
audit uses is exactly the bar the app already has on the client.

Baked board answers (generated from the 14.8 MB `public/data/words.json` junk dictionary):

| metric | value |
|---|---|
| total board-words (across 180 boards) | 11,703 |
| in curated bar | 4,943 (42.2%) |
| **NOT in curated bar ("junk")** | **6,760 (57.8%)** |
| distinct junk words overall | 3,759 |
| junk rate: min / median / mean / max | 38% / 58% / 58% / 80% |
| boards with junk rate > 50% | 149 / 180 |
| boards with junk rate >= 60% | 73 / 180 |

Worst boards by junk rate (example junk answers):

| board | letters | words | junk | junk % | example junk |
|---|---|---|---|---|---|
| #65 | U+AEFKLTU | 44 | 35 | 80% | akule, aleut, atule, auklet, aku |
| #178 | K+ACEGKOR | 44 | 35 | 80% | acker, ako, arock, caker, cark |
| #89 | B+BEIQRSU | 31 | 24 | 77% | ber, beri, bes, bier, birse |
| #175 | G+AGIMORU | 53 | 41 | 77% | gamori, gourami, ogam, gim, gio |
| #12 | G+AGKLMRU | 41 | 30 | 73% | algum, almug, garum, gau |

Best boards: #166 E+ADEILSV (38%), #112 T+AMNOPST (41%), #71 H+CEGHINT (43%).
Board #0 S+BIMNOSU (44 words, 45% junk): `binous, bosn, minos, nosu, osmin, sium, snum, sou, soum, suomi`.

Note the bar is a *common-word* bar, so "junk" spans outright non-words (`binous`, `bosn`, `mins`),
proper nouns (`minos`, `suomi`, `aleut`), and real-but-obscure words (`bosun`, `nimbus`, `gourami`).
All three classes fall outside what a casual player reliably knows, which is the point of the metric.

## (c) The reverse problem — real common words get REJECTED (1,321 cases)

Validation accepts a word only if it is in that board's `words` list (see (g)). For each board I
computed curated common words that fit the board (3–7 letters, each board letter once, contains the
centre) but are absent from the accepted list:

- **1,321 genuine common words are rejected across the 180 boards.**
- Worst offenders: #16 A+AEIPRST and #70 E+ADELPST and #154 S+ABERSTU (30 each). Examples a player
  would try and be told "not in our word list": `airs, apes, ears, arts, bars, bears, beats, belts,
  bits, grapes, hops, ions, laps, pals, rays, tubs`.

**Reachability of the ladder using common words only:** summing the conventional-word scores, the
common-word ceiling is **14,303 / 43,311 = 33% of total max**.

- **4/180 boards cannot reach Good (15%) even if the player finds every common word** (#175 12%,
  #11 13%, #89 13%, #12 14%).
- **77/180 boards cannot reach Solid (30%) with common words alone.**
- Genius (80%) and Queen Bee (100%) are effectively unreachable without mining junk — the ladder is
  calibrated against an inflated max that ~58% junk answers produce.

## (d) Tier requirement math — 5 sample boards

`tierCutoffs = ceil(maxScore * pct)`; "words" = ceil(cutoff / average-word-value).

| board | letters | words | max | avg | Good 15% | Solid 30% | Great 45% | Amazing 60% | Genius 80% | Queen 100% |
|---|---|---|---|---|---|---|---|---|---|---|
| #0 | S+BIMNOSU | 44 | 147 | 3.3 | 23pt (~7w) | 45pt (~14w) | 67pt (~21w) | 89pt (~27w) | 118pt (~36w) | 147pt (44w) |
| #45 | B+BGILNOT | 38 | 138 | 3.6 | 21pt (~6w) | 42pt (~12w) | 63pt (~18w) | 83pt (~23w) | 111pt (~31w) | 138pt (38w) |
| #90 | B+ABEIRTX | 56 | 210 | 3.8 | 32pt (~9w) | 63pt (~17w) | 95pt (~26w) | 126pt (~34w) | 168pt (~45w) | 210pt (56w) |
| #135 | R+HINORST | 47 | 177 | 3.8 | 27pt (~8w) | 54pt (~15w) | 80pt (~22w) | 107pt (~29w) | 142pt (~38w) | 177pt (47w) |
| #179 | S+AEIMRSW | 82 | 289 | 3.5 | 44pt (~13w) | 87pt (~25w) | 131pt (~38w) | 174pt (~50w) | 232pt (~66w) | 289pt (82w) |

Reading: **Good needs ~6–13 words, Solid ~12–25** — reachable in a session, sometimes even within the
"one minute" promise. **Genius needs ~31–66 words and every board's Queen Bee needs all words** — the
top of the ladder is a long-form Spelling-Bee grind, not a one-minute target. The mid-tier geometry is
fine; the problem is that the denominator (maxScore) counts junk, so the low tiers are tuned low while
the high tiers are unobtainable for a normal player.

## (e) Centre-letter / pangram / structural sanity — clean

| check | result |
|---|---|
| boards with a word missing the centre letter | 0 |
| boards without a pangram | 0 (180/180) |
| boards whose stored `maxScore` != recomputed | 0 |
| boards with non-distinct letters | 0 |
| duplicate boards (same letters+centre) | 0 |

Boards are structurally correct: exactly 7 distinct letters, the centre is one of them, every accepted
word contains the centre, each board contains at least one 7-letter pangram, and `maxScore` is exact.

## (f) Duplicates

No duplicate boards (letters|centre) across the 180. No duplicate words within a board (generator
uses a Set). 2,623 board-words also appear in `names-blocklist.txt` (expected — that list only blocks
name tokens from being puzzle **seed** words; the generator ignores it entirely).

## (g) Which file validates the player's word — and can it run on the curated list?

`SevenLettersPage.tsx:132` validates against **`board.words` only** (`board.words.includes(w)`).
`words.json` is fetched at runtime by `useWordDatabase` for **Clear the String only** — 7 Letters never
fetches it. The curated list is baked into each board at generation time (via `words.json`) and is
**not** shipped to the client for this game in any usable form beyond the boards themselves.

Verdict: 7 Letters already has a curated client list available (`words-cbo.json`, loaded by
`src/utils/englishWords.ts` for Clear the String). It is **not** wired in, but validation *could* run
on it: accept `board.words` union `words-cbo.json` filtered to board letters (+centre). The clean fix,
though, is upstream in `generate-seven-boards.mjs`: intersect the candidate dictionary with
`english-common.txt` before `solve()`, so accepted words and `maxScore` are both computed from the
curated bar and the tier ladder is calibrated honestly.

## DECISION TABLE

| aspect | keep or change | exact numbers | why |
|---|---|---|---|
| Daily board rotation (`NUM_BOARDS=60`) | **CHANGE — critical** | 60 served / 180 in file → 120 boards (67%) unreachable as daily; 60-day repeat | One-line fix (`NUM_BOARDS = 180` or derive from the loaded `boards.length`); restores the intended 180-board runway and halves repeat frequency. |
| Accepted-word source (junk from `words.json`) | **CHANGE** | 57.8% of 11,703 answers not in the curated bar; 3,759 distinct junk words; 149/180 boards >50% junk | Players see nonsense answers (`binous`, `bosn`) and are refused real words; rebuild boards from the curated bar. |
| Rejected real words | **CHANGE** | 1,321 common words rejected; per-board examples `airs, apes, ears, grapes, belts` | Refusing words a player knows is the most visible fairness failure; fixed by the same curated-dictionary rebuild. |
| Tier ladder percentages (15/30/45/60/80/100) | KEEP percentages, re-baseline maxScore | Good ~6–13 words, Solid ~12–25 (fine); Genius ~31–66 words, Queen = all words | Percentages are reasonable; they only look unfair because maxScore counts junk. Recompute cutoffs from a curated `maxScore`. |
| Genius / Queen Bee reachability | CHANGE (falls out of data fix) | common-word ceiling = 33% of max; 4 boards can't reach Good, 77 can't reach Solid on common words | After the curated rebuild, Genius 80% becomes a real target instead of a junk-mining feat. |
| Pangram / centre / maxScore integrity | KEEP | 0 violations across 5 structural checks | Data geometry is already correct; the generator's pangram seeding works. |
| Duplicate boards | KEEP | 0 duplicates | No action. |
| Runtime validation path | CHANGE (or accept union) | validation = `board.words` only; `words-cbo.json` (17,705) already client-side but unused | Either rebuild boards from the curated bar, or accept `board.words ∪ words-cbo.json` while the data is fixed. |
| "One minute per game" marketing | KEEP with caveat | true for Good/Solid; false for Genius (31–66 words) | Low tiers fit the promise; do not advertise the top of the ladder as one minute. |

**Recommended default:** (1) fix `NUM_BOARDS` to 180 immediately (one line); (2) regenerate/rebuild all
boards against `scripts/data/english-common.txt` so accepted words and `maxScore` are curated-only,
then recompute tier cutoffs from the new `maxScore`; (3) keep the 15/30/45/60/80/100 percentages as-is
and keep the structural generator approach. Do the rotation fix first — it is a one-line change with no
data risk — and treat the dictionary rebuild as the substantive fix.
