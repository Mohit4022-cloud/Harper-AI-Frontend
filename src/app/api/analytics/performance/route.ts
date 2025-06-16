import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vitals:', data)
    }

    // Send to Sentry as breadcrumb
    if (data.metricName && data.value) {
      Sentry.addBreadcrumb({
        category: 'web-vitals',
        message: `${data.metricName}: ${data.value}`,
        level: data.rating === 'poor' ? 'warning' : 'info',
        data: {
          metric: data.metricName,
          value: data.value,
          rating: data.rating,
          navigationType: data.navigationType,
        },
      })
    }

    // Store in database if needed
    // await prisma.performanceMetric.create({ data })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Performance metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to process metrics' },
      { status: 500 }
    )
  }
}