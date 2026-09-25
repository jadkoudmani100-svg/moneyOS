 const CACHE_NAME = 'vault-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './offline.html',        // <--- أضفنا صفحة انقطاع الإنترنت هنا
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

// مرحلة التثبيت وتخزين الملفات
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching app assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// تنظيف الكاش القديم عند التحديث
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// التعامل مع الطلبات والتحول لصفحة الـ Offline عند انقطاع الشبكة
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // إرجاع الملف المخزن إذا وجد، وإلا جلبه من الشبكة
      return cachedResponse || fetch(e.request).catch(() => {
        // إذا فشل الاتصال بالشبكة وكان الطلب لصفحة HTML، يتم عرض صفحة offline.html
        if (e.request.mode === 'navigate') {
          return caches.match('./offline.html');
        }
      });
    })
  );
});
