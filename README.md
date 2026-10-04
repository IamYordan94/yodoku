# Yodoku

A web-based educational word game hub featuring two daily puzzle games. Built with React, TypeScript, Vite, and Tailwind CSS.

## Games

### Clear the String
Letters from multiple hidden words are scrambled together into a single string. Select letters to form valid English words and remove them. Find all solution words to win.

- **3 difficulty levels** — easy, medium, hard — new puzzles daily
- **Hint system** — reveals word length, then first letter
- **Calendar** — replay any past puzzle back to January 2025
- **Progress tracked** in localStorage

### WordPool
Name words that fit a category with progressively narrowing constraints. Starting broad ("Animals"), each level adds a new restriction until only a handful of precise words qualify.

- **6 categories** — Animals, Food & Cooking, Transportation, Nature & Plants, Occupations, Sports & Activities
- **6 levels per category** — each one narrows the constraint
- **In-game level selector** — jump to any unlocked level
- **Hint system** — word length → first letter, progressive reveal
- **Session recovery** — found words are saved mid-level so a page refresh doesn't lose progress
- **Daily rotation** — the hub picks a category automatically based on the date; or browse all via Previous Games

## Tech Stack

| Tool | Version |
|---|---|
| React | 19 |
| TypeScript | ~5.9 |
| Vite | 7 |
| Tailwind CSS | 4 |
| Framer Motion | 12 |
| React Router | 7 |
| Zustand | 5 |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  pages/          # One file per page/route
  layouts/        # Shared layout wrappers (header + outlet)
  components/     # Reusable UI components
  hooks/          # useWordDatabase (loads words.json for LetterMix validation)
  utils/
    storage.ts    # All localStorage helpers
    dailySeed.ts  # Deterministic daily puzzle seeding

public/
  data/
    words.json                 # Word database for LetterMix validation
    lettermix-puzzles.json     # Pre-generated daily puzzles (2025–2026)
    wordpool-categories.json   # Category + level word lists

scripts/
  generateLetterMixPuzzles.js  # Node script to regenerate lettermix-puzzles.json
```

## Generating New Puzzles

The LetterMix puzzles are pre-generated and committed. To regenerate them (e.g. to extend beyond 2026):

```bash
node scripts/generateLetterMixPuzzles.js
```

This reads `public/data/words.json` and writes a new `public/data/lettermix-puzzles.json`.

## Data Format

### `wordpool-categories.json`
```json
{
  "categories": [
    {
      "id": "animals",
      "name": "Animals",
      "levels": [
        { "level": 1, "name": "Animals", "words": ["cat", "dog", ...] },
        { "level": 2, "name": "Wild Animals", "words": [...] }
      ]
    }
  ]
}
```

### `lettermix-puzzles.json`
```json
[
  {
    "date": "2025-01-01",
    "level": "easy",
    "scrambledLetters": "BLETAFORK",
    "solutionWords": ["table", "fork"]
  }
]
```

## Storage Keys

| Key | Contents |
|---|---|
| `yodoku_lettermix_completed` | Record of completed LetterMix puzzles + found words |
| `yodoku_wordpool_progress` | Highest unlocked level per WordPool category |
| `yodoku_wordpool_session` | In-progress found words per category+level (cleared on level completion) |
