// sw.js - Service Worker for offline support
const CACHE_NAME = 'flashcards-v2';
const urlsToCache = [
  './',                    // index.html
  'index.html',
  'manifest.json'
  // Add any other important files here (CSS, images, etc.)
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
