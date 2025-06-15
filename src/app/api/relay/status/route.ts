/**
 * Relay Status API Route
 * Health check endpoint that verifies relay service is running
 */

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const RELAY_PORT = process.env.RELAY_PORT || '8000'
  const RELAY_HEALTH_URL = `http://localhost:${RELAY_PORT}/health`
  try {
    // Attempt to check relay health with a 2-second timeout
    const response = await axios.get(RELAY_HEALTH_URL, {
      timeout: 2000,
      validateStatus: (status) => true // Accept any status
    })
    
    if (response.status === 200) {
      logger.info({
        port: RELAY_PORT,
        response: response.data
      }, '[/api/relay/status] Relay is up')
      
      return NextResponse.json({ relay: 'up' })
    } else {
      logger.warn({
        status: response.status,
        port: RELAY_PORT
      }, '[/api/relay/status] Relay returned non-200 status')
      
      return NextResponse.json({ 
        relay: 'down', 
        error: `Relay returned status ${response.status}` 
      })
    }
  } catch (error: any) {
    const errorMessage = error.code === 'ECONNREFUSED' 
      ? 'Relay service is not running'
      : error.code === 'ECONNABORTED'
      ? 'Relay health check timed out'
      : error.message || 'Unknown error'
    
    logger.error({
      error: errorMessage,
      code: error.code,
      port: RELAY_PORT
    }, '[/api/relay/status] Relay health check failed')
    
    return NextResponse.json({ 
      relay: 'down', 
      error: errorMessage 
    })
  }
}