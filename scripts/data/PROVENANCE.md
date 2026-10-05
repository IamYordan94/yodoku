# Curated English word data (Change by One + Clear the String)

`english-common.txt` is the curated common-English word list used to build
`public/words-cbo.json` (Change by One's dictionary). It is also loaded by Clear
the String as a broad fallback dictionary so common words (e.g. `hands`, `flood`)
are accepted even when they are missing from `public/data/words.json`.

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
            − profanity/slur blocklist     (family game, see build script)
            running length filter 3..8
```

Names (e.g. `ming`, `john`) are intentionally **kept** in the dictionary so that
players can still type legitimate words that double as names (`mark`, `rose`),
but they are **excluded from being puzzle start/end tokens** via
`scripts/data/names-blocklist.txt` (dominictarr/random-name) — see
`scripts/gen-cbo-pairs.mjs`.

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
then intersect with `words_alpha.txt` minus the blocklist in
`scripts/build-cbo-words.mjs`'s sibling notes. The verbatim committed list is the
source of truth — the build/regeneration never touches the network.
