/* Service Worker — Progress Tracker PWA
   Bump CACHE_NAME whenever any asset changes so stale caches are busted. */

const CACHE_NAME = 'pt-cache-v5.0';

const ASSETS = [
  '/',
  '/index.html',
  '/install.html',
  '/manifest.json',
  '/css/main.css',
  '/js/db.js',
  '/js/utils.js',
  '/js/city-svg.js',
  '/js/app.js',
  '/js/celebration.js',
  '/js/screens/home.js',
  '/js/screens/stats.js',
  '/js/screens/city.js',
  '/js/screens/calendar.js',
  '/js/screens/weekly-review.js',
  '/js/screens/notes.js',
  '/js/screens/settings.js',
  '/js/screens/add-habit.js',
  '/icons/logo.png',
  'https://unpkg.com/dexie@3.2.4/dist/dexie.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// ── INSTALL: cache all assets ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: delete old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: cache-first, fall back to network ──
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful responses from same origin + CDN
        if (response && response.status === 200) {
          const url = new URL(event.request.url);
          if (url.origin === self.location.origin || url.hostname === 'unpkg.com' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ── MESSAGES ──
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'RESCHEDULE_NOTIFICATIONS') {
    // Notification scheduling handled by client via open-tab timers.
  }
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
