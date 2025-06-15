const CACHE_NAME = 'harper-ai-v3'
const STATIC_CACHE = 'harper-ai-static-v3'
const DYNAMIC_CACHE = 'harper-ai-dynamic-v3'

const urlsToCache = [
  '/',
  '/dashboard',
  '/contacts',
  '/calling',
  '/reports',
  '/offline.html',
  '/manifest.json',
]

const staticAssets = [
  '/favicon.ico',
  '/logo.svg',
  '/fonts/inter.woff2',
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(staticAssets))
    ])
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  clients.claim()
})

// Fetch event with advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip chrome-extension and non-http(s) requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return
  }

  // API calls - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone()
          
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache)
          })
          
          return response
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            if (response) {
              return response
            }
            // Return offline fallback for API errors
            return new Response(
              JSON.stringify({ error: 'Offline', message: 'Please check your connection' }),
              { headers: { 'Content-Type': 'application/json' } }
            )
          })
        })
    )
    return
  }

  // Static assets - Cache first, fallback to network
  if (staticAssets.includes(url.pathname) || url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response
        }
        
        return fetch(request).then((response) => {
          // Don't cache non-success responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          
          const responseToCache = response.clone()
          
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache)
          })
          
          return response
        })
      })
    )
    return
  }

  // HTML pages - Network first, fallback to cache, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Update cache with fresh content
          const responseToCache = response.clone()
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
          
          return response
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            if (response) {
              return response
            }
            
            // Return offline page for navigation requests
            return caches.match('/offline.html')
          })
        })
    )
    return
  }

  // Default - Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Don't cache POST requests or non-success responses
        if (request.method !== 'GET' || !response || response.status !== 200) {
          return response
        }
        
        const responseToCache = response.clone()
        
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseToCache)
        })
        
        return response
      })
      .catch(() => {
        return caches.match(request)
      })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions())
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: data.url || '/',
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png',
      },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  )
})

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-contacts') {
    event.waitUntil(updateContacts())
  }
})

// Helper functions
async function syncOfflineActions() {
  try {
    const cache = await caches.open('offline-actions')
    const requests = await cache.keys()
    
    for (const request of requests) {
      try {
        const response = await fetch(request.clone())
        if (response.ok) {
          await cache.delete(request)
        }
      } catch (error) {
        console.error('Failed to sync offline action:', error)
      }
    }
  } catch (error) {
    console.error('Sync failed:', error)
  }
}

async function updateContacts() {
  try {
    const response = await fetch('/api/contacts/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lastSync: await getLastSyncTime(),
      }),
    })
    
    if (response.ok) {
      await setLastSyncTime(Date.now())
    }
  } catch (error) {
    console.error('Contact update failed:', error)
  }
}

async function getLastSyncTime() {
  // Implementation depends on your storage strategy
  return 0
}

async function setLastSyncTime(time) {
  // Implementation depends on your storage strategy
}