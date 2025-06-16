import { useCallback } from 'react'

export function usePerformanceInit() {
  const init = useCallback(() => {
    if (typeof window === 'undefined') return

    // Initialize performance monitoring
    if ('performance' in window && 'PerformanceObserver' in window) {
      try {
        // Observe long tasks
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log('Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
            })
          }
        })
        
        observer.observe({ entryTypes: ['longtask'] })
      } catch (error) {
        console.warn('Failed to initialize performance observer:', error)
      }
    }
  }, [])

  return { init }
}