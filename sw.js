// Service Worker Version: v1

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Menangani Push Notification yang masuk
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.text() : 'Notifikasi Warga Tulung';
  
  const options = {
    body: data,
    icon: 'icon.png',
    badge: 'icon.png'
  };

  event.waitUntil(
    self.registration.showNotification('Warga Tulung', options)
  );
});