import { StateCreator } from 'zustand'
import { RealtimeMetrics } from '@/types/brand'

export interface MetricsSlice {
  // State
  metrics: RealtimeMetrics
  historicalMetrics: Array<RealtimeMetrics & { timestamp: Date }>
  isLoadingMetrics: boolean
  metricsError: string | null
  
  // Time range
  metricsTimeRange: '1h' | '24h' | '7d' | '30d'
  
  // Actions
  setMetrics: (metrics: RealtimeMetrics) => void
  updateMetric: <K extends keyof RealtimeMetrics>(key: K, value: RealtimeMetrics[K]) => void
  addHistoricalMetric: (metric: RealtimeMetrics) => void
  setMetricsTimeRange: (range: MetricsSlice['metricsTimeRange']) => void
  setLoadingMetrics: (loading: boolean) => void
  setMetricsError: (error: string | null) => void
  
  // Computed
  getMetricTrend: (metric: keyof RealtimeMetrics) => 'up' | 'down' | 'stable'
  getAverageMetric: (metric: keyof RealtimeMetrics) => number
}

export const createMetricsSlice: StateCreator<MetricsSlice, [], [], MetricsSlice> = (set, get) => ({
  // Initial state
  metrics: {
    activeCalls: 0,
    contactsReached: 0,
    totalCalls: 0,
    averageCallDuration: 0,
    sentimentAverage: 0,
    conversionRate: 0,
    activeUsers: 0,
    timestamp: new Date(),
  },
  historicalMetrics: [],
  isLoadingMetrics: false,
  metricsError: null,
  metricsTimeRange: '24h',
  
  // Actions
  setMetrics: (metrics) => set((state) => {
    state.metrics = metrics
    // Add to historical data
    state.historicalMetrics.push({ ...metrics, timestamp: new Date() })
    
    // Keep only data within the selected time range
    const cutoffTime = new Date()
    switch (state.metricsTimeRange) {
      case '1h':
        cutoffTime.setHours(cutoffTime.getHours() - 1)
        break
      case '24h':
        cutoffTime.setHours(cutoffTime.getHours() - 24)
        break
      case '7d':
        cutoffTime.setDate(cutoffTime.getDate() - 7)
        break
      case '30d':
        cutoffTime.setDate(cutoffTime.getDate() - 30)
        break
    }
    
    state.historicalMetrics = state.historicalMetrics.filter(
      m => m.timestamp >= cutoffTime
    )
  }),
  
  updateMetric: (key, value) => set((state) => {
    state.metrics[key] = value
  }),
  
  addHistoricalMetric: (metric) => set((state) => {
    state.historicalMetrics.push({ ...metric, timestamp: new Date() })
  }),
  
  setMetricsTimeRange: (range) => set((state) => {
    state.metricsTimeRange = range
  }),
  
  setLoadingMetrics: (loading) => set((state) => {
    state.isLoadingMetrics = loading
  }),
  
  setMetricsError: (error) => set((state) => {
    state.metricsError = error
    state.isLoadingMetrics = false
  }),
  
  // Computed
  getMetricTrend: (metric) => {
    const { historicalMetrics } = get()
    if (historicalMetrics.length < 2) return 'stable'
    
    const recent = historicalMetrics.slice(-10)
    if (recent.length < 2) return 'stable'
    
    const values = recent.map(m => m[metric] as number)
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    
    const difference = secondAvg - firstAvg
    const threshold = firstAvg * 0.05 // 5% threshold for change
    
    if (Math.abs(difference) < threshold) return 'stable'
    return difference > 0 ? 'up' : 'down'
  },
  
  getAverageMetric: (metric) => {
    const { historicalMetrics } = get()
    if (historicalMetrics.length === 0) return 0
    
    const values = historicalMetrics.map(m => m[metric] as number)
    return values.reduce((a, b) => a + b, 0) / values.length
  },
})