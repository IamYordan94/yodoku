// gameResume storage tests. Standalone (mirrors src/utils/gameResume.ts) with an
// in-memory localStorage mock. Prints ALL CHECKS PASSED on success.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const STORE_KEY = 'yodoku_resume_v1';
const read = () => { try { const r = localStorage.getItem(STORE_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; } };
const write = (s) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* ignore */ } };
function saveResume(game, date, state) { const s = read(); s[game] = { d: date, t: Date.now(), s: state }; write(s); }
function loadResume(game, date) { const e = read()[game]; if (!e || e.d !== date) return null; return e.s; }
function hasResume(game, date) { const e = read()[game]; return !!e && e.d === date; }
function clearResume(game, date) { const s = read(); const e = s[game]; if (!e) return; if (date && e.d !== date) return; delete s[game]; write(s); }

const assert = (cond, msg) => { if (!cond) throw new Error('FAIL: ' + msg); };

// round trip
saveResume('orderle', '2026-10-05', { current: [1, 2, 0], attempts: 2 });
assert(JSON.stringify(loadResume('orderle', '2026-10-05')) === JSON.stringify({ current: [1, 2, 0], attempts: 2 }), 'round-trip failed');
assert(hasResume('orderle', '2026-10-05') === true, 'hasResume should be true');
console.log('save/load round trip: ok');

// wrong date -> null (no leak into a new day)
assert(loadResume('orderle', '2026-10-06') === null, 'stale date should return null');
assert(hasResume('orderle', '2026-10-06') === false, 'hasResume stale date should be false');
console.log('date isolation: ok');

// clearing
clearResume('orderle', '2026-10-06'); // mismatched date -> no-op
assert(hasResume('orderle', '2026-10-05') === true, 'clear with wrong date must not remove');
clearResume('orderle', '2026-10-05');
assert(hasResume('orderle', '2026-10-05') === false, 'clear should remove');
console.log('clear semantics: ok');

// multiple games are independent
saveResume('quiz', '2026-10-05', { answers: [1, null, 3], qIndex: 2 });
saveResume('fermi', '2026-10-05', { guesses: [], attempts: 0 });
assert(hasResume('quiz', '2026-10-05') && hasResume('fermi', '2026-10-05'), 'games should coexist');
clearResume('quiz');
assert(!hasResume('quiz', '2026-10-05') && hasResume('fermi', '2026-10-05'), 'clear one must not touch the other');
console.log('per-game isolation: ok');

// corrupt JSON must not throw
localStorage.setItem(STORE_KEY, '{not json');
assert(loadResume('orderle', '2026-10-05') === null, 'corrupt store should degrade to null');

console.log('\nALL CHECKS PASSED');
