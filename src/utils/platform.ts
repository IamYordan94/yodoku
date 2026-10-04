// platform.ts — runtime platform helpers for the Capacitor Android build.
// `window.Capacitor` is injected by Capacitor core at runtime; on the plain
// web it is absent, so every check here is false in a browser.

export function isNativeApp(): boolean {
  const cap = (window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean; platform?: string };
  }).Capacitor;
  if (!cap) return false;
  if (typeof cap.isNativePlatform === 'function') return cap.isNativePlatform();
  return typeof cap.platform === 'string' && cap.platform !== 'web';
}
