import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'
import { useEffect, useState } from 'react'
import React from 'react'

interface Metric {
  name: string
  value: number
  id: string
  delta?: number
  rating?: 'good' | 'needs-improvement' | 'poor'
}

class PerformanceMonitor {
  private metrics: Map<string, Metric> = new Map()
  private isEnabled: boolean = true
  private lastSentTimestamp: number = 0
  private sendQueue: Metric[] = []
  private sendInterval: number = 5000 // Send metrics every 5 seconds max
  private maxQueueSize: number = 50
  private batchTimer: NodeJS.Timeout | null = null
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.initWebVitals()
      this.initCustomMetrics()
      this.initBatchSending()
    }
  }
  
  private initBatchSending() {
    // Send queued metrics periodically
    this.batchTimer = setInterval(() => {
      this.flushQueue()
    }, this.sendInterval)
    
    // Send on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushQueue(true)
      })
    }
  }
  
  private initWebVitals() {
    const sendMetric = (metric: Metric) => {
      this.metrics.set(metric.name, metric)
      this.queueMetric(metric)
    }
    
    onCLS(sendMetric)
    onFID(sendMetric)
    onFCP(sendMetric)
    onLCP(sendMetric)
    onTTFB(sendMetric)
    onINP(sendMetric)
  }
  
  private initCustomMetrics() {
    // Monitor React component render times
    this.measureReactPerformance()
    
    // Monitor API call performance
    this.measureAPIPerformance()
    
    // Monitor virtual scrolling performance
    this.measureVirtualScrolling()
    
    // Monitor memory usage
    this.measureMemoryUsage()
  }
  
  private measureReactPerformance() {
    if (typeof window === 'undefined') return
    
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('⚛️')) {
          this.queueMetric({
            name: 'react-render',
            value: entry.duration,
            id: entry.name,
          })
        }
      })
    })
    
    observer.observe({ entryTypes: ['measure'] })
  }
  
  private measureAPIPerformance() {
    if (typeof window === 'undefined') return
    
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('/api/')) {
          this.queueMetric({
            name: 'api-call',
            value: entry.duration,
            id: entry.name,
          })
        }
      })
    })
    
    observer.observe({ entryTypes: ['navigation', 'resource'] })
  }
  
  private measureVirtualScrolling() {
    // Custom measurement for virtual table performance
    let frameCount = 0
    let lastTime = performance.now()
    
    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        
        this.queueMetric({
          name: 'virtual-scroll-fps',
          value: fps,
          id: 'virtual-table',
          rating: fps >= 55 ? 'good' : fps >= 45 ? 'needs-improvement' : 'poor'
        })
        
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    requestAnimationFrame(measureFPS)
  }
  
  private measureMemoryUsage() {
    if (!('memory' in performance)) return
    
    setInterval(() => {
      const memInfo = (performance as any).memory
      
      this.queueMetric({
        name: 'memory-usage',
        value: memInfo.usedJSHeapSize / 1024 / 1024, // MB
        id: 'heap-size',
        rating: memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit < 0.8 ? 'good' : 'poor'
      })
    }, 30000) // Every 30 seconds
  }
  
  private queueMetric(metric: Metric) {
    if (!this.isEnabled) return
    
    this.sendQueue.push(metric)
    
    // Flush if queue is getting too large
    if (this.sendQueue.length >= this.maxQueueSize) {
      this.flushQueue()
    }
  }
  
  private flushQueue(immediate: boolean = false) {
    if (this.sendQueue.length === 0) return
    
    // Rate limiting: Don't send more than once per second unless immediate
    const now = Date.now()
    if (!immediate && now - this.lastSentTimestamp < 1000) {
      return
    }
    
    // Take current queue and clear it
    const metricsToSend = [...this.sendQueue]
    this.sendQueue = []
    this.lastSentTimestamp = now
    
    // Send batch
    this.sendBatch(metricsToSend)
  }
  
  private sendBatch(metrics: Metric[]) {
    if (typeof window === 'undefined') return
    
    const payload = metrics.map(metric => ({
      ...metric,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent,
    }))
    
    // Use sendBeacon for reliability on page unload
    const useBeacon = 'sendBeacon' in navigator && document.visibilityState === 'hidden'
    
    if (useBeacon) {
      navigator.sendBeacon(
        '/api/analytics/performance/batch',
        JSON.stringify(payload)
      )
    } else {
      fetch('/api/analytics/performance/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(error => {
        console.error('Failed to send metrics batch:', error)
        // Re-queue failed metrics if not too old
        const recentMetrics = metrics.filter(m => 
          Date.now() - (m as any).timestamp < 60000 // Less than 1 minute old
        )
        if (recentMetrics.length > 0) {
          this.sendQueue.unshift(...recentMetrics)
        }
      })
    }
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Sent ${metrics.length} metrics`)
    }
  }
  
  public sendToAnalytics(metric: Metric) {
    this.queueMetric(metric)
  }
  
  // Public methods
  measureApiCall<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startMark = `${name}-start`
    const endMark = `${name}-end`
    const measureName = `api-${name}`
    
    performance.mark(startMark)
    
    return fn().finally(() => {
      performance.mark(endMark)
      performance.measure(measureName, startMark, endMark)
      
      const measure = performance.getEntriesByName(measureName)[0]
      if (measure && 'duration' in measure) {
        this.queueMetric({
          name: 'api-duration',
          value: measure.duration,
          id: name,
          rating: measure.duration < 1000 ? 'good' : measure.duration < 3000 ? 'needs-improvement' : 'poor'
        })
      }
    })
  }
  
  measureComponentRender(componentName: string, renderFn: () => void) {
    const startMark = `${componentName}-render-start`
    const endMark = `${componentName}-render-end`
    const measureName = `⚛️ ${componentName}-render`
    
    performance.mark(startMark)
    renderFn()
    performance.mark(endMark)
    performance.measure(measureName, startMark, endMark)
  }
  
  getMetrics() {
    return Array.from(this.metrics.values())
  }
  
  disable() {
    this.isEnabled = false
    // Clear batch timer
    if (this.batchTimer) {
      clearInterval(this.batchTimer)
      this.batchTimer = null
    }
    // Flush any remaining metrics
    this.flushQueue(true)
  }
  
  enable() {
    this.isEnabled = true
    if (!this.batchTimer) {
      this.initBatchSending()
    }
  }
  
  cleanup() {
    this.disable()
    this.metrics.clear()
    this.sendQueue = []
  }
}

// Create singleton instance only on client side
export const performanceMonitor = typeof window !== 'undefined' ? new PerformanceMonitor() : null as any

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  
  useEffect(() => {
    if (!performanceMonitor) return
    
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics())
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  return {
    metrics,
    measureApiCall: performanceMonitor ? performanceMonitor.measureApiCall.bind(performanceMonitor) : () => Promise.resolve(),
    measureComponentRender: performanceMonitor ? performanceMonitor.measureComponentRender.bind(performanceMonitor) : () => {},
  }
}

// Higher-order component for measuring component performance
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    useEffect(() => {
      if (performanceMonitor) {
        performanceMonitor.measureComponentRender(componentName, () => {
          // Component rendered
        })
      }
    })
    
    return React.createElement(WrappedComponent, props)
  }
}

// Initialize performance monitoring
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return
  
  // Monitor page load performance
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (performanceMonitor) {
        performanceMonitor.queueMetric({
          name: 'page-load',
          value: navigation.loadEventEnd - navigation.fetchStart,
          id: window.location.pathname,
        })
      }
    }, 0)
  })
  
  // Monitor route changes in Next.js
  if (typeof window !== 'undefined' && 'next' in window) {
    const router = (window as any).next.router
    if (router) {
      router.events.on('routeChangeStart', (url: string) => {
        performance.mark(`route-change-${url}-start`)
      })
      
      router.events.on('routeChangeComplete', (url: string) => {
        performance.mark(`route-change-${url}-end`)
        performance.measure(`route-change-${url}`, `route-change-${url}-start`, `route-change-${url}-end`)
      })
    }
  }
}

// Window type augmentation
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}