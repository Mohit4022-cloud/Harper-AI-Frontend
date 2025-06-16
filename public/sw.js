// Service Worker for Harper AI
const CACHE_NAME = 'harper-ai-v1'
const urlsToCache = [
  '/',
  '/offline',
  '/_next/static/css/*.css',
  '/_next/static/js/*.js',
  '/favicon.ico',
  '/logo.png',
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache opened')
      return cache.addAll(urlsToCache.map(url => {
        // Handle glob patterns
        if (url.includes('*')) {
          return new Request(url.replace('*', ''), { mode: 'no-cors' })
        }
        return url
      }))
    })
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip API requests and WebSocket connections
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/api/') || url.protocol === 'ws:' || url.protocol === 'wss:') {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response
      }

      // Clone the request
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          // Cache successful responses
          if (event.request.url.includes('_next/static/')) {
            cache.put(event.request, responseToCache)
          }
        })

        return response
      }).catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline')
        }
      })
    })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-contacts') {
    event.waitUntil(syncContacts())
  }
})

async function syncContacts() {
  // Implement offline sync logic
  console.log('[SW] Syncing offline changes...')
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from Harper AI',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View',
      },
      {
        action: 'close',
        title: 'Close',
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Harper AI', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})