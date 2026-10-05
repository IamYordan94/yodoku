// platform.ts — runtime platform helpers for the Capacitor Android build.
// `window.Capacitor` is injected by Capacitor core at runtime; on the plain
// web it is absent. Native detection is shared with the ad-free gate so both
// agree on what "native" means (`?native=1` simulates the app in a browser).
//
// Three native signals, any one of which is enough:
//   1. ?native=1  — explicit debug override
//   2. window.Capacitor.isNativePlatform()
//   3. the Capacitor WebView origin (https://localhost, server.androidScheme)
// Signal 3 is synchronous and available at <head> parse time, which is what
// lets the inline ad guard in index.html block the tag deterministically.

import { isNativeShell, type GuardWindow } from './adFree';

export function isNativeApp(): boolean {
  try {
    return isNativeShell(window as unknown as GuardWindow);
  } catch {
    return false;
  }
}
