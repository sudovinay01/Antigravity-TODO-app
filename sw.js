// ===================================
// Service Worker for Todo App PWA
// Enhanced with better caching strategies
// ===================================

const CACHE_NAME = 'todo-app-v3';
const STATIC_CACHE = 'todo-static-v3';
const DYNAMIC_CACHE = 'todo-dynamic-v3';

// Static assets to pre-cache
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json'
];

// External resources to cache
const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// ===================================
// Install Event - Pre-cache assets
// ===================================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');

    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[SW] Pre-caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            // Cache external assets (fonts)
            caches.open(DYNAMIC_CACHE).then((cache) => {
                console.log('[SW] Caching external assets');
                return Promise.all(
                    EXTERNAL_ASSETS.map(url =>
                        fetch(url).then(response => {
                            if (response.ok) {
                                return cache.put(url, response);
                            }
                        }).catch(() => {
                            console.log('[SW] Could not cache:', url);
                        })
                    )
                );
            })
        ])
    );

    // Skip waiting to activate immediately
    self.skipWaiting();
});

// ===================================
// Activate Event - Clean old caches
// ===================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');

    const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!currentCaches.includes(cacheName)) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Ready to handle fetches');
        })
    );

    // Take control of all pages immediately
    self.clients.claim();
});

// ===================================
// Fetch Event - Smart caching strategy
// ===================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) return;

    // Strategy: Cache First for static assets, Network First for dynamic
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request));
    } else {
        event.respondWith(networkFirst(request));
    }
});

// ===================================
// Caching Strategies
// ===================================

// Cache First - For static assets
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return new Response('Offline', { status: 503 });
    }
}

// Network First - For dynamic content
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response('Offline', { status: 503 });
    }
}

// Check if request is for a static asset
function isStaticAsset(url) {
    const staticExtensions = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.svg', '.ico', '.woff', '.woff2'];
    return staticExtensions.some(ext => url.pathname.endsWith(ext)) || url.pathname === '/';
}

// ===================================
// Background Sync (for future use)
// ===================================
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync event:', event.tag);

    if (event.tag === 'sync-todos') {
        event.waitUntil(syncTodos());
    }
});

async function syncTodos() {
    // Future: Sync todos with a backend
    console.log('[SW] Syncing todos...');
}

// ===================================
// Push Notifications (for reminders)
// ===================================
self.addEventListener('push', (event) => {
    console.log('[SW] Push event received');

    const options = {
        body: event.data ? event.data.text() : 'You have a reminder!',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">✨</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">✓</text></svg>',
        vibrate: [100, 50, 100],
        tag: 'todo-reminder',
        renotify: true,
        actions: [
            { action: 'view', title: 'View Tasks' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Todo App', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                // Focus existing window if open
                for (const client of clientList) {
                    if (client.url.includes('index.html') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow('./index.html');
                }
            })
        );
    }
});

// ===================================
// Message Handler (for app badge updates)
// ===================================
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data && event.data.type === 'UPDATE_BADGE') {
        updateBadge(event.data.count);
    }

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Update app badge with task count
async function updateBadge(count) {
    if ('setAppBadge' in navigator) {
        try {
            if (count > 0) {
                await navigator.setAppBadge(count);
            } else {
                await navigator.clearAppBadge();
            }
        } catch (error) {
            console.log('[SW] Badge update failed:', error);
        }
    }
}
