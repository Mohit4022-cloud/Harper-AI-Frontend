import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for performance metrics
const performanceMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  id: z.string(),
  delta: z.number().optional(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  timestamp: z.number(),
  url: z.string(),
  userAgent: z.string(),
})

// In-memory storage for demo (use a real database in production)
const metricsStore: any[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the metric data
    const metric = performanceMetricSchema.parse(body)
    
    // Store the metric (in production, save to database)
    metricsStore.push({
      ...metric,
      receivedAt: Date.now(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    })
    
    // Keep only last 1000 metrics in memory
    if (metricsStore.length > 1000) {
      metricsStore.shift()
    }
    
    // Process metric for alerts
    processMetricAlerts(metric)
    
    // Send to external analytics if configured
    if (process.env.ANALYTICS_ENDPOINT) {
      sendToExternalAnalytics(metric)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to process performance metric:', error)
    return NextResponse.json(
      { error: 'Invalid metric data' },
      { status: 400 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const timeRange = searchParams.get('timeRange') || '1h'
    
    // Calculate time threshold
    const now = Date.now()
    const timeThresholds: Record<string, number> = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    }
    
    const threshold = now - (timeThresholds[timeRange] || timeThresholds['1h'])
    
    // Filter metrics
    let filtered = metricsStore.filter(m => m.timestamp >= threshold)
    
    if (name) {
      filtered = filtered.filter(m => m.name === name)
    }
    
    // Calculate aggregations
    const aggregations = calculateAggregations(filtered)
    
    return NextResponse.json({
      metrics: filtered.slice(-100), // Return last 100 metrics
      aggregations,
      count: filtered.length,
    })
  } catch (error) {
    console.error('Failed to fetch performance metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

function processMetricAlerts(metric: any) {
  // Check for performance degradation
  const alertThresholds: Record<string, { poor: number }> = {
    'LCP': { poor: 4000 },
    'FID': { poor: 300 },
    'CLS': { poor: 0.25 },
    'TTFB': { poor: 1800 },
    'INP': { poor: 500 },
    'memory-usage': { poor: 100 },
    'virtual-scroll-fps': { poor: 30 },
  }
  
  const threshold = alertThresholds[metric.name]
  
  if (threshold) {
    const isPoor = metric.name === 'CLS' 
      ? metric.value > threshold.poor
      : metric.name === 'virtual-scroll-fps'
      ? metric.value < threshold.poor
      : metric.value > threshold.poor
    
    if (isPoor) {
      // Send alert (implement your alerting mechanism)
      console.warn(`Performance alert: ${metric.name} = ${metric.value} (poor)`)
      
      // Could send to Slack, email, etc.
      sendPerformanceAlert(metric)
    }
  }
}

function sendPerformanceAlert(metric: any) {
  // Implement your alerting mechanism
  // Example: Send to Slack webhook
  if (process.env.SLACK_WEBHOOK_URL) {
    fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Performance Alert: ${metric.name} is performing poorly`,
        attachments: [{
          color: 'danger',
          fields: [
            { title: 'Metric', value: metric.name, short: true },
            { title: 'Value', value: metric.value, short: true },
            { title: 'URL', value: metric.url, short: true },
            { title: 'Rating', value: metric.rating || 'poor', short: true },
          ],
        }],
      }),
    }).catch(console.error)
  }
}

function sendToExternalAnalytics(metric: any) {
  // Send to external analytics service (Google Analytics, Mixpanel, etc.)
  if (process.env.ANALYTICS_ENDPOINT) {
    fetch(process.env.ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`,
      },
      body: JSON.stringify(metric),
    }).catch(console.error)
  }
}

function calculateAggregations(metrics: any[]) {
  if (metrics.length === 0) return {}
  
  const grouped = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = []
    }
    acc[metric.name].push(metric.value)
    return acc
  }, {} as Record<string, number[]>)
  
  const aggregations: Record<string, any> = {}
  
  Object.entries(grouped).forEach(([name, values]) => {
    const sorted = values.sort((a, b) => a - b)
    const sum = values.reduce((acc, val) => acc + val, 0)
    
    aggregations[name] = {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p75: sorted[Math.floor(sorted.length * 0.75)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    }
  })
  
  return aggregations
}