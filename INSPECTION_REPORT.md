# Yodoku — Full Inspection Report
**Date:** 2026-03-12
**Inspector:** Claude
**Scope:** All source files, layouts, pages, utils, styles, config, and public assets

---

## Summary

The codebase is well-structured with a solid architecture: clean routing, good component separation, nice game logic, and thoughtful UX patterns. However, there are several issues ranging from **release-blockers** to **polish items** that need to be addressed before this is ready for the public.

Issues are grouped into four severity levels: 🔴 Critical (blocks release), 🟠 High (gameplay bugs), 🟡 Medium (UX/consistency), 🟢 Low (polish/production-readiness).

---

## 🔴 CRITICAL — Must fix before any public release

### 1. AdMob test IDs are hardcoded in production code (`ads.ts`)
`isTesting: true` is set and Google's test Ad Unit IDs (`ca-app-pub-3940256099942544/...`) are hardcoded. The app will be **rejected by Google Play and the App Store** if submitted with test IDs. Replace with your real production Ad Unit IDs and set `isTesting: false` before release.

### 2. Package name is `"yodoku"` (`package.json`)
The app name is a placeholder. This affects the app identifier on Android/iOS, Play Store, App Store listings, and native build outputs. Set a real name before building for release.

### 3. Favicon is Vite's default (`index.html`)
`<link rel="icon" href="/vite.svg" />` — the app still uses the Vite logo as its favicon. Replace with your own favicon.

### 4. "Coming Soon" page copy is wrong (`ComingSoon.tsx`)
Line 9 says: *"We're working on the third game."* — but you already have **three games**. It should say the fourth game. This will confuse players who click "Suggest one."

### 5. `vite.config.ts` has `base: './'` but uses `BrowserRouter`
`base: './'` causes Vite to output relative asset paths (for Capacitor), but `BrowserRouter` uses absolute URL paths. On web hosting, if a user navigates directly to `/lettermix/play` and the server isn't configured to serve `index.html` for all routes, they'll get a 404. Either add a server-side SPA fallback config (e.g. `_redirects` for Netlify, `vercel.json` for Vercel) or document this requirement clearly.

---

## 🟠 HIGH — Bugs that break or degrade gameplay

### 6. ChangeByOne home screen says "4, 5, 6 letters" — but game has 4 puzzles (`ChangeByOneHome.tsx`)
Line 47: `"Multiple word lengths (4, 5, 6 letters)"` — the game actually loads **4, 5, 6, AND 7-letter** puzzles. The home description is incorrect. The `ChangeByOneAbout` page correctly says all four lengths.

### 7. CSS variable `--hub-text` is never defined (`index.css`)
`.hub-btn-ghost` uses `color: var(--hub-text)` but `--hub-text` is never declared in `:root`. The ghost buttons on the Hub page will fall back to browser default text color, breaking the intended design.

### 8. `React.FormEvent` used without importing `React` (`WordPoolPage.tsx`)
Line 95: `const handleSubmit = (e: React.FormEvent) => {` — but `React` is only imported as `{ useState, useEffect }`. Using `React.FormEvent` as a namespace type reference without importing `React` as default (or using `import type { FormEvent } from 'react'`) is a TypeScript error that may fail the build.

### 9. Win state uses sync localStorage instead of async SQLite on native (`LetterMixPage.tsx`)
When `isWon` triggers (line 187), `setLetterMixCompleted(date, level, words)` is called — the **synchronous localStorage version**. On native (Capacitor), it should call `setLetterMixCompletedAsync(date, level, words)` to persist to SQLite. Completions will not be properly saved on the Android/iOS app.

### 10. `useWordDatabase()` is called twice in the same component (`LetterMixPage.tsx`)
Called at line 46 (`const { isLoading: dbLoading } = useWordDatabase()`) and again at line 105 (`const { isValidWord } = useWordDatabase()`). Both calls should be merged into one destructuring at the top of the component.

### 11. `isStuck` calculated on every render without memoization (`LetterMixPage.tsx`)
Line 183: `const isStuck = !isWon && letters.length > 0 && checkIfStuck();` — `checkIfStuck()` iterates over arrays on every render. This should be wrapped in `useMemo` with `[letters, puzzle, foundWords]` as dependencies.

### 12. `hintsUsed` counter resets on page refresh (`ChangeByOnePage.tsx`)
`hintsUsed` is local React state and resets to `{}` on every page load. The ad-gating still works (via SQLite/database), but the **UI counter** ("Hint (2)") will show 2 remaining even if the player already used both. The counter should be initialized from the database or storage on mount.

### 13. No `.catch()` on fetch in `WordPoolPage.tsx`
The `useEffect` fetch chain (lines 57–81) has no `.catch()`. If the JSON file fails to load (network error, missing file), the component silently stays in loading state forever with no user feedback or retry option.

### 14. No 404 / catch-all route (`App.tsx`)
There is no `<Route path="*" element={<NotFound />} />` catch-all route. Navigating to any undefined URL (e.g. `/random`) renders a completely blank page with no navigation or error message.

---

## 🟡 MEDIUM — UX and consistency issues

### 15. Calendar always links to 'easy' difficulty (`LetterMixCalendar.tsx`)
Line 77: `to={/lettermix/play/${dateStr}/easy}` — every date link in the calendar hardcodes the `easy` level. Players have no way to open a past date at medium or hard directly from the calendar.

### 16. Calendar allows infinite future month navigation (`LetterMixCalendar.tsx`)
`goToNextMonth()` has no upper boundary. Users can navigate endlessly into the future, seeing only greyed-out unavailable dates. The "next" button should be disabled once the current month is reached.

### 17. "Change by One" has no history/archive page
LetterMix has a full calendar of past puzzles. WordPool has a previous games page. **ChangeByOne has nothing** — no way to replay past daily challenges. This is a significant missing feature for a public release.

### 18. Inconsistent branding in `ChangeByOneAbout.tsx`
The page uses purple (`#a371f7`) as its accent color, but the entire Change by One game uses amber/yellow (`#fbbf24`). The about page feels like it belongs to a different game.

### 19. `ChangeByOneHome` title is "CHANGEBYONE" (one word)
The layout header shows "Change by One" (three words) but the home title card renders it as "CHANGEBYONE" — all caps, one word. Inconsistent branding.

### 20. `WordPoolAbout.tsx` has a hardcoded category list that may not match the JSON
The about page lists 6 specific categories in JSX, but the actual category data comes from `wordpool-categories.json`. If the JSON changes, the about page will be stale/wrong.

### 21. `WordPoolPreviousGames.tsx` fetch has no `.catch()`
Same issue as #13 — no error handling if the categories JSON fails to load.

### 22. `ChangeByOnePage` word chain includes the start word but no "step 0" context
The word chain display shows the start word in the chain, but there's no label distinguishing "START" from intermediate steps. For new players, it may not be obvious that the first word shown is the starting point.

### 23. Sharing uses `navigator.clipboard.writeText` with no error handling
Both `LetterMixPage` and `WordPoolPage` share results by writing to clipboard. On HTTP (non-HTTPS) or when clipboard permission is denied, this throws silently. The "Share" / "Copied!" state will show "Copied!" even if it failed.

### 24. `ChangeByOneLayout` menu is missing a "Reset puzzle" option
`LetterMixLayout` provides a "Reset puzzle" option in the hamburger menu. `ChangeByOneLayout` only has "About" and "Back to Hub" — no menu-level reset. The reset button is buried inside the game card.

---

## 🟢 LOW — Polish and production-readiness

### 25. Missing SEO meta tags in `index.html`
No `<meta name="description">`, no Open Graph tags (`og:title`, `og:image`, `og:description`), no Twitter card tags. Essential for sharing and discoverability when the web version is live.

### 26. Inter font only loads weights 400–700, but CSS uses 750, 850, 900
`index.html` loads Inter for weights 400–700 from Google Fonts, but `index.css` and components use `font-weight: 750`, `850`, `900`, `1000`. These weights don't exist in the Inter spec — browsers approximate them, but for correct rendering the font load should include `wght@100..900` (variable font range).

### 27. `zustand` is installed but never used (`package.json`)
`zustand` appears in dependencies but is not imported anywhere in the codebase. It's dead weight that increases bundle size and can be removed.

### 28. No global error boundary
No React `ErrorBoundary` component wraps the app. If any component throws an unhandled error (e.g., malformed puzzle data), the entire app will crash to a blank screen with no recovery path.

### 29. `suggestNextStep` hint algorithm can give bad hints (`cbo-gameLogic.ts`)
The function uses a greedy letter-similarity approach — it picks the neighbor that shares the most letters with the target. This can choose a path that leads to a dead end (local optimum). A proper BFS/BFS-pathfinding approach would guarantee the hint is on a valid solution path.

### 30. Missing `robots.txt` and web manifest in `/public`
No `robots.txt` for search engine guidance, no `manifest.json` for PWA installability. Both are simple files but meaningful for a public web release.

### 31. No loading skeleton or progressive enhancement
All three games show simple "Loading..." text during data fetch. A skeleton UI or animated placeholder would make the app feel more polished on first load.

### 32. `LetterMixCalendar` first puzzle date is hardcoded as `2025-01-01`
If your puzzle JSON doesn't have entries for every day since January 1, 2025, clicking those past dates will load a fallback puzzle (line 74–75 of `LetterMixPage`: falls back to first puzzle of that level). Players may not realize they're not playing the correct historical puzzle.

### 33. `WordPoolPage` — `/wordpool/:date` route exists but has no UI entry point
The route `<Route path=":date" element={<WordPoolPage />} />` is declared in `App.tsx` but there's no date-picker, calendar, or link that navigates to a specific WordPool date URL. Dead route.

### 34. PRNG in `dailySeed.ts` has a suspicious line
Line 13: `h = Math.imul(h ^ (h << 13), 1 | 0)` — `1 | 0` always evaluates to `1`, making this an identity multiply. The PRNG may not distribute puzzle indices evenly across all categories. Compare with the cleaner mulberry32 PRNG used in `cbo-dailyChallenge.ts`.

---

## Quick Wins (smallest effort, big impact)

1. Fix `ComingSoon.tsx` copy → "fourth game" (1 line)
2. Add `--hub-text` CSS variable definition → fixes ghost button color (1 line)
3. Fix ChangeByOneHome description → add "7-letter" to the word length list (1 word)
4. Add `<meta name="description">` to `index.html` (1 line)
5. Replace `vite.svg` favicon with your own (1 file swap)
6. Remove `zustand` from package.json (1 command: `npm uninstall zustand`)
7. Add a catch-all 404 route in `App.tsx` (3 lines)
8. Fix `ChangeByOneAbout.tsx` accent color from purple to amber

---

## Pre-release Checklist

- [ ] Replace AdMob test IDs with production IDs
- [ ] Set `isTesting: false` in `ads.ts`
- [ ] Set a real `name` in `package.json`
- [ ] Replace `vite.svg` favicon
- [ ] Fix "third game" → "fourth game" in `ComingSoon.tsx`
- [ ] Configure server-side SPA fallback (or switch to HashRouter for web)
- [ ] Fix `--hub-text` CSS variable
- [ ] Fix `React.FormEvent` import in `WordPoolPage.tsx`
- [ ] Fix native win-state persistence in `LetterMixPage.tsx` (use async version)
- [ ] Merge the two `useWordDatabase()` calls in `LetterMixPage.tsx`
- [ ] Memoize `isStuck` with `useMemo` in `LetterMixPage.tsx`
- [ ] Add `.catch()` to fetches in `WordPoolPage.tsx` and `WordPoolPreviousGames.tsx`
- [ ] Add a 404 catch-all route
- [ ] Fix calendar future-month navigation limit
- [ ] Fix calendar difficulty lock (allow medium/hard selection)
- [ ] Fix branding consistency for Change by One (About page accent color)
- [ ] Fix ChangeByOneHome description ("4, 5, 6, and 7 letters")
- [ ] Add SEO meta tags and Open Graph tags to `index.html`
- [ ] Fix Inter font to load variable weight range
- [ ] Remove `zustand` dependency
- [ ] Add global error boundary component
- [ ] Add `robots.txt` and `manifest.json` to `/public`
- [ ] Add hint counter persistence on page refresh (ChangeByOnePage)
- [ ] Consider adding a past challenges / archive for Change by One
