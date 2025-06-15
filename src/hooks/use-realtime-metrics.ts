import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/store'
import { wsManager } from '@/lib/websocket'
import { EventMap } from '@/types/brand'

interface Metrics {
  activeCalls: number
  contactsReached: number
  averageCallDuration: number
  conversionRate: number
  sentimentAverage: number
  activeUsers: number
  callsToday: number
  callsThisHour: number
  successfulCalls: number
  failedCalls: number
}

export function useRealtimeMetrics() {
  const metrics = useAppStore(state => state.metrics)
  const [previousMetrics, setPreviousMetrics] = useState<Metrics>(metrics)
  
  // Fetch initial metrics
  const { isLoading, error } = useQuery({
    queryKey: ['metrics', 'realtime'],
    queryFn: async () => {
      const response = await fetch('/api/metrics/realtime')
      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }
      return response.json()
    },
    onSuccess: (data: Metrics) => {
      useAppStore.getState().setMetrics(data)
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  })
  
  // Listen for real-time updates
  useEffect(() => {
    const handleMetricsUpdate = (data: EventMap['metrics:updated']) => {
      setPreviousMetrics(metrics)
      useAppStore.getState().setMetrics(data.metrics)
    }
    
    // Subscribe to metrics updates
    if (wsManager.socket) {
      wsManager.socket.on('metrics:updated', handleMetricsUpdate)
    }
    
    return () => {
      if (wsManager.socket) {
        wsManager.socket.off('metrics:updated', handleMetricsUpdate)
      }
    }
  }, [metrics])
  
  // Store previous metrics for comparison
  useEffect(() => {
    const timer = setInterval(() => {
      setPreviousMetrics(metrics)
    }, 60000) // Update previous metrics every minute
    
    return () => clearInterval(timer)
  }, [metrics])
  
  return {
    metrics,
    previousMetrics,
    isLoading,
    error,
  }
}

// Hook for specific metric subscriptions
export function useMetric(metricName: keyof Metrics) {
  const metric = useAppStore(state => state.metrics[metricName])
  const [history, setHistory] = useState<Array<{ value: number; timestamp: Date }>>([])
  
  useEffect(() => {
    // Add current value to history
    setHistory(prev => [
      ...prev.slice(-29), // Keep last 30 values
      { value: metric, timestamp: new Date() }
    ])
  }, [metric])
  
  return {
    current: metric,
    history,
    trend: calculateTrend(history),
  }
}

// Calculate trend from history
function calculateTrend(history: Array<{ value: number; timestamp: Date }>): 'up' | 'down' | 'stable' {
  if (history.length < 2) return 'stable'
  
  const recent = history.slice(-5)
  const older = history.slice(-10, -5)
  
  if (recent.length === 0 || older.length === 0) return 'stable'
  
  const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length
  const olderAvg = older.reduce((sum, item) => sum + item.value, 0) / older.length
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100
  
  if (Math.abs(change) < 5) return 'stable'
  return change > 0 ? 'up' : 'down'
}

// Hook for metric alerts
export function useMetricAlerts() {
  const metrics = useAppStore(state => state.metrics)
  const addNotification = useAppStore(state => state.addNotification)
  const [alertThresholds] = useState({
    activeCalls: { max: 100, min: 0 },
    conversionRate: { max: 1, min: 0.1 },
    sentimentAverage: { max: 1, min: 0.3 },
    averageCallDuration: { max: 1800, min: 30 }, // 30 seconds to 30 minutes
  })
  
  useEffect(() => {
    // Check for threshold violations
    Object.entries(alertThresholds).forEach(([metric, thresholds]) => {
      const value = metrics[metric as keyof Metrics]
      
      if (typeof value === 'number') {
        if (value > thresholds.max) {
          addNotification({
            type: 'error',
            title: `High ${metric}`,
            message: `${metric} is above threshold: ${value}`,
          })
        } else if (value < thresholds.min) {
          addNotification({
            type: 'error',
            title: `Low ${metric}`,
            message: `${metric} is below threshold: ${value}`,
          })
        }
      }
    })
  }, [metrics, alertThresholds, addNotification])
}