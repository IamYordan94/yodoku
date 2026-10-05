// Service Worker for Yodoku — network-first for pages + data, cache-first only for
// content-hashed assets. Cached copies are the offline fallback.
// FIXED 2026-10-05: the previous version only refreshed '/', so every other route AND
// the root-level puzzle .json files were served cache-first and stayed STALE for
// returning visitors after each deploy. v2 purges the old cache on activate.
const CACHE = 'yodoku-v2';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

const networkFirst = (event) =>
  fetch(event.request)
    .then((resp) => {
      const clone = resp.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, clone));
      return resp;
    })
    .catch(() =>
      caches.match(event.request).then(
        (cached) => cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
      )
    );

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Not ours (fonts, ad tag, other origins): leave it to the browser.
  if (url.origin !== self.location.origin) return;
  // Server routes: never cached, never intercepted.
  if (url.pathname.startsWith('/api/')) return;

  // Pages (any navigation / html) and ALL json data (root-level puzzle files included)
  // and /data/: always fresh when online; the cached copy is only the offline fallback.
  if (
    event.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.json') ||
    url.pathname.startsWith('/data/')
  ) {
    event.respondWith(networkFirst(event));
    return;
  }

  // Content-hashed build assets: cache-first is safe (the filename changes on every change).
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((resp) => {
            const clone = resp.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
            return resp;
          })
      )
    );
    return;
  }

  // Everything else (icons, images, manifest, sitemap): network-first, cache as fallback.
  event.respondWith(networkFirst(event));
});
