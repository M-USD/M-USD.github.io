// Service Worker for offline functionality
const CACHE_NAME = 'm-usd-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/blockchain.js',
  '/security.js'
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
    .then(response => response || fetch(event.request))
  );
});

// Background sync for offline transactions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncPendingTransactions());
  }
});