// adFree.ts — the single source of truth for the ad-free gate.
//
// DORMANT-SAFE: web free users keep the exact same Monetag In-Page tag as
// before. The gate returns LOAD for every signal combination that is false —
// i.e. ordinary web traffic. It returns BLOCK only for:
//   • the native Android app (always), and
//   • a web visitor with an active Yodoku+ state (?plus=1 / persisted flag).
//
// index.html mirrors this table in a tiny inline <head> guard so the Monetag
// tag never even requests for those visitors. scripts/test-ad-guard.mjs
// asserts THIS file's truth table.

export const PLUS_STORAGE_KEY = 'yodoku_plus_local';

export interface AdGuardSignals {
  /** ?native=1 — debug override that simulates the native app in a browser. */
  nativeParam: boolean;
  /** ?plus=1 — debug override that simulates a Yodoku+ subscriber. */
  plusParam: boolean;
  /** window.Capacitor.isNativePlatform() (or platform !== 'web'). */
  capacitorNative: boolean;
  /** Native WebView origin: https://localhost (Capacitor server.androidScheme). */
  nativeOrigin: boolean;
  /** Persisted Yodoku+ state (localStorage `yodoku_plus_local` === '1'). */
  storedPlus: boolean;
}

/** Minimal window-shaped surface so the guard stays unit-testable. */
export interface GuardWindow {
  location?: { protocol?: string; hostname?: string; port?: string; search?: string };
  Capacitor?: { isNativePlatform?: () => boolean; platform?: string };
  localStorage?: { getItem: (key: string) => string | null };
}

/** Read a `name=1` query flag without ever throwing. */
export function hasSearchFlag(search: string, name: string): boolean {
  try {
    return new URLSearchParams(search).get(name) === '1';
  } catch {
    return false;
  }
}

/** Native WebView origin check that does NOT depend on Capacitor bridge timing. */
export function isNativeOrigin(protocol: string, hostname: string, port: string): boolean {
  return protocol === 'https:' && hostname === 'localhost' && port === '';
}

/** True when the current window is the native app (or ?native=1 simulation). */
export function isNativeShell(win: GuardWindow): boolean {
  const loc = win.location ?? {};
  if (hasSearchFlag(loc.search ?? '', 'native')) return true; // ?native=1 override
  const cap = win.Capacitor;
  if (cap) {
    if (typeof cap.isNativePlatform === 'function') {
      if (cap.isNativePlatform()) return true;
    } else if (typeof cap.platform === 'string' && cap.platform !== 'web') {
      return true;
    }
  }
  return isNativeOrigin(loc.protocol ?? '', loc.hostname ?? '', loc.port ?? '');
}

/** True when the visitor must never receive the ad tag. */
export function isAdFree(s: AdGuardSignals): boolean {
  return s.nativeParam || s.plusParam || s.capacitorNative || s.nativeOrigin || s.storedPlus;
}

/**
 * The whole truth table: should the Monetag In-Page tag load for this visitor?
 * Pure function — no window access — so it is exhaustively unit-tested.
 */
export function shouldLoadAdTag(s: AdGuardSignals): boolean {
  return !isAdFree(s);
}

function readStoredPlus(win: GuardWindow): boolean {
  try {
    return win.localStorage?.getItem(PLUS_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Collect the live signals from a window object. */
export function currentSignals(win: GuardWindow): AdGuardSignals {
  const loc = win.location ?? {};
  const search = loc.search ?? '';
  const cap = win.Capacitor;
  let capacitorNative = false;
  if (cap) {
    if (typeof cap.isNativePlatform === 'function') {
      capacitorNative = cap.isNativePlatform();
    } else {
      capacitorNative = typeof cap.platform === 'string' && cap.platform !== 'web';
    }
  }
  return {
    nativeParam: hasSearchFlag(search, 'native'),
    plusParam: hasSearchFlag(search, 'plus'),
    capacitorNative,
    nativeOrigin: isNativeOrigin(loc.protocol ?? '', loc.hostname ?? '', loc.port ?? ''),
    storedPlus: readStoredPlus(win),
  };
}

/** Live check against the real window — used by ad surfaces. */
export function shouldLoadAdTagNow(): boolean {
  return shouldLoadAdTag(currentSignals(window as unknown as GuardWindow));
}
