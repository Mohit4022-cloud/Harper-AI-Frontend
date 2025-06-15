export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  // Only register in production or if explicitly enabled
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_SERVICE_WORKER !== 'true') {
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('Service Worker registered successfully:', registration.scope)

    // Check for updates on page focus
    window.addEventListener('focus', () => {
      registration.update()
    })

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          if (window.confirm('New version available! Reload to update?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' })
            window.location.reload()
          }
        }
      })
    })

    // Handle controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })

    // Enable navigation preload if supported
    if ('navigationPreload' in registration) {
      await registration.navigationPreload.enable()
    }

    // Register periodic sync if supported
    if ('periodicSync' in registration) {
      try {
        await registration.periodicSync.register('update-contacts', {
          minInterval: 24 * 60 * 60 * 1000, // 24 hours
        })
      } catch (error) {
        console.log('Periodic sync not supported:', error)
      }
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      console.log('Notification permission:', permission)
    }

    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
  }
}

export async function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    
    for (const registration of registrations) {
      await registration.unregister()
    }
    
    console.log('Service Workers unregistered')
  } catch (error) {
    console.error('Service Worker unregistration failed:', error)
  }
}

// Helper to send messages to service worker
export function sendMessageToSW(message: any) {
  if (!navigator.serviceWorker.controller) {
    return Promise.reject(new Error('No service worker controller'))
  }

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel()
    
    messageChannel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(event.data.error)
      } else {
        resolve(event.data)
      }
    }
    
    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2])
  })
}

// Check if service worker is supported and registered
export async function getServiceWorkerStatus() {
  if (!('serviceWorker' in navigator)) {
    return { supported: false, registered: false, ready: false }
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    
    return {
      supported: true,
      registered: !!registration,
      ready: !!navigator.serviceWorker.controller,
      scope: registration?.scope,
      updateAvailable: registration?.waiting ? true : false,
    }
  } catch (error) {
    return {
      supported: true,
      registered: false,
      ready: false,
      error: error.message,
    }
  }
}