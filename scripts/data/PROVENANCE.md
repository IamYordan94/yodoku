# Curated English word data (the shared vocabulary standard)

`english-common.txt` is the curated common-English word list used to build
`public/words-cbo.json` (Change by One's dictionary) and as the shared fairness
bar + answer pool source for Clear the String, 7 Letters and Word Pool (see
`docs/vocab-audit/00-vocabulary-standard.md`).

## Sources (both reputable, open licence)

1. **wordfreq** (MIT) — English frequency ranking from multiple corpora
   (Wikipedia, news, subtitles, web). We take the top 20,000 tokens.
   <https://github.com/rspeer/wordfreq>
2. **dwyl/english-words `words_alpha.txt`** (Unlicense) — a large standard
   English dictionary, used as a membership filter to drop non-words and
   frequency-list noise. <https://github.com/dwyl/english-words>

## Build rule

```
curated = wordfreq_en_top_20000
            ∩ words_alpha                 (must be a real, dictionary word)
            − safety-blocklist.txt        (profanity/slurs)
            − prune-blocklist.txt         (abbreviations, foreign function
                                           words, proper nouns — audit 2026-10-08)
            running length filter 3..8
```

**2026-10-08 vocabulary audit pass:** 421 junk-class entries removed
(abbreviations/units like `mph`/`mrs`, foreign function words like `der`/`una`,
proper nouns like `zurich`/`yemen`, contractions like `youre`); the list went
17,705 → 17,284. The prune set is frozen in `prune-blocklist.txt` (435 policy
entries, applied by `scripts/build-cbo-words.mjs` on every rebuild). Real
English words that merely LOOK foreign (ale, bra, hat, tan, met, van, pour,
per, dank, payer, fare, ivory — matched by the raw cross-language scan) were
deliberately kept. Full method: `docs/vocab-audit/00-vocabulary-standard.md`.

Names (e.g. `ming`, `john`) are intentionally **kept** in the dictionary so that
players can still type legitimate words that double as names (`mark`, `rose`),
but they are **excluded from being puzzle start/end tokens / answers** via
`scripts/data/names-blocklist.txt` (dominictarr/random-name) — see
`scripts/gen-cbo-pairs.mjs` and the games' `loadPools`.

The exhaustive Scrabble-style dump that previously filled `public/words-cbo.json`
(and produced the junk words `wran`, `aani`, `aaru`, `adad`, `acar`) is no longer
used.

To rebuild from scratch (network required, not run at build time):

```bash
uv run --with wordfreq python - <<'PY'
from wordfreq import top_n_list
words=[w for w in top_n_list('en',20000) if w.isalpha() and w.islower() and 3<=len(w)<=8]
open('wordfreq-top.txt','w').write('\n'.join(words))
PY
```
then intersect with `words_alpha.txt` minus the two blocklists. The verbatim
committed list is the source of truth — the build/regeneration never touches
the network.
