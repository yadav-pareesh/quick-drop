const CACHE_NAME = 'quickdrop-shell-v2';

// Clean up old caches on activate
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and ignore WebSocket / non-http protocols
  if (event.request.method !== 'GET' || event.request.url.startsWith('ws')) {
    return;
  }

  // Navigation requests (HTML pages): ALWAYS Network-First
  // This ensures the browser always gets the latest index.html with up-to-date asset hashes
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // Static assets (hashed JS, CSS, fonts, images): Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (
          response &&
          response.status === 200 &&
          event.request.url.startsWith(self.location.origin) &&
          (event.request.url.includes('/assets/') ||
            event.request.url.endsWith('.svg') ||
            event.request.url.endsWith('.webmanifest'))
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
