// Service Worker for Nightlife Navigator
const CACHE_NAME = 'nightlife-navigator-v1.0.0';
const STATIC_CACHE_NAME = 'nightlife-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'nightlife-dynamic-v1.0.0';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  // Add other static assets as needed
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/venues',
  '/api/user/profile',
  '/api/notifications',
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First strategy
    event.respondWith(networkFirstStrategy(request));
  } else if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    // Static assets - Cache First strategy
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Other requests - Stale While Revalidate strategy
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// Cache First Strategy (for static assets)
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First Strategy failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network First Strategy (for API requests)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline', { 
      status: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Offline' })
    });
  }
}

// Stale While Revalidate Strategy (for other requests)
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, return cached response if available
    return cachedResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-venues') {
    event.waitUntil(syncVenues());
  }
});

async function syncVenues() {
  try {
    const response = await fetch('/api/venues');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put('/api/venues', response.clone());
      console.log('[SW] Venues synced successfully');
    }
  } catch (error) {
    console.error('[SW] Venues sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let notificationData = {
    title: 'Nightlife Navigator',
    body: '新しい情報があります',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'nightlife-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: '表示',
        icon: '/icon-view.png'
      },
      {
        action: 'dismiss',
        title: '閉じる',
        icon: '/icon-dismiss.png'
      }
    ],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('[SW] Push data parsing failed:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'dismiss') {
    return;
  }
  
  const url = data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Message handling
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled rejection:', event);
});

console.log('[SW] Service Worker loaded:', CACHE_NAME);