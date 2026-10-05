// Merge per-category question bank files into the single public bank.
// Usage: node scripts/merge-quiz-bank.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IN_DIR = path.join(ROOT, 'scripts', 'quiz-bank');
const OUT = path.join(ROOT, 'public', 'data', 'quiz-bank.json');

const CATS = [
  { id: 'general', label: 'General', emoji: '🌍' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'movies', label: 'Movies & TV', emoji: '🎬' },
  { id: 'geography', label: 'Geography', emoji: '🗺️' },
  { id: 'science', label: 'Science & Nature', emoji: '🔬' },
  { id: 'history', label: 'History', emoji: '🏛️' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'food', label: 'Food & Drink', emoji: '🍔' },
  { id: 'art', label: 'Art & Literature', emoji: '📚' },
  { id: 'animals', label: 'Animals', emoji: '🦁' },
];

// Optional per-question explanations (id -> one-line fact). Applied here so the
// merged bank keeps its explanations even after the sustainer appends new
// questions; the mapping file is the source of truth and grows over time.
const EXPLANATIONS_FILE = path.join(IN_DIR, 'explanations.json');
const explanations = fs.existsSync(EXPLANATIONS_FILE)
  ? JSON.parse(fs.readFileSync(EXPLANATIONS_FILE, 'utf8'))
  : {};
let attached = 0;

const questions = [];
const seen = new Set();

for (const cat of CATS) {
  const file = path.join(IN_DIR, `${cat.id}.json`);
  if (!fs.existsSync(file)) {
    console.error(`MISSING: ${file}`);
    process.exit(1);
  }
  const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(arr)) {
    console.error(`NOT AN ARRAY: ${file}`);
    process.exit(1);
  }
  for (const q of arr) {
    // sanity checks
    if (!q.id || typeof q.question !== 'string' || !Array.isArray(q.options) || q.options.length !== 4) {
      console.error(`BAD SHAPE in ${cat.id}: ${JSON.stringify(q).slice(0, 140)}`);
      process.exit(1);
    }
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3) {
      console.error(`BAD ANSWER in ${cat.id}: ${q.id}`);
      process.exit(1);
    }
    if (![1, 2, 3].includes(q.difficulty)) {
      console.error(`BAD DIFFICULTY in ${cat.id}: ${q.id}`);
      process.exit(1);
    }
    if (seen.has(q.id)) {
      console.error(`DUPLICATE ID: ${q.id}`);
      process.exit(1);
    }
    seen.add(q.id);
    const explanation = explanations[q.id];
    if (typeof explanation === 'string' && explanation.trim()) attached++;
    questions.push({
      ...q,
      category: cat.id,
      ...(typeof explanation === 'string' && explanation.trim() ? { explanation } : {}),
    });
  }
  console.log(`  ${cat.id}: ${arr.length} questions`);
}

const bank = { version: 1, categories: CATS, questions };
fs.writeFileSync(OUT, JSON.stringify(bank, null, 2));
console.log(`  explanations attached: ${attached}/${questions.length}`);
console.log(`OK: ${questions.length} questions across ${CATS.length} categories -> ${path.relative(ROOT, OUT)}`);
