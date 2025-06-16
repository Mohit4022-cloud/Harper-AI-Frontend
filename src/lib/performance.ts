// Performance monitoring utilities
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'

type MetricType = 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB' | 'INP'

interface PerformanceMetric {
  name: MetricType
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender' | 'restore'
}

// Send metrics to analytics endpoint
function sendToAnalytics(metric: PerformanceMetric) {
  const body = JSON.stringify({
    metricName: metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  })

  // Use sendBeacon if available, fallback to fetch
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/performance', body)
  } else {
    fetch('/api/analytics/performance', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(console.error)
  }

  // Also send to Sentry if available
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: `${metric.name}: ${metric.value}`,
      level: metric.rating === 'poor' ? 'warning' : 'info',
      data: metric,
    })
  }
}

// Initialize Web Vitals monitoring
export function initWebVitals() {
  if (typeof window === 'undefined') return

  onCLS((metric) => sendToAnalytics(metric as any))
  onFCP((metric) => sendToAnalytics(metric as any))
  onLCP((metric) => sendToAnalytics(metric as any))
  onTTFB((metric) => sendToAnalytics(metric as any))
  onINP((metric) => sendToAnalytics(metric as any))
}

// Custom performance marks
export function markPerformance(name: string) {
  if (typeof window === 'undefined' || !window.performance) return
  
  performance.mark(name)
}

// Measure between two marks
export function measurePerformance(name: string, startMark: string, endMark?: string) {
  if (typeof window === 'undefined' || !window.performance) return
  
  try {
    if (endMark) {
      performance.measure(name, startMark, endMark)
    } else {
      performance.measure(name, startMark)
    }
    
    const measure = performance.getEntriesByName(name, 'measure')[0]
    if (measure) {
      console.log(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`)
      
      // Send custom metrics
      sendToAnalytics({
        name: 'Custom' as any,
        value: measure.duration,
        rating: measure.duration < 100 ? 'good' : measure.duration < 300 ? 'needs-improvement' : 'poor',
        delta: 0,
        id: `custom-${Date.now()}`,
        navigationType: 'navigate',
      })
    }
  } catch (error) {
    console.error('Performance measurement error:', error)
  }
}

// Get all performance entries
export function getPerformanceReport() {
  if (typeof window === 'undefined' || !window.performance) return null
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  const paint = performance.getEntriesByType('paint')
  const resources = performance.getEntriesByType('resource')
  
  return {
    navigation: {
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
      loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
      domInteractive: navigation?.domInteractive,
      dnsLookup: navigation?.domainLookupEnd - navigation?.domainLookupStart,
      tcpConnect: navigation?.connectEnd - navigation?.connectStart,
      request: navigation?.responseStart - navigation?.requestStart,
      response: navigation?.responseEnd - navigation?.responseStart,
      domParsing: navigation?.domInteractive - navigation?.responseEnd,
      domComplete: navigation?.domComplete,
      duration: navigation?.duration,
    },
    paint: paint.reduce((acc, entry) => {
      acc[entry.name] = entry.startTime
      return acc
    }, {} as Record<string, number>),
    resources: {
      count: resources.length,
      totalSize: resources.reduce((sum, r: any) => sum + (r.transferSize || 0), 0),
      totalDuration: resources.reduce((sum, r) => sum + r.duration, 0),
      byType: resources.reduce((acc, r: any) => {
        const type = r.initiatorType || 'other'
        if (!acc[type]) acc[type] = { count: 0, size: 0, duration: 0 }
        acc[type].count++
        acc[type].size += r.transferSize || 0
        acc[type].duration += r.duration
        return acc
      }, {} as Record<string, { count: number; size: number; duration: number }>),
    },
  }
}