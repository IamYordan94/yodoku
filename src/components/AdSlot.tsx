// AdSlot — renders an ad container at a defined placement.
// Injects the configured ad tag once per page load. Renders
// nothing when no network is configured, so the site stays
// clean until the owner activates ads.

import { useEffect } from 'react';
import { AD_CONFIG, adsEnabled } from '../utils/ads';
import { shouldLoadAdTagNow } from '../utils/adFree';

let tagInjected = false;

export default function AdSlot({
  slot,
  minHeight = 100,
}: {
  slot: string;
  minHeight?: number;
}) {
  useEffect(() => {
    // The ad-free gate: native app + Yodoku+ subscribers never get a tag.
    if (!AD_CONFIG.monetagTagUrl || tagInjected || !shouldLoadAdTagNow()) return;
    const s = document.createElement('script');
    s.src = AD_CONFIG.monetagTagUrl;
    s.setAttribute('data-cfasync', 'false');
    s.async = true;
    document.head.appendChild(s);
    tagInjected = true;
  }, []);

  if (!adsEnabled || !shouldLoadAdTagNow()) return null;

  return (
    <div
      data-ad-slot={slot}
      style={{
        minHeight,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '12px 0',
      }}
    />
  );
}
