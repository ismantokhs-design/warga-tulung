const CACHE_NAME = 'warga-tulung-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html?v=1',
  './manifest.json',
  './icon.png?v=1',
  './icon2.png?v=1'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache.startsWith('warga-tulung-')) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.text() : 'Notifikasi Warga Tulung';
  const options = {
    body: data,
    icon: 'icon.png?v=1',
    badge: 'icon.png?v=1'
  };
  event.waitUntil(
    self.registration.showNotification('Warga Tulung', options)
  );
});