// Service Worker for Yodoku — network-first for shell + data, cache-first for hashed assets
const CACHE = 'yodoku-v1';
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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Network-first for the app shell and data: always fresh after a redeploy
  if (
    url.origin === self.location.origin &&
    (url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.startsWith('/data/'))
  ) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          return resp;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || new Response('Offline')))
    );
    return;
  }

  // Cache-first for hashed static assets (safe: content-hashed filenames)
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
});
