'use client'

import { useEffect, useState } from 'react'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'poor'
}

export function PerformanceWidget() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Collect Web Vitals
    const collectMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      const metricsData: PerformanceMetric[] = [
        {
          name: 'Page Load',
          value: Math.round(navigation.loadEventEnd - navigation.fetchStart),
          unit: 'ms',
          status: navigation.loadEventEnd - navigation.fetchStart < 3000 ? 'good' : 'warning'
        },
        {
          name: 'DOM Content Loaded',
          value: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
          unit: 'ms',
          status: navigation.domContentLoadedEventEnd - navigation.fetchStart < 1500 ? 'good' : 'warning'
        },
      ]
      
      setMetrics(metricsData)
    }

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      collectMetrics()
    } else {
      window.addEventListener('load', collectMetrics)
      return () => window.removeEventListener('load', collectMetrics)
    }
  }, [])

  if (!isVisible && metrics.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="rounded-full bg-primary p-3 text-primary-foreground shadow-lg hover:bg-primary/90"
        aria-label="Toggle performance metrics"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>
      
      {isVisible && (
        <div className="absolute bottom-16 right-0 w-80 rounded-lg border bg-card p-4 shadow-xl">
          <h3 className="mb-3 text-sm font-semibold">Performance Metrics</h3>
          <div className="space-y-2">
            {metrics.map((metric) => (
              <div key={metric.name} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{metric.name}</span>
                <span className={`text-sm font-medium ${
                  metric.status === 'good' ? 'text-green-600' :
                  metric.status === 'warning' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {metric.value}{metric.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}