import { NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/prisma'

export async function GET() {
  const healthChecks = {
    database: { status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown', message: '' },
    auth: { status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown', message: '' },
    redis: { status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown', message: '' },
  }

  // Check database connection
  const dbCheck = await checkDatabaseConnection()
  healthChecks.database.status = dbCheck.connected ? 'healthy' : 'unhealthy'
  healthChecks.database.message = dbCheck.error || 'Connected'

  // Check auth configuration
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL) {
    healthChecks.auth.status = 'healthy'
    healthChecks.auth.message = 'Configured'
  } else {
    healthChecks.auth.status = 'unhealthy'
    healthChecks.auth.message = 'Missing NEXTAUTH_SECRET or NEXTAUTH_URL'
  }

  // Check Redis connection if configured
  if (process.env.REDIS_URL) {
    // Add Redis health check here if needed
    healthChecks.redis.status = 'healthy'
    healthChecks.redis.message = 'Configured'
  } else {
    healthChecks.redis.status = 'unknown'
    healthChecks.redis.message = 'Not configured'
  }

  // Overall health status
  const overallHealthy = healthChecks.database.status === 'healthy' && 
                        healthChecks.auth.status === 'healthy'

  return NextResponse.json(
    {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV,
      checks: healthChecks,
    },
    { status: overallHealthy ? 200 : 503 }
  )
}