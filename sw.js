// Service Worker Version & Cache Name unik untuk Warga Tulung
const CACHE_NAME = 'warga-tulung-v1';
const ASSETS_TO_CACHE = [
  '/warga-tulung/',
  '/warga-tulung/index.html',
  '/warga-tulung/manifest.json',
  '/warga-tulung/icon.png',
  '/warga-tulung/icon2.png'
];

// 1. Proses Install: Simpan file utama ke Cache
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Proses Aktivasi: Bersihkan cache lama jika ada update versi
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

// 3. Menangani Fetch/Network (Offline Support)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 4. Menangani Push Notification
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