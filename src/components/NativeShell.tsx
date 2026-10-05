// NativeShell.tsx — boots the native-only app-shell behaviours and mounts no UI.
//
// Responsibilities:
//   • status bar styling per route (sticker theme)
//   • hardware back button: in-app history back, else double-press to exit
//     with a sticker-style toast
//   • delegated haptics for any element marked [data-haptic]
//   • re-assert the daily reminder on launch (opt-in only)
//
// Everything is a no-op on the web, and with ?native=1 in a browser it can be
// exercised end-to-end (the toast + back handling are safe to test on desktop).

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { isNativeApp } from '../utils/platform';
import {
  applyStatusBarForPath,
  canGoBackInApp,
  hapticConfirm,
  hapticTap,
  syncDailyReminder,
} from '../utils/nativeShell';
import { showToast } from './Toast';

const EXIT_WINDOW_MS = 2000;

export default function NativeShell() {
  const { pathname } = useLocation();

  // Status bar: dark-header pages get light icons, /plus (paper top) dark icons.
  useEffect(() => {
    void applyStatusBarForPath(pathname);
  }, [pathname]);

  // Launch: keep the single opt-in reminder alive.
  useEffect(() => {
    void syncDailyReminder();
  }, []);

  // Hardware back button.
  useEffect(() => {
    if (!isNativeApp()) return;
    let lastBack = 0;
    const sub = CapApp.addListener('backButton', () => {
      if (canGoBackInApp()) {
        window.history.back();
        return;
      }
      const now = Date.now();
      if (now - lastBack < EXIT_WINDOW_MS) {
        void CapApp.exitApp().catch(() => undefined);
        return;
      }
      lastBack = now;
      hapticConfirm();
      showToast('Press back again to exit');
    });
    return () => {
      sub.then((h) => h.remove()).catch(() => undefined);
    };
  }, []);

  // Delegated haptics: any element tagged [data-haptic] gives a light tap.
  useEffect(() => {
    if (!isNativeApp()) return;
    const onDown = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[data-haptic]');
      if (el) hapticTap();
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, []);

  return null;
}
