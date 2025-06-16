'use client'

import { useEffect } from 'react'
import { useServiceWorker } from '@/hooks/use-service-worker'
import { useToast } from '@/hooks/use-toast'

export function ServiceWorkerInitializer() {
  const { supported, registered, updateAvailable, update } = useServiceWorker()
  const { toast } = useToast()

  useEffect(() => {
    if (updateAvailable) {
      toast({
        title: 'Update Available',
        description: 'A new version is available. Refresh to update.',
      })
      // Automatically update after a short delay
      setTimeout(() => update(), 2000)
    }
  }, [updateAvailable, update, toast])

  useEffect(() => {
    if (supported && registered) {
      console.log('Service Worker is active')
    }
  }, [supported, registered])

  return null
}