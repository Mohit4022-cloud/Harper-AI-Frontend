'use client'

import { useEffect } from 'react'
import { initWebVitals, markPerformance } from '@/lib/performance'
import { usePathname } from 'next/navigation'

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Initialize Web Vitals monitoring
  useEffect(() => {
    initWebVitals()
  }, [])

  // Track route changes
  useEffect(() => {
    markPerformance(`route-change-${pathname}`)
  }, [pathname])

  // Register service worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return <>{children}</>
}