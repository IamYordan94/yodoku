// Next-daily-reset countdown tests. Standalone (mirrors src/utils/nextReset.ts).
// Prints ALL CHECKS PASSED on success.
function msUntilNextReset(mode = 'utc', now = new Date()) {
  if (mode === 'utc') {
    const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0);
    return Math.max(0, next - now.getTime());
  }
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime();
  return Math.max(0, next - now.getTime());
}
function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

const assert = (cond, msg) => { if (!cond) throw new Error('FAIL: ' + msg); };

// UTC boundary: 23:00 UTC -> 1 hour to midnight
assert(msUntilNextReset('utc', new Date(Date.UTC(2026, 9, 5, 23, 0, 0))) === 3600000, 'utc 23:00 wrong');
// UTC midday -> 12h
assert(msUntilNextReset('utc', new Date(Date.UTC(2026, 9, 5, 12, 0, 0))) === 43200000, 'utc 12:00 wrong');
// exactly at midnight UTC -> 24h
assert(msUntilNextReset('utc', new Date(Date.UTC(2026, 9, 5, 0, 0, 0))) === 86400000, 'utc midnight wrong');
// never negative
assert(msUntilNextReset('utc', new Date(Date.UTC(2026, 9, 5, 23, 59, 59, 999))) >= 0, 'utc never negative');
// local boundary: 23:00 local -> 1h (constructed in local time)
assert(msUntilNextReset('local', new Date(2026, 9, 5, 23, 0, 0)) === 3600000, 'local 23:00 wrong');
assert(msUntilNextReset('local', new Date(2026, 9, 5, 12, 0, 0)) === 43200000, 'local 12:00 wrong');
console.log('reset maths: utc + local boundaries ok');

// formatting
assert(formatCountdown(3600000) === '01:00:00', 'format 1h wrong: ' + formatCountdown(3600000));
assert(formatCountdown(86399000) === '23:59:59', 'format 23:59:59 wrong: ' + formatCountdown(86399000));
assert(formatCountdown(0) === '00:00:00', 'format 0 wrong');
assert(formatCountdown(61000) === '00:01:01', 'format 61s wrong: ' + formatCountdown(61000));
assert(formatCountdown(-5000) === '00:00:00', 'format negative should clamp');
console.log('formatCountdown: ok');

console.log('\nALL CHECKS PASSED');
