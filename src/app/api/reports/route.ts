import { NextRequest, NextResponse } from 'next/server'
import { ReportData, ReportMetrics, AIInsight, ChartDataPoint } from '@/types/reports'
import { faker } from '@faker-js/faker'
import { addDays, format, parseISO, differenceInDays } from 'date-fns'

/**
 * GET /api/reports
 * Generate analytics report for the specified period
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'
    const startDate = searchParams.get('startDate') || new Date().toISOString()
    const endDate = searchParams.get('endDate') || new Date().toISOString()
    
    // Generate mock metrics
    const metrics = generateMockMetrics()
    
    // Generate AI insights based on metrics
    const insights = generateAIInsights(metrics)
    
    // Generate chart data for the date range
    const chartData = generateChartData(startDate, endDate)
    
    // Create report data
    const reportData: ReportData = {
      period: period as any,
      startDate,
      endDate,
      metrics,
      insights,
      chartData,
      lastUpdated: new Date().toISOString(),
    }
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    return NextResponse.json({
      success: true,
      data: reportData,
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate report',
      },
      { status: 500 }
    )
  }
}

/**
 * Generate mock metrics
 */
function generateMockMetrics(): ReportMetrics {
  const totalCalls = faker.number.int({ min: 50, max: 200 })
  const connectedCalls = faker.number.int({ min: 30, max: totalCalls })
  const meetingsScheduled = faker.number.int({ min: 10, max: 50 })
  const meetingsCompleted = faker.number.int({ min: 5, max: meetingsScheduled })
  const dealsWon = faker.number.int({ min: 2, max: 15 })
  const dealsLost = faker.number.int({ min: 1, max: 10 })
  const emailsSent = faker.number.int({ min: 100, max: 500 })
  
  return {
    // Call Metrics
    totalCalls,
    connectedCalls,
    avgCallDuration: faker.number.int({ min: 120, max: 600 }),
    connectRate: Math.round((connectedCalls / totalCalls) * 100),
    
    // Meeting Metrics
    meetingsScheduled,
    meetingsCompleted,
    meetingConversionRate: Math.round((meetingsScheduled / connectedCalls) * 100),
    
    // Contact Metrics
    totalContacts: faker.number.int({ min: 100, max: 500 }),
    newContacts: faker.number.int({ min: 20, max: 100 }),
    activeContacts: faker.number.int({ min: 50, max: 200 }),
    
    // Revenue Metrics
    revenue: faker.number.int({ min: 10000, max: 100000 }),
    avgDealSize: faker.number.int({ min: 1000, max: 10000 }),
    dealsWon,
    dealsLost,
    winRate: Math.round((dealsWon / (dealsWon + dealsLost)) * 100),
    
    // Activity Metrics
    emailsSent,
    emailOpenRate: faker.number.int({ min: 15, max: 35 }),
    emailReplyRate: faker.number.int({ min: 5, max: 15 }),
    tasksCompleted: faker.number.int({ min: 20, max: 80 }),
    
    // Performance Metrics
    avgResponseTime: faker.number.float({ min: 0.5, max: 4, fractionDigits: 1 }),
    followUpRate: faker.number.int({ min: 60, max: 95 }),
    leadVelocity: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
  }
}

/**
 * Generate AI insights based on metrics
 */
function generateAIInsights(metrics: ReportMetrics): AIInsight[] {
  const insights: AIInsight[] = []
  
  // Generate insights based on metrics
  if (metrics.connectRate > 60) {
    insights.push({
      id: faker.string.uuid(),
      type: 'achievement',
      title: 'Excellent Connect Rate',
      description: `Your connect rate of ${metrics.connectRate}% is above industry average. Keep up the great work!`,
      priority: 'high',
      metric: 'connectRate',
      change: faker.number.int({ min: 5, max: 15 }),
      createdAt: new Date().toISOString(),
    })
  } else if (metrics.connectRate < 40) {
    insights.push({
      id: faker.string.uuid(),
      type: 'alert',
      title: 'Low Connect Rate',
      description: `Your connect rate of ${metrics.connectRate}% needs improvement. Try calling at different times.`,
      priority: 'high',
      metric: 'connectRate',
      change: faker.number.int({ min: -15, max: -5 }),
      createdAt: new Date().toISOString(),
    })
  }
  
  if (metrics.meetingConversionRate > 30) {
    insights.push({
      id: faker.string.uuid(),
      type: 'trend',
      title: 'Strong Meeting Conversion',
      description: `${metrics.meetingConversionRate}% of your calls are converting to meetings. This is excellent!`,
      priority: 'medium',
      metric: 'meetingConversionRate',
      change: faker.number.int({ min: 5, max: 20 }),
      createdAt: new Date().toISOString(),
    })
  }
  
  // Revenue insights
  if (metrics.winRate > 25) {
    insights.push({
      id: faker.string.uuid(),
      type: 'achievement',
      title: 'High Win Rate',
      description: `Your win rate of ${metrics.winRate}% is impressive. You're closing ${metrics.dealsWon} deals successfully.`,
      priority: 'high',
      metric: 'winRate',
      change: faker.number.int({ min: 5, max: 15 }),
      createdAt: new Date().toISOString(),
    })
  }
  
  // Activity recommendations
  if (metrics.emailReplyRate < 10) {
    insights.push({
      id: faker.string.uuid(),
      type: 'recommendation',
      title: 'Improve Email Engagement',
      description: 'Your email reply rate is low. Consider personalizing subject lines and content more.',
      priority: 'medium',
      metric: 'emailReplyRate',
      change: faker.number.int({ min: -10, max: -5 }),
      createdAt: new Date().toISOString(),
    })
  }
  
  // Performance insights
  if (metrics.avgResponseTime > 2) {
    insights.push({
      id: faker.string.uuid(),
      type: 'alert',
      title: 'Slow Response Time',
      description: `Your average response time is ${metrics.avgResponseTime} hours. Try to respond within 1 hour for better engagement.`,
      priority: 'medium',
      metric: 'avgResponseTime',
      change: faker.number.int({ min: 10, max: 25 }),
      createdAt: new Date().toISOString(),
    })
  }
  
  // Add a general trend insight
  insights.push({
    id: faker.string.uuid(),
    type: 'trend',
    title: 'Overall Activity Trend',
    description: `You've made ${metrics.totalCalls} calls and sent ${metrics.emailsSent} emails this period. ${
      metrics.leadVelocity > 5 ? 'Your lead velocity is strong!' : 'Focus on increasing your activity levels.'
    }`,
    priority: 'low',
    metric: 'leadVelocity',
    change: faker.number.int({ min: -10, max: 20 }),
    createdAt: new Date().toISOString(),
  })
  
  return insights
}

/**
 * Generate chart data for the date range
 */
function generateChartData(startDate: string, endDate: string) {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  const days = differenceInDays(end, start) + 1
  
  const calls: ChartDataPoint[] = []
  const meetings: ChartDataPoint[] = []
  const revenue: ChartDataPoint[] = []
  const contacts: ChartDataPoint[] = []
  
  let cumulativeRevenue = 0
  let cumulativeContacts = faker.number.int({ min: 50, max: 100 })
  
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    
    // Generate daily data
    const dailyCalls = faker.number.int({ min: 5, max: 20 })
    const dailyMeetings = faker.number.int({ min: 0, max: 5 })
    const dailyRevenue = faker.number.int({ min: 0, max: 10000 })
    const dailyContacts = faker.number.int({ min: 0, max: 10 })
    
    cumulativeRevenue += dailyRevenue
    cumulativeContacts += dailyContacts
    
    calls.push({
      date: dateStr,
      value: dailyCalls,
      label: format(date, 'MMM d'),
    })
    
    meetings.push({
      date: dateStr,
      value: dailyMeetings,
      label: format(date, 'MMM d'),
    })
    
    revenue.push({
      date: dateStr,
      value: cumulativeRevenue,
      label: format(date, 'MMM d'),
    })
    
    contacts.push({
      date: dateStr,
      value: cumulativeContacts,
      label: format(date, 'MMM d'),
    })
  }
  
  return {
    calls,
    meetings,
    revenue,
    contacts,
  }
}