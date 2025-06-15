import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initPerformanceMonitoring, performanceMonitor } from '@/lib/performance'

export function usePerformanceInit() {
  const pathname = usePathname()
  
  useEffect(() => {
    // Initialize performance monitoring on mount
    initPerformanceMonitoring()
    
    // Start memory leak detection in development
    if (process.env.NODE_ENV === 'development') {
      const { MemoryLeakDetector } = require('@/lib/performance-advanced')
      const detector = new MemoryLeakDetector()
      detector.start()
      
      return () => {
        detector.stop()
      }
    }
  }, [])
  
  // Track route changes
  useEffect(() => {
    performanceMonitor.measureApiCall(`route-${pathname}`, async () => {
      // Route change is handled by Next.js
    })
  }, [pathname])
  
  // Monitor long tasks
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Log tasks that block the main thread for more than 50ms
        if (entry.duration > 50) {
          console.warn('Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
          })
        }
      }
    })
    
    observer.observe({ entryTypes: ['longtask'] })
    
    return () => {
      observer.disconnect()
    }
  }, [])
}