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
      import('@/lib/performance-advanced').then(({ MemoryLeakDetector }) => {
        const detector = new MemoryLeakDetector()
        detector.start()
        
        // Store detector for cleanup
        (window as any).__memoryDetector = detector
      })
      
      return () => {
        const detector = (window as any).__memoryDetector
        if (detector) {
          detector.stop()
          delete (window as any).__memoryDetector
        }
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