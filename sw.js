const CACHE_NAME = 'vault-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/animations.css',
  './js/app.js',
  './js/core/db.js',
  './js/core/security.js',
  './js/modules/rates.js',
  './js/modules/analytics.js',
  './js/ui/renderer.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
