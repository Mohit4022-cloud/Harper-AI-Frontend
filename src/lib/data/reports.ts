// Reports data fetching functions
export type ReportMetrics = {
  totalCalls: number
  totalEmails: number
  meetingsBooked: number
  dealsWon: number
  revenue: number
  conversionRate: number
  avgResponseTime: number
  followUpRate: number
}

export type PerformanceData = {
  score: number
  trend: 'up' | 'down' | 'stable'
  category: 'excellent' | 'good' | 'needs-improvement'
}

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function fetchReportMetrics(period: string = 'week'): Promise<ReportMetrics> {
  // Simulate API call with delay
  await delay(800)
  
  // In a real app, this would fetch from your API based on the period
  return {
    totalCalls: 245,
    totalEmails: 1234,
    meetingsBooked: 45,
    dealsWon: 12,
    revenue: 125000,
    conversionRate: 24.5,
    avgResponseTime: 2.5,
    followUpRate: 87,
  }
}

export async function fetchPerformanceData(period: string = 'week'): Promise<PerformanceData> {
  // Simulate API call with delay
  await delay(600)
  
  return {
    score: 85,
    trend: 'up',
    category: 'good',
  }
}