const CACHE_NAME = 'pt-cache-v4.0';
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

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // Return offline fallback if needed
      });
    })
  );
});

// Mock push for local notification scheduling
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'RESCHEDULE_NOTIFICATIONS') {
    // In a real PWA this would rely on Push API or Periodic Sync.
    // For local offline PWA notifications without server, 
    // we use a simplistic approach or rely on the open client to schedule.
  }
});
