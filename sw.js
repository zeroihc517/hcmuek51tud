const CACHE_NAME = 'apma-hub-v1';
const urlsToCache = [
  '/',
  '/appliedmathematics.html',
  '/TRANGWEB/styleweb.css',
  '/TRANGWEB/config.js',
  '/TRANGWEB/main.js'
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
