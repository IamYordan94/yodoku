# ORDERLE — Item-Bank Audit (04)

Scope: are all items real, verifiable, unambiguous, and fairly difficult? Plus the
projection/calendar drift risk and the "a handful of items" copy claim. Read-only;
every number is produced from source with the scripts in section 1. No repo file other
than this doc was touched.

## 0. Source of truth

| Thing | Location |
|---|---|
| Runtime bank | `ORDERLE_BANK` in `src/utils/puzzleGenerator.ts` lines 26-112 |
| Game logic (order engine) | `src/utils/orderleLogic.ts` (`initOrderleState`, `orderleFeedback`) |
| Play page (rotation + swap UI) | `src/pages/OrderlePage.tsx` lines 18-35 |
| Home page (today's card) | `src/pages/OrderleHome.tsx` lines 6-14 |
| Calendar (projection reader) | `src/pages/OrderleCalendar.tsx` → `public/data/dailybrain-puzzles.json` |
| Projection regenerator | `scripts/sustain/keepers/export-dailybrain.mjs` (`readBank`) |
| Build-time validator | `vite.config.ts` lines 4-11 → `validateAll()` → `validateOrderlePuzzle()` (`puzzleGenerator.ts` lines 212-236) |

Rotation rule (identical in Page/Home/Calendar): `index = ((utcDaysSince(LAUNCH='2026-08-07')) % BANK.length + len) % len`.
The weekday scheduler `generateOrderleForDate()` still exists in
`puzzleGenerator.ts` lines 186-202 but is **exported and unused** — the pages index the
flat bank directly, so the scheduler's Monday=cooking…Saturday=mixed map has no effect.

Build-time gate: `vite.config.ts` runs `validateAll()` at module load and
`process.exit(1)` on any ORDERLE/FERMI error. `validateOrderlePuzzle()` checks only:
`items.length >= 3`, `rule` present, `reveal` length >= 20, `citation` present, no
duplicate item *strings within one puzzle*. It does **not** validate the `difficulty`
value, the `category`, or whether the sequence is factually correct.

## 1. Method / exact commands

Extraction uses the repo's own text parser `scripts/sustain/tsbank.mjs` (`readBank`),
so the numbers are the exact objects the runtime imports. Scripts were written to
scratch (`C:/Users/veria/AppData/Local/hermes/cache/scratch/orderle-audit.mjs`,
`dump.mjs`, `win.mjs`), never into the repo.

```bash
node "C:/Users/veria/AppData/Local/hermes/cache/scratch/orderle-audit.mjs"   # inventory, dupes, projection, rotation
node "C:/Users/veria/AppData/Local/hermes/cache/scratch/dump.mjs"            # full item dump
node "C:/Users/veria/AppData/Local/hermes/cache/scratch/win.mjs"             # window mixes + run length
```

Key output:

```
ORDERLE_BANK total: 74   FERMI_BANK total: 62
by difficulty: {"easy":37,"medium":28,"hard":9}
by category:   {"cooking":13,"science":14,"history":14,"grammar":13,"everyday":13,"mixed":3,"biology":4}
item-count histogram: {"3":1,"4":3,"5":8,"6":57,"7":2,"8":3}   reversed: 7
projection orderle: 74 | projection === bank (orderle): true
longest same-category run in bank order: 10 (cooking, starting idx 0)
NEXT 30 (2026-10-08..11-06): {easy:18, medium:9, hard:3} {science:10, cooking:10, ...}
RECENT 30 (2026-09-08..10-07): {easy:19, medium:6, hard:5} {everyday:11, grammar:9, ...}
8 citations are bare https://www.britannica.com/ (+ 2 bare .../seriouseats.com/)
```

Note: the game-comment in `export-dailybrain.mjs` and the yodoku skill both say
"60 ORDERLE / 40 FERMI" — that is stale. Actual is **74 ORDERLE / 62 FERMI**.

## 2. Inventory (74 items)

`n` = item count. Flag key: OK, REV=`reverse:true`, CITE=bare homepage source,
CONTESTED, OPINION, NEAR-DUP, AMBIG.

| # | cat | diff | rule | n | flag |
|--:|---|---|---|--:|---|
|0|cooking|easy|Making French press coffee|6|REV|
|1|cooking|easy|Baking bread from scratch|6|REV|
|2|cooking|easy|Making a cup of tea (British method)|6|REV|
|3|cooking|easy|Making pasta from scratch|6|OK|
|4|cooking|easy|Making sushi rice|6|REV|
|5|cooking|easy|Making pancakes from scratch|6|OK|
|6|cooking|easy|Roasting a chicken|6|REV|
|7|cooking|easy|Making chocolate chip cookies|6|OK|
|8|cooking|easy|Brewing pour-over coffee|6|REV|
|9|cooking|easy|Making homemade pizza|6|OK|
|10|science|easy|Water cycle|6|AMBIG(cyclic)|
|11|science|medium|The scientific method|6|OK|
|12|science|easy|Path of food through the body|6|OK|
|13|science|medium|Life cycle of a star (Sun-like)|6|OK|
|14|science|medium|Photosynthesis process|6|CONTESTED|
|15|science|medium|Rock cycle|6|OK|
|16|science|hard|Human evolution timeline|6|OK|
|17|science|hard|DNA to protein (central dogma)|6|OK|
|18|science|medium|Cell division (mitosis)|6|OK|
|19|science|medium|The carbon cycle|6|OK|
|20|history|medium|French Revolution (1789-1799)|6|OK|
|21|history|medium|History of the Roman Republic|6|OK|
|22|history|medium|World War II (1939-1945)|6|OK|
|23|history|medium|American Revolution (1765-1783)|6|OK|
|24|history|medium|Development of the internet|6|OK|
|25|history|medium|Space Race (1957-1969)|5|AMBIG|
|26|history|medium|Industrial Revolution milestones|6|OK|
|27|history|medium|Civil Rights Movement (US)|6|OK|
|28|history|medium|Renaissance timeline|6|OK|
|29|history|hard|Ancient Egypt timeline (Old to New Kingdom)|6|OK|
|30|grammar|medium|English adjective order (OSASCOMP)|5|OK|
|31|grammar|medium|Order of adverbs (MPTM)|5|CONTESTED|
|32|grammar|easy|Punctuation hierarchy|6|CONTESTED|
|33|grammar|medium|Tense timeline (past to future)|6|AMBIG|
|34|grammar|easy|Sentence building (simplest to most complex)|4|OK|
|35|grammar|easy|Parts of speech frequency in English|6|CONTESTED|
|36|grammar|medium|Article usage: definite to indefinite|6|AMBIG|
|37|grammar|easy|Writing process (academic)|6|OK|
|38|grammar|medium|Pronoun case hierarchy|6|CONTESTED|
|39|grammar|hard|Conditional sentences (most certain to least)|5|OK|
|40|everyday|easy|Sending a letter|6|OK|
|41|everyday|easy|Washing laundry|6|OK|
|42|everyday|easy|Changing a car tyre|6|OK|
|43|everyday|easy|Morning routine (optimal)|6|OPINION|
|44|everyday|easy|Grocery shopping efficiently|6|OPINION|
|45|everyday|easy|Packing for a trip|6|OPINION|
|46|everyday|easy|Setting up a new phone|6|OK|
|47|everyday|easy|Writing a resume|6|OPINION|
|48|everyday|easy|Making a budget|6|OPINION|
|49|everyday|easy|Planning a dinner party|6|REV,OPINION|
|50|mixed|medium|Solar system planets by distance from Sun|8|OK|
|51|science|hard|Electromagnetic spectrum (lowest to highest energy)|7|OK|
|52|history|hard|Seven Wonders of the Ancient World (chronological)|7|CONTESTED|
|53|biology|medium|Taxonomic ranks (broadest to most specific)|8|OK|
|54|everyday|easy|Steps to buy a house|6|OK|
|55|science|hard|Geological time scale (earliest to most recent)|6|OK|
|56|grammar|easy|Story structure (classic narrative arc)|6|OK|
|57|history|hard|Ancient Greek philosophers (chronological)|6|OK|
|58|cooking|easy|Knife skills: vegetable prep order|6|OK|
|59|biology|medium|Levels of organisation in the body|8|OK|
|60|cooking|easy|Making a basic vinaigrette|5|CITE|
|61|cooking|easy|Resting and carving a roast|5|CITE|
|62|science|easy|Life cycle of a butterfly|4|NEAR-DUP,CITE|
|63|science|hard|How a hurricane forms|6|OK|
|64|history|medium|The first seventy years of human flight|5|CITE,AMBIG(73y)|
|65|history|medium|The fall of the Berlin Wall and reunification|5|OK,CITE|
|66|grammar|easy|Ordering the parts of a formal letter|6|OK,CITE|
|67|grammar|medium|Structuring a persuasive speech|6|OPINION,CITE|
|68|everyday|easy|Tying a shoelace with the loop method|6|OK,CITE|
|69|everyday|easy|Renewing a passport|6|OK,CITE|
|70|mixed|easy|Units of digital storage, smallest to largest|6|OK|
|71|mixed|medium|Periods of the Mesozoic Era, earliest to latest|3|OK|
|72|biology|easy|Development of a honey bee|4|NEAR-DUP,CITE|
|73|biology|medium|One heartbeat through the heart's chambers|6|OK|

## 3. Item-level findings

**Verifiable and unambiguous (the large majority, ~60/74).** Chronologies
(#20-24, 26-29, 57, 64, 65), process sequences (#0-9, 40-42, 58, 60, 61), and
hierarchy/size orderings (#50, 51, 53, 55, 70, 71) are correct against standard
references and carry real sources.

**Flagged (14 items need a change or a rewrite):**

- **#35 Parts of speech frequency** — likely wrong, and it contradicts its own reveal.
  The items rank noun > verb > adjective > adverb > preposition > conjunction; the
  reveal then says "Prepositions are the most frequently used closed class … ~10% of
  all words." By token frequency prepositions sit near the *top*, not 5th of 6. This is
  the single most defensible "wrong" item.
- **#52 Seven Wonders (chronological)** — order error. Conventional chronologies place
  the Temple of Artemis (~550 BCE) **before** the Statue of Zeus (~435 BCE); the bank
  ranks Zeus first. The Hanging Gardens' existence is also disputed. Not a clean
  factual sequence.
- **#32 Punctuation hierarchy**, **#36 Article usage**, **#38 Pronoun case hierarchy**,
  **#33 Tense timeline** — no canonical published ordering exists for these; the
  sequence is the author's convention. #33 in particular ranks simple present before
  present continuous (both "present" = arbitrary). A player cannot derive these; they
  are guess-the-author.
- **#31 Order of adverbs (MPTM)** — the manner-place-frequency-time stack is a real but
  contested teaching rule; "frequency before time" reads backwards to most players.
- **#14 Photosynthesis** — "oxygen released" is placed last, after glucose, but O2
  evolves during the light reactions (the water-splitting step, item 2). Contested.
- **#25 Space Race** — two items share the year 1961 (Gagarin, April; JFK speech, May);
  the player is only given years, so the tie is unresolvable from the stated facts.
- **#10 Water cycle** — a cycle has no canonical start; "evaporation (repeat)" makes the
  start point explicit but the ordering is still arbitrary within the loop.
- **#43 Morning routine, #44 Grocery shopping, #45 Packing, #47 Resume, #48 Budget,
  #67 Persuasive speech** — opinion/advisory, not falsifiable fact ("optimal",
  "you won't need it", "don't apologise"). #43 has no source beyond a general
  sleep-hygiene page. #44 also orders "make a list" before "check pantry" (arguably
  reversed).
- **#64 “seventy years of human flight”** — spans 1903-1976 = 73 years; the reveal
  itself says 73. Title off by three.

**Duplicates / near-duplicates:** none by exact text or item-set, but **#62 Life cycle
of a butterfly** and **#72 Development of a honey bee** are the same puzzle (egg > larva
> pupa > adult, complete metamorphosis) in two categories — a near-duplicate concept for
a player.

**Citations:** 8 items cite the bare `https://www.britannica.com/` homepage (no article
path) and 2 cite bare `https://www.seriouseats.com/` — 10 of 74 give no specific source.
The About page promises "a citation to a published source," which these do not meet.

**`reverse` flag:** 7 items (#0,1,2,4,6,8,49) carry `reverse:true`. The engine
(`initOrderleState`, orderleLogic.ts line 98) sets `answer = [...items].reverse()`, so
the accepted sequence is the **reverse** of the authored list. Every one of those 7
lists is authored in forward (correct) order, so the accepted answer is the reverse of
the natural, documented steps — and the reveal text still explains the forward process.
The play badge shows "· REVERSED" but how-to-play and About never explain it. Either
document it as a deliberate reverse-ordering variant or drop the flag; as-is it is
under-explained and the reveal contradicts the answer.

## 4. Difficulty mix

Bank totals: **easy 37 (50%), medium 28 (38%), hard 9 (12%).**

| Window | easy | medium | hard |
|---|--:|--:|--:|
| Whole bank (74) | 37 | 28 | 9 |
| Recent 30d (2026-09-08..10-07) | 19 | 6 | 5 |
| Next 30d (2026-10-08..11-06) | 18 | 9 | 3 |

Both 30-day windows are ~60-63% easy and only 3-5 hard — the sampled rotation is
easier than the bank average because the pointer happened to be sweeping the
easy-heavy front half. Hard items are scarce bank-wide (9), and stock is thin for a
daily game.

## 5. Rotation variety

Index advances by 1 per UTC day modulo 74, and the bank is grouped by category in
blocks. Consequences:

- No repeats inside 30 days (30 distinct indices).
- **Category clumping:** the longest run of one category in bank order is **10**
  consecutive days (cooking idx 0-9; the same holds for science 10-19, history 20-29,
  grammar 30-39, everyday 40-49). The next 30 days serve **20 of 30 from just two
  categories** (science 10 + cooking 10); the recent 30 had 11 straight "everyday".
  A player meets the same theme for a week-plus at a time.
- Difficulty clumps too: 40 of 73 adjacent bank pairs share a difficulty.

## 6. Projection / calendar / copy

- `public/data/dailybrain-puzzles.json` orderle array (74) is **byte-identical to the
  bank** — no drift. This was the known risk and it is currently clean. FERMI also
  matches (62). Re-run `node scripts/sustain/keepers/export-dailybrain.mjs` (dry-run) after
  any bank edit to confirm.
- **Copy bug:** `OrderleCalendar.tsx` line 60 says "Puzzles cycle every **45 days**";
  the real cycle is **74 days**. (Sibling bug: `FermiCalendar.tsx` says 40, bank is 62.)
- **"A handful of items" is accurate:** 57 of 74 puzzles have exactly 6 items; range is
  3-8. The how-to-play "usually six" is correct.

## 7. Verdict

The bank is mostly sound: real, sourced, checkable orderings, correct difficulty
typing, and a clean projection file. The problems are concentrated and fixable:
5-6 genuinely ambiguous/opinion items, one outright ordering error (#52), one
self-contradicting item (#35), a near-duplicate pair, thin hard-mode stock, a clumpy
rotation, a stale calendar copy figure, and an under-documented `reverse` flag. This is
a "keep and fix," not an "ease" — the game is already easy-leaning (50% easy, 60%+ in
sampled windows), so easing would make it worse; the fix is correctness, variety, and a
few more hard puzzles.

## DECISION TABLE

| Aspect | Keep or change | Exact numbers | Why |
|---|---|---|---|
| Bank size / sources | KEEP | 74 items; ~60 fully verifiable | Real, checkable sequences with real sources |
| Difficulty storage (word) | KEEP | easy 37 / medium 28 / hard 9, all words | Correct per repo rule; validator does not check it anyway |
| Difficulty mix | CHANGE | 50% easy; sampled windows 18-19/30 easy, only 3-5 hard | Easy-heavy; hard stock (9) too thin for a daily game |
| Items per puzzle | KEEP | 6 in 57/74, range 3-8 | Matches "a handful"/"usually six" copy |
| Ambiguous/opinion items | CHANGE | 14 flagged (#14,25,31,32,33,35,36,38,43,44,45,47,48,52,67) | Guess-the-author or opinion; #35 self-contradicts, #52 order error |
| Duplicates | CHANGE | 1 near-dup pair (#62 butterfly / #72 honey bee) | Same puzzle served under two categories |
| Citations | CHANGE | 10/74 bare homepage URLs | Breaks the About "published source" promise |
| `reverse` flag | CHANGE | 7 items (#0,1,2,4,6,8,49) | Answer silently inverted; undocumented; reveal contradicts it |
| Rotation variety | CHANGE | max run 10 days; next 30d = 20/30 in 2 categories | Week-long same-category clumps; interleave/shuffle bank order |
| Projection sync | KEEP | orderle 74 = bank 74 (exact) | No drift currently; re-run export keeper after edits |
| Calendar copy | CHANGE | says "45 days", actual 74 | Wrong figure shown to players (Fermi also wrong: 40 vs 62) |

**Recommended default:** KEEP the bank, its difficulty typing, and the projection
routine. CHANGE five things: (1) fix the calendar figure "45 days" -> "74 days";
(2) rewrite or replace the 5 grammar ambiguity items (#32,#33,#35,#36,#38) and correct
#52's order and #14's wording; (3) remove the butterfly/honey-bee near-duplicate;
(4) shuffle or interleave the bank order to break the 10-day category runs; (5) either
document the `reverse` flag in how-to-play or clear it, and upgrade the 10 bare-page
citations. Do not ease difficulty — add 3-5 hard items instead.
