import { z } from 'zod'

/**
 * Report Time Periods
 */
export const ReportPeriod = z.enum(['today', 'week', 'month', 'quarter', 'year', 'custom'])
export type ReportPeriod = z.infer<typeof ReportPeriod>

/**
 * Report Metrics Schema
 */
export const ReportMetricsSchema = z.object({
  // Call Metrics
  totalCalls: z.number(),
  connectedCalls: z.number(),
  avgCallDuration: z.number(), // in seconds
  connectRate: z.number(), // percentage
  
  // Meeting Metrics
  meetingsScheduled: z.number(),
  meetingsCompleted: z.number(),
  meetingConversionRate: z.number(), // percentage
  
  // Contact Metrics
  totalContacts: z.number(),
  newContacts: z.number(),
  activeContacts: z.number(),
  
  // Revenue Metrics
  revenue: z.number(),
  avgDealSize: z.number(),
  dealsWon: z.number(),
  dealsLost: z.number(),
  winRate: z.number(), // percentage
  
  // Activity Metrics
  emailsSent: z.number(),
  emailOpenRate: z.number(), // percentage
  emailReplyRate: z.number(), // percentage
  tasksCompleted: z.number(),
  
  // Performance Metrics
  avgResponseTime: z.number(), // in hours
  followUpRate: z.number(), // percentage
  leadVelocity: z.number(), // leads per day
})

export type ReportMetrics = z.infer<typeof ReportMetricsSchema>

/**
 * AI Insight Schema
 */
export const AIInsightSchema = z.object({
  id: z.string(),
  type: z.enum(['trend', 'recommendation', 'alert', 'achievement']),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  metric: z.string().optional(),
  change: z.number().optional(), // percentage change
  createdAt: z.string(),
})

export type AIInsight = z.infer<typeof AIInsightSchema>

/**
 * Chart Data Point Schema
 */
export const ChartDataPointSchema = z.object({
  date: z.string(),
  value: z.number(),
  label: z.string().optional(),
})

export type ChartDataPoint = z.infer<typeof ChartDataPointSchema>

/**
 * Report Data Schema
 */
export const ReportDataSchema = z.object({
  period: ReportPeriod,
  startDate: z.string(),
  endDate: z.string(),
  metrics: ReportMetricsSchema,
  insights: z.array(AIInsightSchema),
  chartData: z.object({
    calls: z.array(ChartDataPointSchema),
    meetings: z.array(ChartDataPointSchema),
    revenue: z.array(ChartDataPointSchema),
    contacts: z.array(ChartDataPointSchema),
  }),
  lastUpdated: z.string(),
})

export type ReportData = z.infer<typeof ReportDataSchema>

/**
 * Performance Score Schema
 */
export const PerformanceScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  categories: z.object({
    activity: z.number().min(0).max(100),
    engagement: z.number().min(0).max(100),
    conversion: z.number().min(0).max(100),
    efficiency: z.number().min(0).max(100),
  }),
  trend: z.enum(['up', 'down', 'stable']),
  changePercent: z.number(),
})

export type PerformanceScore = z.infer<typeof PerformanceScoreSchema>