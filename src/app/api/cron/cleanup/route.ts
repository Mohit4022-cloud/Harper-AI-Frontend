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

    // Clean up old sessions
    const sessionsDeleted = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    })

    // Clean up old activities (older than 90 days)
    const activitiesDeleted = await prisma.activity.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      },
    })

    // Clean up orphaned team members
    const orphanedMembers = await prisma.teamMember.deleteMany({
      where: {
        user: {
          is: null,
        },
      },
    })

    // Update metrics for inactive users
    await prisma.user.updateMany({
      where: {
        lastLoginAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        status: 'ACTIVE',
      },
      data: {
        status: 'INACTIVE',
      },
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cleaned: {
        sessions: sessionsDeleted.count,
        activities: activitiesDeleted.count,
        orphanedMembers: orphanedMembers.count,
      },
    })
  } catch (error) {
    console.error('Cleanup cron error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}