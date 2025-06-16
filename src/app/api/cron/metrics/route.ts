import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = headers().get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Calculate recent metrics
    const [
      totalUsers,
      activeUsers,
      totalCalls,
      recentCalls,
      totalContacts,
      activeCampaigns,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: oneDayAgo,
          },
        },
      }),
      prisma.call.count(),
      prisma.call.count({
        where: {
          startedAt: {
            gte: fiveMinutesAgo,
          },
        },
      }),
      prisma.contact.count(),
      prisma.campaign.count({
        where: {
          status: 'RUNNING',
        },
      }),
    ])

    // Calculate call metrics
    const callMetrics = await prisma.call.aggregate({
      where: {
        startedAt: {
          gte: oneDayAgo,
        },
        status: 'COMPLETED',
      },
      _avg: {
        duration: true,
      },
      _count: true,
    })

    // Calculate conversion metrics
    const conversionMetrics = await prisma.campaignContact.groupBy({
      by: ['status'],
      where: {
        campaign: {
          status: 'RUNNING',
        },
      },
      _count: true,
    })

    const metrics = {
      timestamp: now.toISOString(),
      users: {
        total: totalUsers,
        active: activeUsers,
        activePercentage: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      },
      calls: {
        total: totalCalls,
        recent: recentCalls,
        avgDuration: callMetrics._avg.duration || 0,
        dailyCount: callMetrics._count,
      },
      contacts: {
        total: totalContacts,
      },
      campaigns: {
        active: activeCampaigns,
        conversions: conversionMetrics,
      },
    }

    // Store metrics snapshot (you could save this to a metrics table)
    console.log('Metrics snapshot:', metrics)

    // Send to monitoring service if configured
    if (process.env.MONITORING_WEBHOOK_URL) {
      await fetch(process.env.MONITORING_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metrics),
      })
    }

    return NextResponse.json({
      success: true,
      metrics,
    })
  } catch (error) {
    console.error('Metrics cron error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}