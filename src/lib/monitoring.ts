import { captureException as sentryCapture, captureMessage as sentryMessage } from '@sentry/nextjs'
import type { SeverityLevel } from '@sentry/types'

// Performance monitoring
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  
  mark(name: string) {
    this.marks.set(name, performance.now())
  }
  
  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark)
    if (!start) return
    
    const end = endMark ? this.marks.get(endMark) : performance.now()
    if (!end) return
    
    const duration = end - start
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`)
    }
    
    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'timing_complete', {
        name,
        value: Math.round(duration),
        event_category: 'Performance',
      })
    }
    
    // Send to Sentry for slow operations
    if (duration > 1000) {
      sentryMessage(`Slow operation: ${name} took ${duration.toFixed(0)}ms`, 'warning')
    }
    
    return duration
  }
  
  clear() {
    this.marks.clear()
  }
}

// Error boundary logging
export function logError(error: Error, errorInfo?: { componentStack?: string }) {
  console.error('Error caught:', error)
  
  // Capture in Sentry
  sentryCapture(error, {
    contexts: {
      react: {
        componentStack: errorInfo?.componentStack,
      },
    },
  })
  
  // Log to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'exception', {
      description: error.message,
      fatal: false,
    })
  }
}

// Custom logging with Sentry integration
export const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(message, data)
    }
  },
  
  info: (message: string, data?: any) => {
    console.info(message, data)
    if (process.env.NODE_ENV === 'production') {
      sentryMessage(message, 'info')
    }
  },
  
  warn: (message: string, data?: any) => {
    console.warn(message, data)
    sentryMessage(message, 'warning')
  },
  
  error: (message: string, error?: Error | any, data?: any) => {
    console.error(message, error, data)
    if (error instanceof Error) {
      sentryCapture(error, {
        extra: { message, ...data },
      })
    } else {
      sentryMessage(message, 'error')
    }
  },
}

// Feature usage tracking
export function trackFeatureUsage(feature: string, properties?: Record<string, any>) {
  // Log to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'feature_usage', {
      feature_name: feature,
      ...properties,
    })
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Feature used: ${feature}`, properties)
  }
}

// API call monitoring
export async function monitorApiCall<T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  
  try {
    const result = await apiCall()
    const duration = performance.now() - startTime
    
    // Log successful calls
    logger.debug(`API call ${name} completed in ${duration.toFixed(0)}ms`)
    
    // Track slow API calls
    if (duration > 2000) {
      logger.warn(`Slow API call: ${name} took ${duration.toFixed(0)}ms`)
    }
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    
    // Log failed calls
    logger.error(`API call ${name} failed after ${duration.toFixed(0)}ms`, error)
    
    throw error
  }
}

// WebSocket monitoring
export function monitorWebSocket(ws: WebSocket | any) {
  const events = ['connect', 'disconnect', 'error', 'reconnect', 'reconnect_failed']
  
  events.forEach(event => {
    ws.on(event, (data?: any) => {
      logger.info(`WebSocket ${event}`, data)
      
      if (event === 'error' || event === 'reconnect_failed') {
        trackFeatureUsage('websocket_error', { event, error: data })
      }
    })
  })
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return
  }
  
  const checkMemory = () => {
    const memory = (performance as any).memory
    const usedJSHeapSize = memory.usedJSHeapSize / 1048576 // Convert to MB
    const totalJSHeapSize = memory.totalJSHeapSize / 1048576
    const limit = memory.jsHeapSizeLimit / 1048576
    
    const usage = (usedJSHeapSize / limit) * 100
    
    if (usage > 90) {
      logger.warn('High memory usage detected', {
        used: `${usedJSHeapSize.toFixed(2)} MB`,
        total: `${totalJSHeapSize.toFixed(2)} MB`,
        limit: `${limit.toFixed(2)} MB`,
        usage: `${usage.toFixed(2)}%`,
      })
    }
  }
  
  // Check every 30 seconds
  setInterval(checkMemory, 30000)
}