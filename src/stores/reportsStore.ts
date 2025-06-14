import { create } from 'zustand'
import { ReportData, ReportPeriod, ReportMetrics, AIInsight, PerformanceScore } from '@/types/reports'
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns'

interface ReportsState {
  currentReport: ReportData | null
  performanceScore: PerformanceScore | null
  selectedPeriod: ReportPeriod
  customDateRange: { start: Date; end: Date } | null
  loading: boolean
  error: string | null
  
  // Actions
  fetchReport: (period?: ReportPeriod, customRange?: { start: Date; end: Date }) => Promise<void>
  setSelectedPeriod: (period: ReportPeriod) => void
  setCustomDateRange: (range: { start: Date; end: Date }) => void
  calculatePerformanceScore: (metrics: ReportMetrics) => PerformanceScore
  refreshReport: () => Promise<void>
}

/**
 * Reports store for analytics and insights
 */
export const useReportsStore = create<ReportsState>((set, get) => ({
  currentReport: null,
  performanceScore: null,
  selectedPeriod: 'week',
  customDateRange: null,
  loading: false,
  error: null,

  /**
   * Fetch report data from API
   */
  fetchReport: async (period, customRange) => {
    set({ loading: true, error: null })
    
    try {
      const selectedPeriod = period || get().selectedPeriod
      const { start, end } = customRange || get().customDateRange || getDateRange(selectedPeriod)
      
      const params = new URLSearchParams({
        period: selectedPeriod,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      })
      
      const response = await fetch(`/api/reports?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch report')
      }
      
      const data = await response.json()
      
      if (data.success) {
        const report = data.data as ReportData
        const performanceScore = get().calculatePerformanceScore(report.metrics)
        
        set({ 
          currentReport: report,
          performanceScore,
          loading: false,
          selectedPeriod,
        })
      } else {
        throw new Error(data.error || 'Failed to fetch report')
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch report',
        loading: false 
      })
    }
  },

  /**
   * Set selected period
   */
  setSelectedPeriod: (period) => {
    set({ selectedPeriod: period })
    if (period !== 'custom') {
      set({ customDateRange: null })
    }
  },

  /**
   * Set custom date range
   */
  setCustomDateRange: (range) => {
    set({ 
      customDateRange: range,
      selectedPeriod: 'custom',
    })
  },

  /**
   * Calculate performance score based on metrics
   */
  calculatePerformanceScore: (metrics) => {
    // Activity Score (based on calls, emails, tasks)
    const activityScore = Math.min(100, Math.round(
      ((metrics.totalCalls / 50) * 30) +
      ((metrics.emailsSent / 100) * 30) +
      ((metrics.tasksCompleted / 20) * 40)
    ))

    // Engagement Score (based on connect rate, open rate, reply rate)
    const engagementScore = Math.round(
      (metrics.connectRate * 0.4) +
      (metrics.emailOpenRate * 0.3) +
      (metrics.emailReplyRate * 0.3)
    )

    // Conversion Score (based on meetings, win rate)
    const conversionScore = Math.round(
      (metrics.meetingConversionRate * 0.5) +
      (metrics.winRate * 0.5)
    )

    // Efficiency Score (based on response time, follow-up rate)
    const efficiencyScore = Math.round(
      (Math.max(0, 100 - metrics.avgResponseTime * 2) * 0.5) +
      (metrics.followUpRate * 0.5)
    )

    // Overall Score (weighted average)
    const overall = Math.round(
      (activityScore * 0.25) +
      (engagementScore * 0.25) +
      (conversionScore * 0.3) +
      (efficiencyScore * 0.2)
    )

    // Determine trend (mock for now)
    const trend = overall >= 70 ? 'up' : overall >= 50 ? 'stable' : 'down'
    const changePercent = Math.random() * 20 - 10 // Mock change

    return {
      overall,
      categories: {
        activity: activityScore,
        engagement: engagementScore,
        conversion: conversionScore,
        efficiency: efficiencyScore,
      },
      trend,
      changePercent,
    }
  },

  /**
   * Refresh current report
   */
  refreshReport: async () => {
    const { selectedPeriod, customDateRange } = get()
    await get().fetchReport(selectedPeriod, customDateRange || undefined)
  },
}))

/**
 * Get date range for a given period
 */
function getDateRange(period: ReportPeriod): { start: Date; end: Date } {
  const now = new Date()
  
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) }
    case 'week':
      return { start: startOfWeek(now), end: endOfWeek(now) }
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'quarter':
      return { start: startOfQuarter(now), end: endOfQuarter(now) }
    case 'year':
      return { start: startOfYear(now), end: endOfYear(now) }
    case 'custom':
      // Default to last 30 days if custom not set
      return { start: subDays(now, 30), end: now }
    default:
      return { start: startOfWeek(now), end: endOfWeek(now) }
  }
}