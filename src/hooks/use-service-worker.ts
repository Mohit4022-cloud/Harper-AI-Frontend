import { useEffect, useState } from 'react'
import { registerServiceWorker, getServiceWorkerStatus } from '@/lib/service-worker'

interface ServiceWorkerStatus {
  supported: boolean
  registered: boolean
  ready: boolean
  updateAvailable: boolean
  error?: string
}

export function useServiceWorker() {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    supported: false,
    registered: false,
    ready: false,
    updateAvailable: false,
  })

  useEffect(() => {
    // Check if service worker should be enabled
    if (process.env.NEXT_PUBLIC_ENABLE_SERVICE_WORKER !== 'true') {
      return
    }

    let mounted = true

    const init = async () => {
      // Register service worker
      await registerServiceWorker()
      
      // Get initial status
      if (mounted) {
        const currentStatus = await getServiceWorkerStatus()
        setStatus(currentStatus as ServiceWorkerStatus)
      }
    }

    init()

    // Check for updates periodically
    const interval = setInterval(async () => {
      if (mounted) {
        const currentStatus = await getServiceWorkerStatus()
        setStatus(currentStatus as ServiceWorkerStatus)
      }
    }, 60000) // Check every minute

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const updateServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return

    const registration = await navigator.serviceWorker.getRegistration()
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  return {
    ...status,
    update: updateServiceWorker,
  }
}