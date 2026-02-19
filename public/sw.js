const CACHE_NAME = 'vendocollect-v1';

const PRECACHE_URLS = [
    '/',
    '/favicon.ico',
    '/favicon.svg',
    '/apple-touch-icon.png',
];

// Install: precache essential assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        }).then(() => self.skipWaiting())
    );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: network-first strategy (always try network, fall back to cache)
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Skip non-http(s) requests
    if (!event.request.url.startsWith('http')) return;

    // Skip Vite HMR or API calls
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/__')) return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Cache successful responses for static assets
                if (
                    networkResponse.ok &&
                    (url.pathname.startsWith('/build/') ||
                        url.pathname.match(/\.(png|svg|ico|woff2?|css|js)$/))
                ) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Offline fallback: serve from cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    // If it's a navigation request (page), serve the cached root
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }
                });
            })
    );
});
