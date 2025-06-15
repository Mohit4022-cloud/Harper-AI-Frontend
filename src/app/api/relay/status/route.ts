/**
 * Relay Status API Route
 * Returns the current status of the relay service
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRelayStatus } from '@/lib/relaySingleton'
import { createRequestLogger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const logger = createRequestLogger(req)
  
  try {
    const status = await getRelayStatus()
    
    logger.info({ status }, 'relay.status.check')
    
    return NextResponse.json({
      ...status,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    logger.error({ error: error.message }, 'relay.status.error')
    
    return NextResponse.json(
      { 
        error: 'Failed to get relay status',
        details: error.message 
      },
      { status: 500 }
    )
  }
}