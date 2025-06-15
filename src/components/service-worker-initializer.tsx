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
        description: 'A new version is available. Click to update.',
        action: {
          label: 'Update',
          onClick: () => update(),
        },
      })
    }
  }, [updateAvailable, update, toast])

  useEffect(() => {
    if (supported && registered) {
      console.log('Service Worker is active')
    }
  }, [supported, registered])

  return null
}