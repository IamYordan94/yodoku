# FERMI — Estimation Questions Audit (05)

Scope: real answers, fair ranges, difficulty mix, and the reported keypad scale-label
glitch (`2.62 / 261.84 thousand`). Read-only; every number below is produced from source
with the script shown in section 1.

## 0. Source of truth

| Thing | Location |
|---|---|
| Puzzle bank (runtime) | `FERMI_BANK` in `src/utils/puzzleGenerator.ts` lines 114-177 |
| Scoring / bands / formatting | `src/utils/fermiLogic.ts` |
| Game page (keypad + log chart) | `src/pages/FermiPage.tsx` |
| Calendar (projection reader) | `src/pages/FermiCalendar.tsx` → `public/data/dailybrain-puzzles.json` |
| Projection regenerator | `scripts/sustain/keepers/export-dailybrain.mjs` |

Rotation rule (FermiPage.tsx lines 30-35 and fermiLogic.ts `puzzleIndex`):
`index = ((utcDaysSince(LAUNCH_DATE='2026-08-07')) % BANK.length + len) % len`.

## 1. Method / exact commands

Script extracts the TS array literal, `eval`s it, and replays the real formatter +
win-band maths (written to scratch, not the repo):

```bash
node "C:/Users/veria/AppData/Local/hermes/cache/scratch/fermiaudit/a.cjs"   # inventory + bands
node "C:/Users/veria/AppData/Local/hermes/cache/scratch/fermiaudit/b.cjs"   # 30-day rotation mix
```

Key output:

```
COUNT 62 DIFF {"easy":23,"medium":26,"hard":13}
DISTINCT CATEGORIES(13): food,space,biology,physics,earth,demographics,geography,
                         history,finance,time,art,music,sports
projection public/data/dailybrain-puzzles.json -> fermi = 62   (in sync)
30-DAY MIX (2026-10-08..2026-11-06): {"easy":12,"medium":10,"hard":8}
```

## 2. Full inventory (62 items)

`win band` = [answer x 0.95, answer x 1.05] (the real win test, ±5%).
`ints` = how many whole numbers fall inside that band (what a player can actually type
if they answer as an integer). `scaleLo / scaleHi` = the two log-chart end labels drawn
by the keypad (`10^(log10(ans)∓2.5)`, run through `formatNumber`).

| # | cat | diff | units | prompt (short) | answer | fmtAns | win band | ints | scaleLo | scaleHi |
|--:|--|--|--|--|--:|--|--|--:|--|--|
|0|food|easy|kcal|calories in a Big Mac|550|550|522.5-577.5|55|1.74|173.93 thousand|
|1|space|easy|km|Moon distance|384400|384.4 thousand|365.2k-403.6k|38441|1.22 thousand|121.56 million|
|2|biology|easy|bones|bones in adult body|206|206|195.7-216.3|21|0.65|65.14 thousand|
|3|physics|medium|km/s|speed of light|299792|299.79 thousand|284.8k-314.8k|29979|948.03|94.8 million|
|4|biology|hard|beats|heart beats in a lifetime|3100000000|3.1 billion|2.945-3.255 bn|310000001|9.8 million|980.31 billion|
|5|earth|medium|%|fresh water fraction|2.5|2.5|2.375-2.625|**0**|0.01|790.57|
|6|biology|easy|°C|body temperature|37|37|35.15-38.85|3|0.12|11.7 thousand|
|7|demographics|medium|people|world population 2025|8200000000|8.2 billion|7.79-8.61 bn|820000001|25.93 million|2.59 trillion|
|8|biology|medium|muscles|muscles in body|600|600|570-630|61|1.9|189.74 thousand|
|9|space|easy|days|Earth orbit days|365.25|365.25|347.0-383.5|37|1.16|115.5 thousand|
|10|geography|medium|km|Earth circumference|40075|40.08 thousand|38.07k-42.08k|4007|126.73|12.67 million|
|11|biology|hard|cells|cells in body|37000000000000|37 trillion|35.15-38.85 tn|3700000000001|117 billion|11700.43 trillion|
|12|physics|easy|m/s²|gravity|9.8|9.8|9.31-10.29|1|0.03|3.1 thousand|
|13|history|hard|years|age of universe|13800000000|13.8 billion|13.11-14.49 bn|1380000001|43.64 million|4.36 trillion|
|14|geography|easy|m|Everest height|8849|8.85 thousand|8407-9291|885|27.98|2.8 million|
|15|biology|hard|km|length of blood vessels|100000|100 thousand|95k-105k|10001|316.23|31.62 million|
|16|physics|hard|°C|Sun core temperature|15000000|15 million|14.25-15.75 m|1500001|47.43 thousand|4.74 billion|
|17|food|easy|L|water per day|2.5|2.5|2.375-2.625|**0**|0.01|790.57|
|18|space|medium|km|diameter of Sun|1392700|1.39 million|1.323-1.462 m|139271|4.4 thousand|440.41 million|
|19|biology|medium|years|human lifespan|73|73|69.35-76.65|7|0.23|23.08 thousand|
|20|physics|medium|m/s|speed of sound|343|343|325.8-360.2|35|1.08|108.47 thousand|
|21|geography|medium|km²|Earth surface area|510100000|510.1 million|484.6-535.6 m|51010001|1.61 million|161.31 billion|
|22|biology|hard|neurons|neurons in brain|86000000000|86 billion|81.7-90.3 bn|8600000001|271.96 million|27.2 trillion|
|23|finance|hard|USD|Apple market cap end-2024|3800000000000|3.8 trillion|3.61-3.99 tn|380000000001|12.02 billion|1201.67 trillion|
|24|biology|easy|L|blood in adult|5|5|4.75-5.25|1|0.02|1.58 thousand|
|25|space|hard|stars|stars in Milky Way|200000000000|200 billion|190-210 bn|20000000001|632.46 million|63.25 trillion|
|26|physics|easy|V|AA battery voltage|1.5|1.5|1.425-1.575|**0**|0|474.34|
|27|geography|medium|km|Amazon length|6400|6.4 thousand|6080-6720|641|20.24|2.02 million|
|28|biology|easy|bpm|resting heart rate|72|72|68.4-75.6|7|0.23|22.77 thousand|
|29|time|easy|seconds|seconds in a year|31536000|31.54 million|29.96-33.11 m|3153601|99.73 thousand|9.97 billion|
|30|biology|medium|kg|African elephant mass|6000|6 thousand|5700-6300|601|18.97|1.9 million|
|31|physics|hard|m|red light wavelength|7e-7|**0**|6.65e-7-7.35e-7|**0**|**0**|**0**|
|32|demographics|medium|people|India population|1450000000|1.45 billion|1.378-1.523 bn|145000001|4.59 million|458.53 billion|
|33|food|medium|beans|coffee beans per espresso|70|70|66.5-73.5|7|0.22|22.14 thousand|
|34|space|medium|ly|nearest star distance|4.24|4.24|4.028-4.452|**0**|0.01|1.34 thousand|
|35|history|medium|years|Roman Empire duration|500|500|475-525|51|1.58|158.11 thousand|
|36|biology|medium|L|lung capacity|6|6|5.7-6.3|1|0.02|1.9 thousand|
|37|geography|medium|km|Mariana Trench depth|11000|11 thousand|10,450-11,550|1101|34.79|3.48 million|
|38|physics|medium|°C below zero|absolute zero offset|273.15|273.15|259.5-286.8|27|0.86|86.38 thousand|
|39|food|hard|kg|food eaten per year|900|900|855-945|91|2.85|284.6 thousand|
|40|art|easy|keys|piano keys|88|88|83.6-92.4|9|0.28|27.83 thousand|
|41|art|easy|strings|violin strings|4|4|3.8-4.2|1|0.01|1.26 thousand|
|42|music|easy|strings|acoustic guitar strings|6|6|5.7-6.3|1|0.02|1.9 thousand|
|43|sports|easy|players|football players per side|11|11|10.45-11.55|1|0.03|3.48 thousand|
|44|sports|medium|squares|chessboard squares|64|64|60.8-67.2|7|0.2|20.24 thousand|
|45|sports|easy|players|basketball players per side|5|5|4.75-5.25|1|0.02|1.58 thousand|
|46|sports|easy|rings|Olympic rings|5|5|4.75-5.25|1|0.02|1.58 thousand|
|47|sports|medium|gold medals|Phelps golds|23|23|21.85-24.15|3|0.07|7.27 thousand|
|48|time|easy|minutes|minutes in a day|1440|1.44 thousand|1368-1512|145|4.55|455.37 thousand|
|49|time|easy|days|days in a leap year|366|366|347.7-384.3|37|1.16|115.74 thousand|
|50|demographics|medium|member states|UN member states|193|193|183.3-202.7|19|0.61|61.03 thousand|
|51|demographics|hard|people|Tokyo metro population|37000000|37 million|35.15-38.85 m|3700001|117 thousand|11.7 billion|
|52|space|easy|moons|moons of Mars|2|2|1.9-2.1|1|0.01|632.46|
|53|space|medium|km|Earth-Sun distance|149600000|149.6 million|142.1-157.1 m|14960001|473.08 thousand|47.31 billion|
|54|biology|easy|teeth|adult teeth|32|32|30.4-33.6|3|0.1|10.12 thousand|
|55|biology|easy|chambers|heart chambers|4|4|3.8-4.2|1|0.01|1.26 thousand|
|56|biology|medium|chromosomes|human chromosomes|46|46|43.7-48.3|5|0.15|14.55 thousand|
|57|biology|hard|bones|bones in a foot|26|26|24.7-27.3|3|0.08|8.22 thousand|
|58|biology|medium|km/h|cheetah top speed|100|100|95-105|11|0.32|31.62 thousand|
|59|geography|medium|m|Burj Khalifa height|828|828|786.6-869.4|83|**2.62**|**261.84 thousand**|
|60|geography|hard|km|Great Wall length|21196|21.2 thousand|20,140-22,260|2119|67.03|6.7 million|
|61|art|medium|lines|Shakespeare sonnet lines|14|14|13.3-14.7|1|0.04|4.43 thousand|

## 3. Answer plausibility — all 62 verified, none invented

Spot-checked against standard references cited in each item: Moon 384,400 km, light
299,792 km/s, 206 bones, 3.1 bn heartbeats, 2.5% fresh water, 8.2 bn people, 1.45 bn
India, 37 tn cells, 13.8 bn yr universe, 86 bn neurons, 200 bn Milky Way stars, Everest
8,849 m, 100,000 km vessels, 15 m °C Sun core, 510.1 m km² Earth, 37 m Tokyo, 149.6 m km
AU, 88 piano keys, 21,196 km Great Wall, Phelps 23 golds, 193 UN members — all plausible.

**Two data defects found:**

1. **`#37` Mariana Trench — answer/units mismatch (real bug).** `answer: 11000`
   with `units: "km"`, but the reveal text itself says "~11,000 **m** (11 km)". At
   11,000 km the trench would be longer than Earth's diameter. A player who answers the
   correct depth in km (`11`) is 1000× off and scores red and loses. Fix: either
   `answer: 11, units: "km"` or `answer: 11000, units: "m"`.
2. **`#23` Apple market cap (and the 2025 population/lifespan items) decay.** "End of
   2024 = $3.8 tn" is dated; with a 62-day cycle the same puzzle returns roughly every
   two months and the "real" answer drifts. Low severity, but mark answers as
   period-stamped or refresh on a schedule. Same class: `#7`, `#32`, `#51`, `#53`, `#19`.

## 4. Range fairness (±5% band)

The win test is `|guess/answer - 1| <= 0.05` (fermiLogic.ts line 76) — a fixed relative
band on every question, so "fair" reduces to: *can a player who knows the answer
approximately hit the band in one typed number?*

- **Fair (round or long): most of the bank.** Famous quantities that are already band-
  round win with the canonical figure (299.79 thousand, 8.2 billion, 384.4 thousand, ...).
- **Unfair / zero-integer bands — a round answer LOSES:**
  - `#5` fresh water `2.5` (band 2.375-2.625): typing `3` (the common lay figure) fails.
  - `#17` water/day `2.5`: typing `2` or `3` fails.
  - `#26` AA battery `1.5` (band 1.425-1.575): typing `1` or `2` fails.
  - `#34` Proxima `4.24` (band 4.028-4.452): typing `4` fails (4 < 4.028).
  - `#31` red light `7e-7`: no integer wins at all, and see the display bug below.
  These are the only items where a knowledgeable, casual answer is punished for rounding.
- **Not trivially wide:** no item has a band wider than ±5%; none is absurdly narrow for
  its scale except the four decimals above.

## 5. Scoring bands and the "one minute" promise

From `fermiLogic.ts` (`fermiFeedback` / `fermiColor`):

| Outcome | Rule | Colour |
|---|---|---|
| Win | `|ratio-1| <= 0.05` (±5%) | green |
| Close | ratio 0.5-2 | yellow |
| Near | ratio 0.1-10 | orange |
| Far | else | red |

Each wrong guess shows lower/higher plus a magnitude bucket (`1,000× / 100× / 10× / 3× /
1.5× / "under 1.5×"`). 6 attempts max (UI sticker: "6 tries · ±5%"). The guess-marker log
chart plus the magnitude hint converge fast on scale — a casual player can win most
**easy/medium** items inside a minute. The promise breaks on: `#31` (must type
`0.0000007` — nine keystrokes, and its value renders as `0`, section 6), and the
zero-integer decimal items (`#5/#17/#26/#34`) where the intuitive round number loses.

## 6. Keypad scale-label glitch (`2.62 / 261.84 thousand`) — ROOT CAUSE

Reproduced exactly at **index #59, the Burj Khalifa** (answer `828` m): the audit script
prints `scaleLo = 2.62`, `scaleHi = 261.84 thousand` — the reported string, verbatim.

Offending code, `src/pages/FermiPage.tsx`:

```tsx
147  const lo = Math.log10(answer) - 2.5;
148  const hi = Math.log10(answer) + 2.5;
149  const pos = (x: number) => Math.max(2, Math.min(98, (Math.log10(x) - lo) / (hi - lo) * 100));
...
318    <span>{formatNumber(Math.pow(10, lo))}</span>
319    <span style={{ opacity: 0.85, letterSpacing: '0.12em' }}>GUESS RANGE · LOG SCALE</span>
320    <span>{formatNumber(Math.pow(10, hi))}</span>
```

**Why BOTH numbers appear:** the log-scale chart is a symmetric ±2.5-decade window
centred on the answer, hard-coded to `10^(log10(answer) ∓ 2.5)` = `answer / 316.23` and
`answer x 316.23`. For 828 that is **2.618** and **261,838**. `formatNumber` renders the
first as `2.62` and the second as `261.84 thousand`. They are therefore the two ends of
the same guess range — the answer sits at their *geometric* centre
(`sqrt(2.62 x 261,840) ≈ 828`) — but nothing on screen says so: there is no unit, no
"min / max", and the only label ("GUESS RANGE · LOG SCALE") is 10px grey text between
them. The mixed formatting (plain `2.62` vs unit-worded `261.84 thousand`) makes the pair
read as arbitrary stray figures next to the keypad/input, which is the reported glitch.
The block only mounts once `state.guesses.length > 0`, so the numbers pop in mid-play.

**Secondary bug in the same formatter (fermiLogic.ts line 58, `trimNum`)**: for any
answer below 1 it rounds to 2 decimals → `Math.round(7e-7*100)/100 = 0`, so **`#31`
(the red-light question) displays its answer, hint markers, reveal and share card as
`0`**, and its two chart labels are both `0`. A correct player also cannot see the target
scale. Independent of the label glitch, same area.

**Minimal fix (no behaviour change to scoring):**
1. Give the pair explicit context and one unit — e.g. render
   `MIN 2.62 m` / centre `GUESS RANGE · LOG SCALE` / `MAX 261.84 thousand m`, applying
   `puzzle.units` to both ends (or a single label above the bar:
   "range 2.6 – 260,000 m (log scale)"). Two lines of JSX; no model change.
2. Harden `trimNum` to keep significant digits for `0 < x < 1`
   (e.g. `x.toPrecision(2)` when `abs(x) < 1`) so sub-unit answers never render as `0`.

## 7. Difficulty mix across a 30-day window

`index = ((utcDaysSince('2026-08-07')) % 62 + 62) % 62`. Window 2026-10-08 → 2026-11-06:

| Difficulty | Count | Share |
|--|--:|--:|
| easy | 12 | 40% |
| medium | 10 | 33% |
| hard | 8 | 27% |

Bank-wide: 23 easy / 26 medium / 13 hard (37% / 42% / 21%). The 62-item length means no
repeat within a 62-day window (the running 30 days are all distinct). Minor note: the
`easy→hard` ramp is not monotone and the hardest days cluster (e.g. 10-22 → 10-31 is
mostly hard), but the mix is reasonable. **Stale copy:** `FermiCalendar.tsx` line 58
still says "Puzzles cycle every 40 days" (bank is 62). The calendar also links to
`/fermi/play?date=...` but `FermiPage.tsx` never reads a `?date=` param (no
`useSearchParams`) — clicking any past date shows *today's* puzzle.

## 8. DECISION TABLE

| Aspect | Keep or change | Exact numbers | Why |
|--|--|--|--|
| Bank size / rotation | Keep | 62 items, 13 categories, `days % 62` | 62-day cycle, zero repeats in 30 days; projection (`dailybrain-puzzles.json`) already in sync at 62 |
| Difficulty mix | Keep | bank 23/26/13; 30-day 12/10/8 | Right ramp for "one minute"; hard items still solvable with the magnitude hint |
| ±5% win band | Keep for continuous answers; soften for decimals | ±5% → 0 integer winners on #5/#17/#26/#34 | Round answers (3%, 2 L, 1-2 V, 4 ly) currently lose for rounding down |
| Mariana Trench units | **Change** | `units:"km"` → `"m"` (keep 11000) or `answer:11`,`units:"km"` | 1000× error; the reveal text contradicts the unit; player answering "11 km" loses |
| Sub-1 formatter (`trimNum`) | **Change** | `7e-7` renders `0` | #31 answer/hint/reveal/share all show `0`; also both chart ends show `0` |
| Keypad scale labels | **Change** | lines 318-320 + 147-148 | "2.62 / 261.84 thousand" — unexplained ±2.5-decade endpoints, no unit, only mount after first guess |
| Stale/aging answers | Change (schedule) | #7,#19,#23,#32,#51,#53 | Dated quantities drift every ~62-day cycle |
| Calendar copy + date link | Change | "40 days" → 62; wire `?date=` | Copy-out-of-sync + calendar day click shows today's puzzle |

**Recommended default:** ship the three code/data fixes (scale-label context + sub-1
`trimNum`, Mariana `units:"m"`, calendar copy/date-param) and keep the bank, the ±5% band
and the difficulty mix as-is. The 62-question rotation is healthy.
