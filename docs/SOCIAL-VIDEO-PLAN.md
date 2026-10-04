# Yodoku — Social Short-Video Plan

> Companion to `MARKETING-ADS-PLAN.md` §3.3. Written for one non-editor with a phone + a PC.
> **The job of every video is traffic to `yodoku.app` — not channel ad money.** See §5 before recording anything.
> House rules this plan obeys: real gameplay footage only, no AI-generated art, no fake views/engagement, no fake claims.

---

## 0. The one-sentence strategy

**The product is the content.** A 25–40 second screen-recording of solving today's puzzle is a finished video. Every daily puzzle is already there, free, deterministic per date, and ends in a shareable score grid. We record it, add a hook and a caption, post to TikTok + YouTube Shorts, and point the viewer at `yodoku.app` where they play the same puzzle and start their own streak.

No sets, no scripts written from scratch, no editing talent required. This is the only content engine a solo developer can sustain at 3–5 posts/week.

---

## 1. The one winning format: "Can you beat today's [X]?"

Every successful daily-puzzle channel runs one format: **the gameplay challenge hook.** Show the puzzle, solve it in real time (or "pause and guess"), reveal your score, then dare the viewer to beat it. It works because the viewer is *competing against you and the calendar*, and the payoff is a link to the exact same puzzle.

### Shot-by-shot structure — 25–40 seconds, vertical 9:16 (1080×1920)

| Time | Shot | What's on screen | Audio / text overlay |
|---|---|---|---|
| **0:00–0:02** | **Hook** | Full-screen text card + the game open behind it | Text: **"Can you beat today's ORDERLE?"** Voice: "Here's today's ORDERLE. Can you beat my score?" |
| **0:02–0:06** | **Setup** | The puzzle board, un-solved | Voice: read the puzzle aloud in one sentence ("Put these six words in the right order"). No wasted time. |
| **0:06–0:24** | **Solve** | Real solve, mistakes left in | Think out loud OR let on-screen captions carry it. Cut dead air to ~2–4s per move. Keep one "aha" beat. |
| **0:24–0:30** | **Reveal** | Results screen: score grid 🟩🟩🟥🟩⬜ + streak 🔥 | Voice: "Three swaps. That's a 4/6. Beat it." |
| **0:30–0:38** | **CTA** | Full-screen text over the results | Text: **"Play today's free at yodoku.app"** Voice: "Same puzzle's free at yodoku.app — link in bio." |

### Timing rules that keep retention up

- **Hook in the first 2 seconds** or the video is dead. The question *is* the hook — never open with "hey guys."
- **Never show a blank/loading screen.** Start recording after the puzzle is loaded.
- **Leave one mistake in.** A perfect solve reads as fake and gives the viewer nothing to feel smart about. A stumble you recover from is the whole point.
- **End on the score grid.** It's the same grid format that made Wordle shareable; it's the screenshot viewers recognize.
- **Target 30s.** Under 25s feels like a teaser; over 40s and solo-recording editing time balloons.

### Format variants (use the same skeleton, swap the middle)

- **"Pause and guess"** (FERMI, Quiz Master): show the puzzle, hard cut to a "PAUSE — what's your answer?" card, 2s hold, then reveal. Best comment-bait, and comments feed the algorithm.
- **"Beat my score"** (ORDERLE, Clear the String, Change by One): the default solve-in-real-time above.
- **"How many can you name?"** (Word Pool): show the category, then rapid-fire your answers as text overlays tick up a counter.

---

## 2. Ten first-video scripts

Concrete, ready to record. **Where a script names specific letters/words/answers, swap in today's actual puzzle values** — the mechanics are real, the sample words are illustrative placeholders so you never post a made-up puzzle.

### Script 1 — Clear the String (easy)
- **Game / route:** Clear the String — `/lettermix`
- **Format:** Beat-my-score solve
- **Hook:** "There are 3 kitchen words hidden in this mess — can you clear the string?"
- **Middle:** Show the scrambled string. Say "I see FORK already…" Select letters for FORK, watch them pop. "SPOON… wait, that leaves two O's short — order matters here." Recover, find TABLE, then SPOON, clear the board.
- **CTA:** "Clear today's string free at yodoku.app."

### Script 2 — Clear the String (hard mode flex)
- **Game / route:** Clear the String — `/lettermix` (hard)
- **Format:** Beat-my-score + difficulty framing
- **Hook:** "Hard mode today: 8 words in 40 letters. I'll show you, then you beat my time."
- **Middle:** Show the long string. Find two obvious words fast, then slow down on the third and talk through the letter-dependency ("if I take TABLE now I lose the T for…"). Finish and show the found-words list.
- **CTA:** "Think you can do it faster? Same board, free, at yodoku.app."

### Script 3 — Change by One (word ladder)
- **Game / route:** Change by One — `/changebyone`
- **Format:** Beat-my-score solve
- **Hook:** "Get from COLD to WARM one letter at a time. Can you do it in fewer moves than me?"
- **Middle:** Walk the ladder move-by-move on screen ("COLD → CORD → WORD → WARD → WARM — that's 4 steps"). Count the steps out loud and show the move counter ticking.
- **CTA:** "Today's ladder is live at yodoku.app — try to beat 4 steps."

### Script 4 — Change by One (pause-and-guess twist)
- **Game / route:** Change by One — `/changebyone`
- **Format:** Pause-and-guess
- **Hook:** "One letter per move. PAUSE — what's your first word?"
- **Middle:** Show the start + end word, hold a 2-second "PAUSE" card, then reveal your first move and finish the ladder. Invite alternates ("if you went through CARD instead, that works too").
- **CTA:** "All the valid paths are on today's board at yodoku.app."

### Script 5 — Word Pool (category challenge)
- **Game / route:** Word Pool — `/wordpool`
- **Format:** How-many-can-you-name
- **Hook:** "Level 6 today: 'Large African Cats.' How many can you name before the list runs out?"
- **Middle:** Rapid-fire answers as text overlays tick up: "Lion… leopard… cheetah…" Show the found-words counter filling the pool. Miss one, find it, celebrate the level clear.
- **CTA:** "There are more words in the pool than you think — play it free at yodoku.app."

### Script 6 — Word Pool (progression hook)
- **Game / route:** Word Pool — `/wordpool`
- **Format:** Beat-my-score / progression
- **Hook:** "It starts as 'Animals'… then narrows to 'Large African Carnivores.' This is how it traps you."
- **Middle:** Show level 1 (trivial), then jump to the tight level where only 4–6 words qualify. Show the constraints stacking and you hunting for the last one.
- **CTA:** "How deep can you get? Unlock all 6 levels today at yodoku.app."

### Script 7 — ORDERLE (the flagship daily)
- **Game / route:** ORDERLE — `/orderle`
- **Format:** Beat-my-score solve (the marquee video)
- **Hook:** "Today's ORDERLE — can you put these in the right order in fewer swaps than me?"
- **Middle:** Show the items out of order. Make a swap, get the 🟥/🟩 feedback, keep going, finish in 3 swaps. Talk through why each swap is right.
- **CTA:** "Beat 3 swaps on today's ORDERLE at yodoku.app."

### Script 8 — ORDERLE (streak angle)
- **Game / route:** ORDERLE — `/orderle`
- **Format:** Streak / retention hook
- **Hook:** "Day 12 of my ORDERLE streak. This is the one that could end it."
- **Middle:** Solve under tension, narrating the streak at stake. Reveal the 🔥 counter on the results screen.
- **CTA:** "Start your own streak — today's puzzle is waiting at yodoku.app."

### Script 9 — FERMI (guess the number)
- **Game / route:** FERMI — `/fermi`
- **Format:** Pause-and-guess
- **Hook:** "I have 5 tries to guess today's number. PAUSE — what would you guess first?"
- **Middle:** Show the guess board. Make a first guess, show the FERMI feedback (right digit/right place vs. right digit/wrong place), narrow it down, land it on try 4. Hold a "PAUSE" card before each reveal.
- **CTA:** "Beat my 4 guesses on today's FERMI at yodoku.app."

### Script 10 — Quiz Master (trivia)
- **Game / route:** Quiz Master — `/quiz/play`
- **Format:** Pause-and-guess / beat-my-score
- **Hook:** "10 questions today. I got 7. PAUSE — what's your answer to this one?"
- **Middle:** Show question 1, hold a pause card, reveal the answer. Rush through 3–4 questions with the score tally on screen, then show the final results screen with the streak.
- **CTA:** "Think you can score higher? Today's quiz is free at yodoku.app."

**Rotation note for the first two weeks:** lead with Script 7 (ORDERLE), 9 (FERMI), and 10 (Quiz Master) — they're the most watchable. Fold in Clear the String and Word Pool as you get faster at recording.

---

## 3. Channel setup

### TikTok (create a *creator* account, not just a personal one)
1. Install TikTok, sign up, switch to a **Business/Creator** account (free; gives you analytics + a clickable bio link).
2. **Bio** (this is the whole funnel — a link-in-bio is your only clickable link): `🟩 Free daily word + quiz puzzles → yodoku.app`
3. Username: short, game-adjacent, memorable — e.g. `@yodokupuzzles` or `@yodokuapp`. Claim the same handle on every platform.
4. Add the site link in bio. (A Linktree only matters once you have >1 link to send people to — skip it initially.)

### YouTube Shorts
1. Create a Google account → YouTube channel. Pick the same handle (`@yodokupuzzles`).
2. Every vertical video you make goes up as a **Short** (vertical, ≤60s). Title it like a search query, e.g. *"Can you beat today's ORDERLE? (3 swaps)"*.
3. Put `yodoku.app` in the Short's **description** (first line) and a pinned comment — those are clickable-ish paths to the site.
4. Optional later: a 2-minute "how to play each game" long-form per game doubles as the SEO content in `MARKETING-ADS-PLAN.md` §3.1.

### Posting cadence (realistic, non-burnout)

- **Target: 3–5 posts/week.** Not daily. Daily is a burnout trap for a solo operator; the marginal post quality collapses after ~5/week.
- **Batch record:** one 60–90 minute sitting produces 3 finished videos. Record Saturday, post Mon / Wed / Fri (or Tue / Thu / Sat). Consistent days > daily volume.
- **One recording = 2–3 posts:** the same vertical uploads to TikTok *and* YouTube Shorts *and* Instagram Reels unchanged. You are not making 3 videos.
- **Rotate games** so a viewer following you sees variety: e.g. Mon = ORDERLE, Wed = Quiz Master, Fri = FERMI, and slip in Clear the String / Word Pool / Change by One in the extra slots.

### Captions + hashtags real puzzle players actually search

**Caption formula** (first line is the hook, rest is optional): `Can you beat today's ORDERLE? I did it in 3 swaps. Play free at yodoku.app 🔗`

**Hashtag strategy — 3–5 per post, mixed niche + mid + broad.** Don't tag-spam (10+ looks botty and can hurt reach). Rotate from:

- **Game-specific (highest intent):** `#wordle` `#wordgames` `#wordgame` `#wordpuzzle` `#dailypuzzle` `#dailywordle` `#wordladder` `#anagram` `#guesstheword` `#guessthenumber` `#numbergame` `#logicpuzzle`
- **Trivia/quiz:** `#quiz` `#trivia` `#triviachallenge` `#generalknowledge` `#quiztime`
- **Broad discoverability:** `#puzzle` `#puzzles` `#brainteaser` `#braingames` `#mindgames` `#puzzletok` `#gametok`

Pick the 2–3 that literally describe the game in the video + 1–2 broad ones. Example for ORDERLE: `#dailypuzzle #wordgame #puzzle #brainteaser`.

---

## 4. Recording workflow for a non-editor

### Tool A — Phone (fastest, native vertical, recommended)
- **iOS:** Control Center → Screen Recording (long-press to add the mic). **Android:** Quick Settings → Screen Recorder (enable "record microphone").
- Open the game in your phone browser at `yodoku.app`, load today's puzzle, then hit record.
- Record in portrait = already vertical = no re-framing. This is why phone-first wins.

### Tool B — PC (OBS Studio — free, open source, no watermark)
- Download **OBS Studio** (obsproject.com).
- Add a **Display Capture** or **Window Capture** of your browser tab with `yodoku.app`.
- Set canvas to **1080×1920 (portrait)** and resize/zoom the browser window into the frame so the board fills it. (Or capture in landscape and crop to vertical in the edit step — but portrait-canvas is cleaner.)
- Record with a cheap USB mic or your phone's voice-memo app; add the audio track in editing.

### Editing (the only tool you need: CapCut — free, phone + desktop)
1. Import the raw recording.
2. **Trim** dead air — cut to the first move within 2s, cut any 3s+ silences.
3. **Auto-captions:** CapCut → "Auto captions" → generates on-screen subtitles from your voice for free. This is where captions come from (the other free path is TikTok/YouTube's built-in auto-captions, which you toggle on at upload).
4. Add the two text overlays yourself: the **hook card** (0:00) and the **CTA card** (`yodoku.app`, 0:30) — these two you type manually.
5. Add the game's accent color as the text background for brand recognition (red for Clear the String, green for ORDERLE, orange for FERMI, purple for Quiz Master, teal for Change by One, blue for Word Pool).
6. Export at 1080×1920, 30fps.

**Where captions come from, in one line:** your spoken words → CapCut/TikTok/YouTube auto-captions → you fix obvious errors. Captions are essential (most Shorts are watched muted) and cost ~90 seconds with auto-captions.

**Voiceover option:** if you don't want your face or voice on camera, record the solve *silently*, then record a 30s voice note explaining it, and lay that over. Same auto-caption step applies.

---

## 5. Honest expectations (read before you record)

### Growth timeline — expect a long, flat start
- **First ~20 videos: nothing.** Typical views on a brand-new account are 0–300 per video. This is normal and not a sign the format is broken. The algorithm is still learning who to show you to.
- **Weeks 4–12:** if the format is right, one video will randomly outperform (a few thousand views) and start seeding the rest. This is the *lottery* mechanic the ads plan already called out — most posts get nothing, a rare one compounds.
- **Reaching a "real" audience** (consistent 1k+ views/post) is a 3–6 month horizon if it happens at all. Do not plan revenue around it.

### When monetization actually unlocks (verified as of writing — always re-check in-app)

| Platform | Program | Requirement | Reality check for this plan |
|---|---|---|---|
| **YouTube** | Partner Program (Shorts path) | **1,000 subs + 10M Shorts views in 90 days** *(or 1,000 subs + 4,000 watch-hours for long-form)* | 10M Shorts views is years away at 3–5 posts/week. Not a near-term goal. |
| **TikTok** | Creator Rewards Program | **10k followers + 100k views/30 days + 18+** — **and videos must be ≥1 minute long** | Our 25–40s videos **do not even qualify** for TikTok's program. A channel built on this format earns nothing directly from TikTok until it's big, and sub-60s videos are excluded by design. |

**The number that matters:** neither platform pays anything meaningful until you are already large. Meanwhile `yodoku.app` monetizes **every visitor** through the display ads in `MARKETING-ADS-PLAN.md` (Monetag now, AdSense later) and through the share-grid loop that already ships in code.

### Why the video's real job is traffic, not ad money

- A channel with 10,000 Shorts views might make **pennies** from the platform. But if even **1–2%** of viewers tap through to `yodoku.app`, that's 100–200 players — who then hit the site's ads, build streaks, and post their own share grids (which brings *more* free traffic).
- The share grid is the compounding asset: one viewer who plays and shares reaches people the video never did. The video is the spark; the share loop is the engine.
- **So measure videos by clicks/visitors to the site, not by views or platform revenue.** Check Vercel Analytics for a bump after each post, not the TikTok wallet.

**Bottom line:** treat the channel as a *customer-acquisition channel with a near-zero marginal cost*, not as a revenue line. The site earns; the channel recruits.

---

## 6. How this becomes automatable (Hermes bot, later)

The daily puzzles are **deterministic per date** (see `src/utils/dailySeed.ts`) and the game logic is already written as pure functions (`quizLogic.ts`, `orderleLogic.ts`, `fermiLogic.ts`, etc.). That's exactly what a bot needs to *pre-solve* a puzzle without playing it by hand.

### The semi-automated pipeline (realistic target)

1. **Solve, don't play.** A Hermes cron job (mirroring the existing "Yodoku hub watchdog" cron) computes today's puzzle and its solution from the game logic, producing a known-good solve + the exact score grid that solve produces.
2. **Script it.** The bot turns the solve into a 30s narration: hook line, move-by-move explanation, score reveal, CTA. (This is LLM text generation over real game state — no invented puzzles.)
3. **Record real footage.** Two honest options:
   - **`computer_use` / cua-driver** drives the actual browser on `yodoku.app`, plays today's puzzle for real, and screen-records the session. This is genuine gameplay footage (allowed by house rules) — the bot is *playing*, not faking.
   - **Render programmatically** with `ffmpeg`/CapCut templates from the solve state (faster, but ensure the on-screen board is the real board, not fabricated).
4. **Caption + overlay.** Auto-captions + hook/CTA cards from a fixed template.
5. **Publish.** This is the genuinely hard step:
   - **YouTube** has a Data API that supports Shorts upload with OAuth — automatable but requires setting up API credentials and OAuth refresh.
   - **TikTok** has a Content Posting API but requires **manual platform approval** and is designed to reject spammy automation.
   - **Recommendation: stop at "draft + human-press-post."** The bot produces a finished, captioned, correctly-framed MP4 + the caption/hashtags, and a human reviews it (house rule: no fake/automated engagement) and hits post in 60 seconds. Full auto-upload is possible on YouTube first; TikTok later if the API is approved.

### What NOT to automate
- No view/engagement bots, no fake comments, no buying followers. House rule, and both platforms ban for it.
- No posting the same video to 10 places automatically in a day (spam behavior kills reach and gets accounts flagged).

### Sequencing
Build it only *after* the manual 3–5/week habit has run for ~a month and a winning format is identified. The bot's job is to cut the per-video effort from ~20 minutes to ~2, not to invent a channel from scratch.

---

*Companion files: `MARKETING-ADS-PLAN.md` (the traffic + monetization engine this feeds), `AD-PLACEMENTS.md` (where the traffic monetizes).*
