import { useCallback, useEffect, useRef, useState } from 'react'
import React from 'react'
import { logger } from './monitoring'

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

// Throttle hook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now())
  
  return useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = Date.now()
      }
    },
    [callback, delay]
  ) as T
}

// Intersection observer hook for lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  
  useEffect(() => {
    if (!ref.current) return
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
      if (entry.isIntersecting) {
        setHasIntersected(true)
      }
    }, options)
    
    observer.observe(ref.current)
    
    return () => {
      observer.disconnect()
    }
  }, [ref, options])
  
  return { isIntersecting, hasIntersected }
}

// Memory-efficient data virtualization
export class DataVirtualizer<T> {
  private cache = new Map<number, T[]>()
  private pageSize: number
  private fetchFn: (page: number) => Promise<T[]>
  
  constructor(pageSize: number, fetchFn: (page: number) => Promise<T[]>) {
    this.pageSize = pageSize
    this.fetchFn = fetchFn
  }
  
  async getPage(pageIndex: number): Promise<T[]> {
    if (this.cache.has(pageIndex)) {
      return this.cache.get(pageIndex)!
    }
    
    const data = await this.fetchFn(pageIndex)
    this.cache.set(pageIndex, data)
    
    // Limit cache size to prevent memory issues
    if (this.cache.size > 10) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    return data
  }
  
  clearCache() {
    this.cache.clear()
  }
  
  getCachedData(): T[] {
    const allData: T[] = []
    const sortedKeys = Array.from(this.cache.keys()).sort((a, b) => a - b)
    
    sortedKeys.forEach(key => {
      allData.push(...this.cache.get(key)!)
    })
    
    return allData
  }
}

// Web Worker for heavy computations
export class ComputeWorker {
  private worker: Worker | null = null
  
  constructor(workerScript: string) {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(workerScript)
    }
  }
  
  async compute<T>(data: any): Promise<T> {
    if (!this.worker) {
      throw new Error('Web Workers not supported')
    }
    
    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        this.worker!.removeEventListener('message', handler)
        if (event.data.error) {
          reject(new Error(event.data.error))
        } else {
          resolve(event.data.result)
        }
      }
      
      this.worker.addEventListener('message', handler)
      this.worker.postMessage(data)
    })
  }
  
  terminate() {
    this.worker?.terminate()
  }
}

// Request batching for API calls
export class RequestBatcher<T, R> {
  private batch: T[] = []
  private timeout: NodeJS.Timeout | null = null
  private batchSize: number
  private delay: number
  private processFn: (batch: T[]) => Promise<R[]>
  private resolvers: Array<{
    resolve: (value: R) => void
    reject: (error: any) => void
  }> = []
  
  constructor(
    batchSize: number,
    delay: number,
    processFn: (batch: T[]) => Promise<R[]>
  ) {
    this.batchSize = batchSize
    this.delay = delay
    this.processFn = processFn
  }
  
  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push(item)
      this.resolvers.push({ resolve, reject })
      
      if (this.batch.length >= this.batchSize) {
        this.flush()
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.delay)
      }
    })
  }
  
  private async flush() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
    
    if (this.batch.length === 0) return
    
    const currentBatch = [...this.batch]
    const currentResolvers = [...this.resolvers]
    
    this.batch = []
    this.resolvers = []
    
    try {
      const results = await this.processFn(currentBatch)
      
      results.forEach((result, index) => {
        currentResolvers[index].resolve(result)
      })
    } catch (error) {
      currentResolvers.forEach(resolver => {
        resolver.reject(error)
      })
    }
  }
}

// Performance monitoring utilities
export function measurePerformance(name: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const start = performance.now()
      
      try {
        const result = await originalMethod.apply(this, args)
        const duration = performance.now() - start
        
        logger.debug(`${name} completed in ${duration.toFixed(2)}ms`)
        
        // Track slow operations
        if (duration > 1000) {
          logger.warn(`Slow operation: ${name} took ${duration.toFixed(0)}ms`)
        }
        
        return result
      } catch (error) {
        const duration = performance.now() - start
        logger.error(`${name} failed after ${duration.toFixed(0)}ms`, error)
        throw error
      }
    }
    
    return descriptor
  }
}

// Memory leak detection
export class MemoryLeakDetector {
  private snapshots: Array<{ timestamp: number; heapSize: number }> = []
  private interval: NodeJS.Timer | null = null
  
  start(intervalMs: number = 30000) {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return
    }
    
    this.interval = setInterval(() => {
      const memory = (performance as any).memory
      const heapSize = memory.usedJSHeapSize / 1048576 // Convert to MB
      
      this.snapshots.push({
        timestamp: Date.now(),
        heapSize,
      })
      
      // Keep only last 10 snapshots
      if (this.snapshots.length > 10) {
        this.snapshots.shift()
      }
      
      // Check for potential memory leak
      if (this.snapshots.length >= 5) {
        const trend = this.calculateTrend()
        
        if (trend > 0.1) { // 10% growth per interval
          logger.warn('Potential memory leak detected', {
            trend: `${(trend * 100).toFixed(2)}% growth per interval`,
            currentHeap: `${heapSize.toFixed(2)} MB`,
          })
        }
      }
    }, intervalMs)
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
  
  private calculateTrend(): number {
    if (this.snapshots.length < 2) return 0
    
    const first = this.snapshots[0].heapSize
    const last = this.snapshots[this.snapshots.length - 1].heapSize
    
    return (last - first) / first
  }
}

// React component performance optimization
export function withPerformance<P extends object>(
  Component: React.ComponentType<P>,
  name: string
) {
  return React.memo(
    React.forwardRef<any, P>((props, ref) => {
      const renderStart = useRef(performance.now())
      
      useEffect(() => {
        const renderTime = performance.now() - renderStart.current
        
        if (renderTime > 16) { // More than one frame (60fps)
          logger.debug(`Slow render: ${name} took ${renderTime.toFixed(2)}ms`)
        }
      })
      
      return <Component {...props} ref={ref} />
    }),
    (prevProps, nextProps) => {
      // Custom comparison logic for better memoization
      return JSON.stringify(prevProps) === JSON.stringify(nextProps)
    }
  )
}