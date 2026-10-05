// nextReset.ts — when does the daily puzzle set roll over?
//
// Yodoku's daily keys are mixed: ORDERLE, FERMI, Quiz Master and 7 Letters
// rotate on the UTC calendar day (getTodayIndex / getTodayUTCStr), while Clear
// the String, Change by One and Word Pool key off the LOCAL calendar day
// (getTodayDateStr / getTodayCboDateStr). So the countdown must be told which
// boundary it is counting to — there is no single global reset moment.

export type ResetMode = 'utc' | 'local';

/** Milliseconds until the next reset boundary of the given mode. */
export function msUntilNextReset(mode: ResetMode = 'utc', now: Date = new Date()): number {
  if (mode === 'utc') {
    const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0);
    return Math.max(0, next - now.getTime());
  }
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime();
  return Math.max(0, next - now.getTime());
}

/** HH:MM:SS (hours never truncated — a full day is at most 23:59:59). */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Human label for the boundary, e.g. "00:00 UTC". */
export function boundaryLabel(mode: ResetMode): string {
  return mode === 'utc' ? '00:00 UTC' : 'local midnight';
}
