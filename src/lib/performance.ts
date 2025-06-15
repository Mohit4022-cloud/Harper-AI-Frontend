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
  
  constructor() {
    this.initWebVitals()
    this.initCustomMetrics()
  }
  
  private initWebVitals() {
    const sendMetric = (metric: Metric) => {
      this.metrics.set(metric.name, metric)
      this.sendToAnalytics(metric)
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
          this.sendToAnalytics({
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
          this.sendToAnalytics({
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
        
        this.sendToAnalytics({
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
      
      this.sendToAnalytics({
        name: 'memory-usage',
        value: memInfo.usedJSHeapSize / 1024 / 1024, // MB
        id: 'heap-size',
        rating: memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit < 0.8 ? 'good' : 'poor'
      })
    }, 30000) // Every 30 seconds
  }
  
  private sendToAnalytics(metric: Metric) {
    if (!this.isEnabled) return
    
    // Send to your analytics service
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...metric,
        timestamp: Date.now(),
        url: window.location.pathname,
        userAgent: navigator.userAgent,
      }),
    }).catch(console.error)
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${metric.name}:`, metric.value, metric.rating)
    }
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
      this.sendToAnalytics({
        name: 'api-duration',
        value: measure.duration,
        id: name,
        rating: measure.duration < 1000 ? 'good' : measure.duration < 3000 ? 'needs-improvement' : 'poor'
      })
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
  }
  
  enable() {
    this.isEnabled = true
  }
}

export const performanceMonitor = new PerformanceMonitor()

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics())
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  return {
    metrics,
    measureApiCall: performanceMonitor.measureApiCall.bind(performanceMonitor),
    measureComponentRender: performanceMonitor.measureComponentRender.bind(performanceMonitor),
  }
}

// Higher-order component for measuring component performance
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    useEffect(() => {
      performanceMonitor.measureComponentRender(componentName, () => {
        // Component rendered
      })
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
      
      performanceMonitor.sendToAnalytics({
        name: 'page-load',
        value: navigation.loadEventEnd - navigation.fetchStart,
        id: window.location.pathname,
      })
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