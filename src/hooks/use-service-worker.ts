import { useState, useEffect, useCallback } from 'react'

interface UseServiceWorkerReturn {
  supported: boolean
  registered: boolean
  updateAvailable: boolean
  registration: ServiceWorkerRegistration | null
  update: () => Promise<void>
  unregister: () => Promise<void>
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [supported] = useState(() => typeof window !== 'undefined' && 'serviceWorker' in navigator)
  const [registered, setRegistered] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (!supported || process.env.NODE_ENV !== 'production') return

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        setRegistration(reg)
        setRegistered(true)

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true)
              }
            })
          }
        })
      } catch (error) {
        console.error('Service worker registration failed:', error)
      }
    }

    registerServiceWorker()
  }, [supported])

  const update = useCallback(async () => {
    if (registration) {
      await registration.update()
      window.location.reload()
    }
  }, [registration])

  const unregister = useCallback(async () => {
    if (registration) {
      await registration.unregister()
      setRegistered(false)
      setRegistration(null)
    }
  }, [registration])

  return {
    supported,
    registered,
    updateAvailable,
    registration,
    update,
    unregister,
  }
}