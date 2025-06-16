'use client'

import { useEffect } from 'react'
import { usePerformanceInit } from '@/hooks/use-performance-init'

export function PerformanceInitializer() {
  usePerformanceInit()
  
  useEffect(() => {
    // Initialize performance monitoring
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Log navigation timing
      const logNavigationTiming = () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        console.log('Performance Metrics:', {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.fetchStart,
        })
      }
      
      if (document.readyState === 'complete') {
        logNavigationTiming()
      } else {
        window.addEventListener('load', logNavigationTiming)
      }
    }
  }, [])
  
  return null
}