# 00 — The Yodoku Vocabulary Standard

Status: PROPOSAL (read-only audit; no data/code/script file was modified).
Author: Vocabulary Curator. Date: 2026-10-08.
Scope: the one shared vocabulary standard that every word-bearing game is judged
against, an audit of the curated list itself, and the cross-game consistency table.

---

## 0. Summary of the verdict

The app promises **"seven daily games, one minute each."** Measured against a
one-minute, casual-phone-player standard, the game data is highly inconsistent:

| Game | Verdict |
|---|---|
| Change by One | Closest to fair (start/end tokens all come from the curated list), but ~25% of tokens are junk-class and the shared dictionary carries ~500 bad entries. |
| Word Pool | Mostly fair (52% within the hard bar), but category lists carry film-crew jargon and foreign cooking terms. |
| 7 Letters | **Unfair** — 0 of 180 boards are all-fair; answers are drawn from the uncurated dictionary (`hrer`-type non-words, `dital`, `fusain`). |
| Clear the String | **Severely unfair** — 0 of 4,122 puzzles have all-fair answers; 89% of hard answers are outside the curated list (`cuneator`, `hydatina`, `ulmaceae`). |
| ORDERLE / FERMI / Quiz Master | Not word-production games (phrases / numbers / trivia). Out of scope for vocabulary fairness; noted for completeness. |

The single root cause: **the curated list `scripts/data/english-common.txt` exists,
but only Change by One actually uses it.** Clear the String, 7 Letters and (to a
lesser degree) Word Pool draw their *answers* from the uncurated
`public/data/words.json`. That must stop.

---

## (a) Provenance of `scripts/data/english-common.txt`

Read from `scripts/data/PROVENANCE.md`.

- **What it is:** 17,705 curated common-English words, the intended dictionary for
  Change by One (`public/words-cbo.json`) and a fallback dictionary for Clear the
  String (so words like `hands`, `flood` are accepted).
- **Source 1 — wordfreq (MIT licence):** English frequency ranking from multiple
  corpora (Wikipedia, news, subtitles, web). The build takes
  `top_n_list('en', 20000)`. <https://github.com/rspeer/wordfreq>
- **Source 2 — dwyl/english-words `words_alpha.txt` (Unlicense / public domain):**
  a large standard English dictionary, used as a membership filter to drop
  non-words and frequency-list noise. <https://github.com/dwyl/english-words>
- **Build rule** (verbatim from PROVENANCE.md):
  ```
  curated = wordfreq_en_top_20000
              ∩ words_alpha            (must be a real dictionary word)
              − profanity/slur blocklist
              running length filter 3..8
  ```
- **Names policy:** names (`ming`, `john`) are intentionally KEPT in the dictionary
  so players may type words that double as names (`mark`, `rose`), but are excluded
  from being puzzle start/end tokens via `scripts/data/names-blocklist.txt`
  (dominictarr/random-name, 21,985 entries) — see `scripts/gen-cbo-pairs.mjs`.
- **Licence summary:** MIT (wordfreq) + Unlicense (dwyl/english-words) +
  dominant/random-name (public-data). All permissive; commercial use OK with
  attribution retained in PROVENANCE.md.

Length distribution of the committed list:

```
3: 1013   4: 2157   5: 3095   6: 3860   7: 4012   8: 3568   TOTAL 17705
```

Exact command:
```bash
wc -l scripts/data/english-common.txt scripts/data/names-blocklist.txt   # 17705 / 21985
```

---

## (b) Audit of the curated list itself

### Method

Sampled every length bucket (heads, tails, and a seeded random 40), then scored all
17,705 entries objectively with `wordfreq` Zipf frequency plus cross-language
frequency (a word whose frequency in another language exceeds its English frequency
by ≥1.5 Zipf is a foreign-language intruder, not English vocabulary).

Zipf scale: 7.0 = "the/and", ~5.0 = everyday word, ~4.0 = familiar, 3.3 = the
comfort floor, <3.0 = obscure. `scripts/data/english-common.txt` was built from the
top-20,000 band, so **its own floor is Zipf 3.0** — every entry is "known to
wordfreq", yet many are not words a player should be asked to produce.

Exact command (network: uv fetches wordfreq):
```bash
uv run --with wordfreq python scripts/vocab-audit-scratch/freq.py
```

### Bucket samples (heads / tails)

```
=== LEN 3 (n=1013) ===
HEAD20: aaa aba abc abd abe abs abt abu acc ace act ada adc add adm ado adp ads adv aes
TAIL20: yeo yep yer yes yet yew yin you yrs yum yun yup zac zak zed zee zen zig zip zoo

=== LEN 4 (n=2157) ===
HEAD20: abba abby abel able acer aces ache acid aclu acne acre acts adam adds aden aero afar afro agar aged
TAIL20: yolk york your yuan yuck yuki zach zack zeal zeke zero zest zeta zeus zinc zion zone zoom zoos zulu

=== LEN 5 (n=3095) ===
HEAD20: aaron abbas abbey abbot abide abode abort about above abuse abyss accra aches acids acorn acres acted actin actor acute
TAIL20: yahoo yanks yards years yeast yells yemen yield yikes young youre yours youth youve yukon yummy zebra zeros zoned zones

=== LEN 6 (n=3860) ===
TAIL20: wrongs yachts yankee yearly yelled yellow yemeni yields yogurt yorker yoruba youths yvonne zambia zenith zipper zodiac zombie zoning zurich

=== LEN 7 (n=4012) ===
SAMPLE40: unicorn lasagna angrily coolest results boulder entries fraught therein visited endowed fateful peugeot serious butcher existed flushed mormons located ringing balance coupons narrows ruining parlour england shaming falcons flemish mayoral linkage hippies keeping planted favored conceal pretend renters listing shifter
TAIL20: writers writing written wronged wrongly wrought wyoming yankees yawning yelling yiddish yielded yoghurt yorkers younger zealand zionism zionist zombies zoology

=== LEN 8 (n=3568) ===
TAIL20: wrapping wreckage wrecking wrestled wrestler wretched wrinkles writings wrongful yearbook yearning yielding yokohama yosemite youngest yourself youthful yugoslav zeppelin zimbabwe
```

### Findings (objective counts)

| Signal | Count | Share of 17,705 |
|---|---|---|
| Zipf ≤ 3.2 (bottom band, "familiarity floor") | 3,332 | 18.8% |
| Present in `names-blocklist.txt` (name/proper-noun risk) | 2,885 | 16.3% |
| 3-letter all-consonant tokens (abbreviation/unit risk) | 43 | 0.2% |
| Strong-foreign tokens (another language ≥1.5 Zipf higher) | 434 | 2.5% |
| **Total junk-class** (abbrev + foreign + contraction, not names) | **494** | 2.8% |
| Profanity/slurs (fuck, shit, cunt, rape, nazi, slut, whore, bitch) | 0 | clean |

The profanity screen worked (verified). The list is **not** clean of abbreviations,
foreign function words, and proper nouns.

Examples of each failure class found *inside the curated list*:

- **Abbreviation/unit:** `bbl bds cdr cfs cpl cps crc cst fps gps hrs hwy lbs lcd
  mhz mpg mph mrs msg mtg pct ppm pst pts pty pvt rms rpm sds spp std str tbs tnt
  tsp txt yrs` and the vowel-bearing acronyms `abc abd abe abt acc adc adm ado adp
  ads adv aes`.
- **Foreign function word:** `het att det che ich auf sie ist fra que qui yang dat
  kan por una das dei der dia bien apa tout para kami sus mig als pas` (Swedish,
  German, French, Spanish, Italian, Indonesian, Dutch stop/function words that
  entered via the subtitles corpus in wordfreq).
- **Proper noun:** `york yemen yukon zurich zambia zion zeus zulu algiers caspian
  canaan bastille aquinas palermo pembroke montague corinne gretchen wilfred syd lyn`.
- **Owner's own complaints confirmed inside/around the list:**
  `bac` Zipf 3.10 **curated**; `ming` Zipf 3.54 **curated** (a Chinese dynasty, not
  a word); `leno` 2.97, `ignobly` 1.27, `aplasia` 1.52, `pruritus` 2.04, `wran` 1.80,
  `zel` 1.97, `vau` 1.68 — all **not** curated (they come from `words.json`).

### PRUNE rules (a word is removed from any ANSWER pool if it hits ≥1)

- **P1 Membership false:** not in `english-common.txt` (kills `ignobly`, `aplasia`,
  `pruritus`, `wran`, `zel`, `vau`, `cuneator`, `hydatina`, `ulmaceae`).
- **P2 Too rare:** wordfreq EN Zipf < 3.3.
- **P3 Abbreviation / initialism / unit:** 3-letter all-consonant token that is not
  a real word (`bbl`, `mrs`, `mph`), or a vowel-bearing acronym (`abc`, `adc`, `adv`).
- **P4 Foreign function word:** exists in another language with Zipf ≥ own EN Zipf
  + 1.5 and ≥ 5.0 (`der`, `una`, `para`, `ich`, `che`, ...).
- **P5 Proper noun:** place, person, demonym, brand or Romanised name with no
  independent common-noun meaning (`zurich`, `zeus`, `aquinas`, `corinne`).
- **P6 Misspelled contraction / elision:** `youre`, `youve`, `isnt`, `hes`, etc.
- **P7 Offensive:** any profanity/slur (already enforced; keep enforcing).
- **P8 Length out of tier:** > tier max (easy 5, medium 6, hard 7).

### KEEP rules (a word is safe for the answer pools if it passes ALL)

- **K1** In `scripts/data/english-common.txt`.
- **K2** EN Zipf ≥ 4.0 → safe at *every* tier; ≥ 3.6 → medium+hard; ≥ 3.3 → hard only.
- **K3** Has an independent common-noun/verb/adjective meaning in English even if it
  is also a name (`mark`, `rose`, `hen`, `fin`, `will` — these stay).
- **K4** Length ≤ tier max (easy 5 / medium 6 / hard 7).
- **K5** Not P3/P4/P6/P7.
- **K6** For **player input acceptance** (typing a word the game should accept),
  the bar is looser: curated ∪ `words.json`, minus the P3/P4/P6/P7 blocklist. A
  player is never *required* to produce a word that would fail K1–K5, but should
  rarely be *punished* for a real word they type.

### Candidate PRUNE list — 50 worst entries (for a new `scripts/data/prune-blocklist.txt`)

Ranked from the objective scan (`prune2.py`); each is indefensible as an answer.

| # | Word | Zipf | Reason |
|---|---|---|---|
| 1 | `bbl` | 3.05 | abbreviation (barrel) |
| 2 | `bds` | 3.06 | abbreviation |
| 3 | `cdr` | 3.01 | abbreviation |
| 4 | `cfs` | 3.06 | abbreviation |
| 5 | `cpl` | 3.14 | abbreviation (corporal) |
| 6 | `cps` | 3.24 | abbreviation |
| 7 | `crc` | 3.06 | abbreviation |
| 8 | `cst` | 3.05 | abbreviation (timezone) |
| 9 | `fps` | 3.53 | unit (frames per second) |
| 10 | `gps` | 3.20 | abbreviation |
| 11 | `hrs` | 3.20 | abbreviation (hours) |
| 12 | `hwy` | 3.15 | abbreviation (highway) |
| 13 | `lbs` | 3.12 | unit (pounds) |
| 14 | `lcd` | 3.15 | abbreviation |
| 15 | `mhz` | 3.55 | unit (megahertz) |
| 16 | `mpg` | 3.06 | unit (miles per gallon) |
| 17 | `mph` | 3.28 | unit (miles per hour) |
| 18 | `mrs` | 3.35 | title/abbreviation |
| 19 | `msg` | 3.17 | abbreviation |
| 20 | `mtg` | 3.04 | abbreviation (meeting) |
| 21 | `het` | 3.14 | foreign (Dutch) |
| 22 | `att` | 3.22 | foreign (Swedish "to") |
| 23 | `det` | 3.38 | foreign (Swedish "it/the") |
| 24 | `che` | 3.46 | foreign (Italian "that/who") |
| 25 | `ich` | 3.22 | foreign (German "I") |
| 26 | `auf` | 3.09 | foreign (German "on") |
| 27 | `sie` | 3.06 | foreign (German "she/they") |
| 28 | `ist` | 3.35 | foreign (German "is") |
| 29 | `fra` | 3.09 | foreign (Norwegian "from") |
| 30 | `que` | 3.84 | foreign (Spanish/French "that") |
| 31 | `qui` | 3.32 | foreign (French "who") |
| 32 | `yang` | 3.91 | proper/foreign (Chinese concept) |
| 33 | `dat` | 3.55 | foreign (Dutch "that") |
| 34 | `kan` | 3.37 | foreign (Danish "can") |
| 35 | `por` | 3.50 | foreign (Spanish "by/for") |
| 36 | `una` | 3.44 | foreign (Spanish "a/one") |
| 37 | `das` | 3.73 | foreign (German "the") |
| 38 | `dei` | 3.29 | foreign (Italian "of the") |
| 39 | `der` | 4.16 | foreign (German "the") |
| 40 | `bien` | 3.10 | foreign (French "well/good") |
| 41 | `para` | 3.85 | foreign (Spanish/Portuguese "for") |
| 42 | `york` | 3.98 | proper noun (city) |
| 43 | `yemen` | 3.65 | proper noun (country) |
| 44 | `yukon` | 3.74 | proper noun (region) |
| 45 | `zurich` | 3.99 | proper noun (city) |
| 46 | `zambia` | 4.05 | proper noun (country) |
| 47 | `algiers` | 3.20 | proper noun (city) |
| 48 | `caspian` | 3.27 | proper noun (sea) |
| 49 | `canaan` | 3.13 | proper noun (region) |
| 50 | `palermo` | 3.54 | proper noun (city) |

(The audit's full junk-class set is ~494 entries; this is the ranked top 50. The
complete set is reproducible with `prune2.py`.)

---

## (c) The numeric standard per difficulty tier

**"Answer word"** = a single English word the player must produce or recognise as
part of a solution: Clear the String targets, 7 Letters words, Word Pool typed
words, Change by One start/end tokens.

A word is **FAIR at tier T** if it passes gates K1–K5 above. The numeric standard:

| Tier | List membership | EN Zipf floor | Max length | Max distinct answers / puzzle | Required share of answers passing the tier bar |
|---|---|---|---|---|---|
| **Easy** | `english-common.txt` | **≥ 4.0** | **5** | **5** | **100%** |
| **Medium** | `english-common.txt` | **≥ 3.6** | **6** | **7** | **≥ 90%** |
| **Hard** | `english-common.txt` | **≥ 3.3** | **7** | **9** | **≥ 80%** |

Rationale (the "one minute" promise):

- **Zipf ≥ 4.0** ≈ the ~top-4,000 English words — a casual player recognises and
  produces it within seconds. This is the Easy bar.
- **Zipf ≥ 3.6** ≈ top-12,000 — recognisable on sight, producible in a few seconds.
  Medium bar.
- **Zipf ≥ 3.3** ≈ top-20,000 — the floor of "a general adult knows this word".
  Below 3.3 (`fetor`, `ablaut`, `hydatina`) it becomes trivia, not a game. Hard bar.
- **Length caps (5/6/7)** keep typing effort inside one minute; a 7-letter floor is
  the app's own dictionary ceiling (8), trimmed by one to leave headroom.
- **Count caps** bound how much a player must produce: 5 / 7 / 9.

**Score for a game/puzzle** = `% of its answer words that pass the tier bar`. A
puzzle is **on-standard** only if it clears the "Required share" for its tier and
no answer is junk-class. Any answer outside the tier's Zipf floor = a "stretch"
answer; a stretch answer must never be the one needed to finish the puzzle.

Note: Easy must be 100% because there is no hint slack; Hard allows ≤20% stretch
because hints exist, but a stretch answer still may not be the sole blocker.

---

## (d) Cross-game consistency table

Measured directly from the shipped data files (percentages are of the game's
**unique** answer words; 5,786 for 7 Letters, etc.). "Within standard" = passes
K1 (`english-common.txt`) + K4 (len ≤ 7) + the Hard Zipf floor 3.3 + no junk.

| Game | Pool file | # answer tokens | unique | % Easy bar (z≥4.0) | % Medium bar (z≥3.6) | % Hard bar (z≥3.3) | Junk-class |
|---|---|---|---|---|---|---|---|
| **Clear the String** | `public/data/lettermix-puzzles.json` | 28,854 | 25,370 | **3%** | **6%** | **11%** | 509 |
| **7 Letters** | `public/data/seven-boards.json` | 11,703 | 5,786 | **13%** | 20% | **25%** | 365 |
| **Word Pool** | `public/data/wordpool-categories.json` | 3,220 | 2,304 | 18% | 35% | 52% | 37 |
| **Change by One** | `public/cbo-pairs-{4..7}.json` | 3,200 | 2,211 | 23% | 47% | **75%** | 42 |
| *(Change by One dictionary)* | `public/words-cbo.json` = `english-common.txt` | 17,705 | 17,705 | 12% | 30% | 57% | 494 |
| **ORDERLE** | `ORDERLE_BANK` in `src/utils/puzzleGenerator.ts` | 74 puzzles (7 categories) | — | n/a | n/a | n/a | — |
| **FERMI** | `FERMI_BANK` in `src/utils/puzzleGenerator.ts` | 63 puzzles (13 categories) | — | n/a | n/a | n/a | — |
| **Quiz Master** | `public/data/quiz-bank.json` | 1,224 questions / 11 cat. | — | n/a | n/a | n/a | — |

Per-tier detail for Clear the String (answers required = exactly 5/7/9 per puzzle):

| Level | Puzzles | % answers curated | Worst sample answers (Zipf) |
|---|---|---|---|
| easy | 1,374 | 40% | `fetor dalk bedip drail gulfy orant gynic snurl strit yarb ripal taen ureic wese plap` |
| medium | 1,374 | 17% | `duggler leeky reheel cynism abider bedip tidley cereous milsey whone fuder galeid witoto dilater sozzle` |
| hard | 1,374 | 9% | `cuneator bolelia deckhead demivolt refledge aecidial molecast anvasser medianic backband shawled repealer ulmaceae hydatina jesuitry` |

Puzzles whose answers are **all** on-standard: Clear the String **0/4,122**;
7 Letters **0/180 boards** (worst words `dital hler sorda bedral pily alisp fusain
aurite stema thecia scler pomane macule puist trifoly prasine navet delawn reub
coelia`).

What could **not** be measured, and why:

- **Change by One ladder difficulty:** the pool files store only start/end tokens +
  `optimal_steps`; the intermediate words the player must find come from the whole
  `words-cbo.json`, so per-puzzle fairness depends on the dictionary (57% within the
  Hard bar) — measured here at the dictionary level, not per path.
- **Clear the String accepted-but-not-required words:** the game validates extra
  submissions against `public/data/words.json` (15.5 MB, uncurated); only the
  required `solutionWords` were scored. The input-acceptance side is looser by design
  and was not fully enumerated.
- **Word Pool per-category fairness:** measured across all 45 categories pooled;
  category-level split would need the same script scoped per category.
- **ORDERLE/FERMI/Quiz:** not single-word production; vocabulary Zipf does not apply.

Exact commands used:
```bash
# dictionary stats
node -e "…by-length counts…"                 # 3:1013 … 8:3568 TOTAL 17705
# rarity + cross-language scan (network: uv pulls wordfreq)
uv run --with wordfreq python scripts/vocab-audit-scratch/freq.py     # 60 rarest
uv run --with wordfreq python scripts/vocab-audit-scratch/freq3.py    # abbrev + foreign + rare
uv run --with wordfreq python scripts/vocab-audit-scratch/table.py    # cross-game table
```

Key raw outputs are quoted inline above; the scratch scripts are regenerable from
this document (they are throwaway analysis, not committed).

---

## (e) One shared pool as the single source of truth?

**Recommendation: YES — but the curated list must be cleaned first.**

`scripts/data/english-common.txt` + `scripts/data/names-blocklist.txt` should be
the **single source of truth for every word game**, with per-game answer pools
**derived** (generated) from it rather than authored ad hoc. Today only Change by One
honours it; Clear the String and 7 Letters bypass it via `words.json`, which is the
root cause of every "humanly impossible" report.

The architecture to adopt:

```
scripts/data/english-common.txt        (17,705 curated — source of truth)
scripts/data/names-blocklist.txt       (21,985 names — token exclusion)
scripts/data/prune-blocklist.txt       (NEW, ~500 — abbrev/foreign/proper; this audit)
scripts/data/safety-blocklist.txt      (NEW — profanity/slurs, currently inside the build)
        │
        └─ (build script) → per-game DERIVED answer pools, tiered by Zipf:
             easy   = curated − names − prune − safety, Zipf ≥ 4.0, len ≤ 5
             medium = . . .                              Zipf ≥ 3.6, len ≤ 6
             hard   = . . .                              Zipf ≥ 3.3, len ≤ 7
```

Two derived files per game would be cleanest: an **answer pool** (strict) and an
**input-acceptance** list (looser: curated ∪ words.json − safety, so typing a real
word is not punished).

### File-by-file changes required (no edits made — this is the plan)

1. **`scripts/data/english-common.txt`** — do NOT hand-edit; regenerate through the
   build script with the two new blocklists applied. Outcome: the curated set loses
   its ~494 junk-class entries.
2. **NEW `scripts/data/prune-blocklist.txt`** — the ~500 entries from section (b).
3. **NEW `scripts/data/safety-blocklist.txt`** — promote the inline profanity list
   out of the build script so every game can consult it.
4. **`scripts/build-cbo-words.mjs`** — apply `prune-blocklist` + `safety-blocklist`;
   emit `public/words-cbo.json` (answer tier) and a new `public/words-accept.json`
   (input tier).
5. **`public/words-cbo.json`** — regenerate (Change by One dictionary). Removes
   `bac`, `ming`, `der`, `una`, etc. from accepted answers.
6. **`scripts/gen-cbo-pairs.mjs`** — exclude `prune-blocklist` (as well as the
   existing `names-blocklist`) from start/end tokens.
7. **`public/cbo-pairs-{4,5,6,7}.json`** — regenerate / filter so no pair has a
   junk token (931/1,600 pairs are already fully on-standard; the other 669 need a
   re-draw or a token swap). The pair files have an append/regen guard — treat this
   as a forward-only repair, quarantining (not rewriting) published pairs that fail.
8. **Clear the String generation** — `scripts/generateLetterMixPuzzles.js` (+ its
   keeper in `scripts/sustain/keepers/`) currently sources `solutionWords` from
   `public/data/words.json`. Change the source to the derived per-length curated
   pool. Published puzzles cannot be regenerated (history guard), so add a
   forward-only safe mode and quarantine the on-disk puzzles whose answers fail the
   tier bar (currently 4,122/4,122 fail Easy).
9. **7 Letters generation** — `scripts/generate-seven-boards.mjs` must intersect the
   flattened `words.json` with the curated pool before board creation. Regenerate
   boards 60+ forward-only (note: `SevenLettersHome` still hardcodes 60 boards);
   quarantine the 180 existing junk boards.
10. **`public/data/wordpool-categories.json`** — no generator exists; audit each
    category list and drop/​replace the non-fair entries (`ecarte`, `fouette`,
    `shikra`, `spokeshave`, `keygrip`, `bestboy`, `vantoon`-class). 52% are already
    on-standard; 24% are below Zipf 3.0.
11. **`public/data/words.json`** — demote to **input-acceptance fallback only**;
    never an answer source. Optionally split into `words-accept.json`.
12. **`src/utils/puzzleGenerator.ts`** (ORDERLE/FERMI banks) — no vocabulary change;
    these are phrase/number puzzles. Leave as-is.
13. **`scripts/quiz-bank/` + `public/data/quiz-bank.json`** — no vocabulary change;
    trivia text, out of scope.

---

## DECISION TABLE

| # | Decision | Recommendation | Rationale |
|---|---|---|---|
| D1 | Single source of truth for all word games | **Adopt** `english-common.txt` + `names-blocklist.txt` + new `prune-blocklist.txt` + `safety-blocklist.txt`; per-game pools derived | Only CBO honours the curated list today; that is the root cause of unfair puzzles |
| D2 | Clean the curated list itself | **Prune** the ~494 junk-class entries (abbrev/foreign/proper) via the new blocklist | `bac`, `ming`, `der`, `una` are in the "curated" list yet indefensible |
| D3 | Answer-fairness bar | **Easy Zipf ≥ 4.0 / ≤5 letters / 5 words; Medium ≥ 3.6 / ≤6 / 7; Hard ≥ 3.3 / ≤7 / 9** | Anchors to "one minute" and casual recognition |
| D4 | Clear the String | **Unfair today (0/4,122 puzzles on-standard) — must be rebuilt forward-only** from the curated pool and existing puzzles quarantined | 82% of answers are outside the curated list (`cuneator`, `ulmaceae`) |
| D5 | 7 Letters | **Unfair today (0/180 boards on-standard) — regenerate boards from the curated pool** | 64% of words outside the curated list (`hrer`, `dital`, `fusain`) |
| D6 | Change by One | **Mostly fair (931/1,600 pairs, 75% of tokens) — fix the 669 junk-token pairs and the 494-entry dictionary** | Uses the curated list but inherits its junk |
| D7 | Word Pool | **Mostly fair (52% hard-bar) — audit 45 category lists, drop jargon/foreign terms** | `keygrip`, `spokeshave`, `ecarte`, `fouette` |
| D8 | Input acceptance vs answer pool | **Two lists per game:** strict answers (curated-derived) + loose input acceptance (curated ∪ words.json − safety) | Never require an unfair word; rarely punish a real one |
| D9 | ORDERLE / FERMI / Quiz | **No vocab change** — phrase/number/trivia games | Zipf standard does not apply |
| D10 | Execution | **Read-only audit; nothing edited.** All changes are proposals for the owner to approve | Owner is a non-developer; changes must be staged and reversible |

---

*End of 00-vocabulary-standard.md. No data, code or script file was modified to
produce this audit; the only written artifact is this document.*
