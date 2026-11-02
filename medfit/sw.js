const CACHE_NAME = 'medfit-pass-offline-v5';

// Lors de l'installation, on met en cache la page principale et les ressources critiques
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './icon.svg',
      ]);
    })
  );
});

// Nettoyage des anciens caches à l'activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Stratégie Cache-First avec mise en cache automatique de tous les bundles JS/CSS/Fonts
// Permet à l'iPhone et à l'iPad de fonctionner à 100% quand le Mac/PC est éteint !
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si le PC est éteint ou hors-ligne, on renvoie le cache ou index.html
          return cachedResponse || caches.match('/index.html');
        });

      return cachedResponse || fetchPromise;
    })
  );
});