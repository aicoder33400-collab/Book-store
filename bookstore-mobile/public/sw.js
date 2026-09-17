// RMP Maktaba - Service Worker
const CACHE_NAME = 'rmp-maktaba-v1';
const RUNTIME_CACHE = 'rmp-maktaba-runtime';

// Fichiers à mettre en cache au démarrage
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
];

// Installation : mettre en cache l'App Shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Precache partiel:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activation : nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch : stratégie Network-first pour API, Cache-first pour assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas intercepter les appels API ni les uploads
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    return;
  }

  // Ne pas intercepter les méthodes non-GET
  if (request.method !== 'GET') return;

  // Assets statiques (JS, CSS, images, fonts) : Cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/) ||
    url.pathname.startsWith('/_expo/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation (HTML) : Network-first, fallback cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }
});
