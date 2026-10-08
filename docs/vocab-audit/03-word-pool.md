# Word Pool — category / difficulty audit (03)

Scope: fairness and guessability of the Word Pool answer lists, the 6-level difficulty
curve, junk/obscurity, and data hygiene. Read-only audit — no data, code or script in the
repo was changed; only this file was written. All numbers are produced from source with the
throwaway scripts in section 1.

## 0. Source of truth

| Thing | Location |
|---|---|
| Runtime data | `public/data/wordpool-categories.json` |
| Game page / level gate | `src/pages/WordPoolPage.tsx` (`handleSubmit`, physical-key handler) |
| Daily category pick | `src/pages/WordPoolHome.tsx` + `getDailyPuzzleIndex` (`src/utils/dailySeed.ts`) |
| Keyboard | `src/components/OnScreenKeyboard.tsx` (QWERTY, no space bar) |
| Hints | `src/utils/wordpoolHints.ts` |
| Fairness bar | `scripts/data/english-common.txt` (17,705 = wordfreq top-20k ∩ words_alpha, len 3-8) |
| Names blocklist | `scripts/data/names-blocklist.txt` (21,985) |

Actual file shape: **45 categories** (the brief said 35) × 6 levels = **270 levels**,
**3,220 answer slots**, **2,304 unique words**. Every category has exactly 6 levels; no
empty levels.

Mechanics that matter for fairness: Word Pool is **free typing, not a letter set**. There
is no anagram pool and no per-level alphabet. The player sees only the level name, the word
count, and the length histogram, then must type words that `level.words.includes(word)`
matches **exactly** (`WordPoolPage.tsx`). A wrong word is rejected and left in the input
buffer (the known quirk). So "guessability" = "can a normal player guess these exact words
from a category label alone".

## 1. Commands run

```bash
# bar = curated common-English list + names blocklist
head -5 scripts/data/english-common.txt ; wc -l scripts/data/english-common.txt   # 17705
# frequency/obscurity scoring: wordfreq zipf (0-8; ~4 = common, <2.5 = rare)
uv run --with wordfreq python wp_analyze.py      # per-category/level stats, dupes, offenders
uv run --with wordfreq python wp_examples.py     # full level dumps with per-word zipf
node -e "<dump words with chars outside a-z / <3 chars>"   # untypeable-answer scan
```

Bar membership and `zipf_frequency()` are the two fairness rulers: "in the bar" = the
project's own definition of a common word; zipf measures how likely a player is to recall
the word at all.

## 2. Findings

### (a) Out-of-bar rate, per category and per level

A slot is "out of bar" if it is absent from `english-common.txt`. Split by kind:

| L | levels | words | avg words/lvl | avg len | **% out-of-bar** | **% out-of-bar, single ≤8-char word** |
|---|---|---|---|---|---|---|
| 1 | 45 | 917 | 20.4 | 5.55 | 14.6% | 10.5% |
| 2 | 45 | 659 | 14.6 | 6.10 | 32.0% | 23.7% |
| 3 | 45 | 524 | 11.6 | 6.30 | 34.2% | 24.6% |
| 4 | 45 | 423 | 9.4 | 7.06 | 40.9% | **27.9%** |
| 5 | 45 | 381 | 8.5 | 6.67 | 40.9% | **30.7%** |
| 6 | 45 | 316 | 7.0 | 6.94 | 36.1% | 25.9% |

Overall: **967/3,220 (30.0%)** of slots are out of bar — **698 (21.7%)** are single
≤8-letter words genuinely missing from the curated common list; 260 are >8 letters (auto-out,
since the bar stops at 8) and 71 are multiword/hyphenated.

Worst examples (single ≤8-char answers absent from the curated bar):

- `birds` L1 "Garden Birds": dunnock, siskin, linnet, serin, jackdaw (7/23 = 30%)
- `dance` L1 "Dance Styles": mambo, flamenco, bolero, minuet, gavotte, conga, mazurka, fandango (11/25 = 44%)
- `birds` L4 "Songbirds and Warblers": warbler, redstart, wheatear, whinchat, redwing, blackcap, pipit, wagtail (18/20 = 90%)
- `military` L3 "Pole Weapons": halberd, glaive, voulge, partizan, spontoon (5/8 = 62%)
- `science` L3 "Quarks & Leptons": lepton, muon, neutrino, gluon (4/6 = 66%)

### (b) Obscurity within the bar

**41.9% of all slots (1,350/3,220) score zipf < 3.5** (rare); only **15.9% (513)** score
zipf ≥ 4.5 (core, readily recalled). Even words that *are* in the bar are frequently
unguessable in a one-minute window. Top offenders (lowest zipf; a player must type these
exactly):

`braiser, jacamar, spokeshave, pantoum, shikra, ecarte, spontoon, fouette, voulge, guyline,
rainfly, keygrip, bestboy, snowsquall, focuspuller` (zipf ≈ 0), then
`dutyfree, fueler, deicer, cotinga, whinchat, shawm, lyrebird, glissade, senet, trogon,
dunnock, sestina, clapperboard, jete, dotterel, throstle, rondel, manakin, motmot, cocotte,
redpoll, lorikeet, cabriole, habanera, tisane, lacewing, triticale, stockpot, bivy, tailcoat,
cortado, hawser, mancala, floribunda, pinnace, gunwale, wheatear, myna, siskin, waxwing`
(zipf 1.0-1.7).

Notable clusters, all answers the player must produce from a label:
- Classical French ballet terms under `dance` L2/L5: fouette, jete, glissade, efface,
  chasse, cabriole, ecarte, saut, fondu, chignon.
- Bird species (a whole family of categories): ~10 sub-levels of warblers, waders and
  tropical species (`birds` L1-L5 avg zipf 3.17 / 2.71 / 2.87 / 2.12 / 1.94).
- Medieval polearms (`military` L3-L6): voulge, spontoon, glaive, partizan, halberd.
- Fixed-form poetry (`literature` L3-L6): pantoum, sestina, villanelle, rondel, ghazal.
- 2-char CPU-cache tokens `l1, l2, l3` (`technology` L5/L6).

Also 327 answer words appear in the names blocklist, but almost all are legitimate common
nouns (apple, bank, axe, ash) — not a junk signal by itself.

### (c) Difficulty curve across the 6 levels

Aggregate curve **is** monotonic and in the right direction:

- avg zipf: 4.00 → 3.57 → 3.44 → 3.26 → 3.16 → 3.12
- % obscure (zipf<3.5): 23.9 → 43.9 → 47.7 → 55.3 → 58.7 → 61.1
- words/level: 20.4 → 14.6 → 11.6 → 9.4 → 8.5 → 7.0
- % core (zipf≥4.5): 26.9 → 14.3 → 11.1 → 8.7 → 7.3 → 6.1

But it is **noisy per category**: only **2/45** categories have a strictly non-increasing
avg-zipf curve across L1→L6; 31/45 shrink in count. Sample curves (avg zipf L1..L6):
`animals [4.39,3.76,3.40,3.66,3.46,3.68]`, `dance` (see below), `music [3.42,3.14,3.12,3.01,
2.22,2.61]`, `food_extended [4.09,3.38,2.73,2.55,2.52,2.60]`. The dominant failure is that
**L1 is a 20-25-word grab-bag** (e.g. `dance` L1 = 25 words, avg zipf 3.03, including
gavotte/beguine/habanera/mazurka) so the "easy" level is often harder than L6.

Word-length mix: length rises 5.55 → ~7.0 chars toward L6, plus 260 slots >8 letters and
71 multiword answers concentrated in L2-L6.

Levels where **every** answer is obscure (all zipf<3.2): **29/270**. 19 levels have ≤2 words
(the whole level hinges on one or two obscure guesses).

### (d) Guessability reality check — the headline defect

The on-screen keyboard (`OnScreenKeyboard.tsx`) has **no space bar**, the physical-key
handler only accepts `/^[a-zA-Z]$/` + Backspace + Enter, and `handleSubmit` requires an
**exact** `level.words.includes(word)` match including internal spaces/hyphens. Therefore
**any multiword, hyphenated, or digit-containing answer is physically untypeable**, and a
level that contains one **can never be completed** — which hard-blocks every later level in
that category (levels unlock sequentially).

- **42 levels contain at least one untypeable answer.**
- **12 of 45 categories are hard-blocked from that level onward:**
  `sports (L6), music (L5), technology (L2), weather (L2), clothing (L2), marine (L2),
  kitchen (L2), school (L2), insects (L4), environment (L3), medicine (L3), ancient_civ (L3)`.
- Examples: `school` L4 "Types of Pencil" = {mechanical pencil, colored pencil, grease
  pencil, carpenter pencil, kohl pencil} → all 5 untypeable; `technology` L6 "CPU Cache
  Levels" = {l1, l2, l3}; `medicine` L3 = {x-ray, ct scan, …}; `ancient_civ` L3-L6 all
  require "ptolemaic egypt".

Player-effort vs the "one minute per game" promise: the daily Word Pool requires clearing
**all 6 levels of one category** = **~72 answer words on average** (range 26-126), each an
exact hidden match from a category label. Even the good, small levels (`animals` L6 "Large
African Cats" = lion/leopard/cheetah) are fine, but `dance` L1 (25 obscure words), `birds`
L4-L5 (warbler/whinchat/manakin/cotinga) and every blocked category are impossible in any
time budget, let alone one minute.

### (e) Data hygiene

- **Within-level duplicates: 0.** No empty levels, no null/uppercase entries.
- **Cross-category reuse: 40 words** (33 words in 2 categories, 7 in 3: tea, plane, canoe,
  kayak, rose, actor, cricket…). Benign — words legitimately span categories.
- **Junk / malformed answers:** `l1, l2, l3` (technology L5/L6), `ra` (mythology L1, 2
  letters), `go` (games_hobbies L2-L6). 12 slots <3 chars; 71 slots contain a space/hyphen;
  proper nouns as answers (`sumeria`, `seleucid`, `pergamon`, `macedon`, `bactria`,
  `ptolemaic egypt`).
- Level word-counts are uneven: daily categories range from **26 words total** to **126
  words total** — a 5x effort swing for the "same" daily.

## 3. Decision table

Recommended defaults below are **data-only edits to `wordpool-categories.json`** unless the
code fix is named. The global floor rule: no answer may contain a character outside
`[a-z]`; an answer must otherwise clear a level-scaled obscurity floor.

| Level | Keep / Change | Exact numbers | Why |
|---|---|---|---|
| L1 | **Change (trim + clean)** | 20.4 words/lvl avg; 23.9% obscure; 14.6% out of bar; max 25 | Not easy: 20-25-word grab-bags (dance=25, 10.5% single out-of-bar words). Cap at ~12, drop zipf<3.5. |
| L2 | **Change (prune)** | 43.9% obscure; 32.0% out of bar; 40 levels incl. multiword | Biggest obscurity jump (L1→L2). Remove all multiword/hyphen answers; cap ~12; floor zipf ≥3.5. |
| L3 | **Change (ease)** | 47.7% obscure; 34.2% out of bar | Replace zipf<3.0 answers (lepton, muon, veut, ptolemaic egypt, cloud forest…); cap ~10. |
| L4 | **Change (ease hard)** | worst single-word out-of-bar rate 27.9%; 55.3% obscure; school L4 = 5/5 multiword | Replace zipf<3.0 (warbler/redstart/wheatear, voulge/glaive, ghazal); cap ~8. |
| L5 | **Change (ease hard)** | worst out-of-bar 30.7%; 58.7% obscure | Music L5 (shawm, cor anglais), birds L5 (cotinga/manakin), military L5; replace zipf<3.0; cap ~7. |
| L6 | **Change (rebuild)** | 61.1% obscure; only 6.1% core; 42 untypeable levels overall | Smallest lists but rarest words; often ≤2-word all-obscure gates; fix typeability first. |
| — **Code fix** | **Required** | affects 42 levels / 12 categories | Add a SPACE key + accept space/hyphen in submit, OR convert every multiword answer to a single word. Without this, blocked categories are unplayable. |

Per-category keep/change (worst first):

| Category | Verdict | Numbers | Why |
|---|---|---|---|
| `birds` | **Change** | L4-L5 90% out-of-bar; L4 avgZ 2.12 | Warblers/waders/tropical species are expert-level. |
| `school` | **Change** | L4 = 5/5 multiword; L4-L6 avgZ 0.00 | Untypeable pencil-term phrasings. |
| `music` | **Change** | L5 untypeable (cor anglais); L5 avgZ 1.60 | Shawm, double-reed jargon. |
| `military` | **Change** | L3-L6 avgZ 1.0-2.2 | Voulge, spontoon, partizan — trivia-only. |
| `literature` | **Change** | L6 avgZ 0.85; pantoum/villanelle | Fixed-form poetry jargon. |
| `dance` | **Change** | L1=25 words avgZ 3.03; L2 avgZ 2.34 | L1 is the hardest list in the category. |
| `technology` | **Change (code first)** | L6={l1,l2,l3} | Non-words + untypeable. |
| `animals`, `food` | **Keep (minor trim)** | L1-L4 avgZ 3.3-4.4 | Clean, guessable; trim only out-of-bar stragglers. |

Global recommended defaults: (1) fix typeability (space support or de-phrase); (2) enforce
obscurity floor zipf ≥3.5 at L1-L2, ≥3.0 at L3-L4, ≥2.5 at L5-L6; (3) cap word counts
12/12/10/8/7/6; (4) ban digit/symbol tokens and proper nouns as answers; (5) aim for a
balanced 6-level daily (~40-45 words total) so the "one minute per game" promise is even
approximately reachable.
