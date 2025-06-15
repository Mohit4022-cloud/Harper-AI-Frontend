/**
 * Relay Status API Route
 * Health check endpoint that verifies relay service is running
 */

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const requestId = req.headers.get('x-request-id') || `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const RELAY_PORT = process.env.RELAY_PORT || '8000'
  const RELAY_HEALTH_URL = `http://localhost:${RELAY_PORT}/health`
  
  // Log incoming request at debug level
  logger.debug({ 
    requestId,
    method: req.method,
    path: '/api/relay/status',
    relayUrl: RELAY_HEALTH_URL
  }, 'api.relay.status.incoming')
  
  try {
    // Attempt to check relay health with a 2-second timeout
    const response = await axios.get(RELAY_HEALTH_URL, {
      timeout: 2000,
      validateStatus: (status) => true // Accept any status
    })
    
    const duration = Date.now() - startTime
    
    if (response.status === 200) {
      logger.info({
        requestId,
        port: RELAY_PORT,
        response: process.env.LOG_LEVEL === 'debug' ? response.data : undefined,
        duration
      }, '[/api/relay/status] Relay is up')
      
      const responseBody = { relay: 'up' }
      
      logger.debug({ 
        requestId,
        responseBody,
        status: 200,
        duration
      }, 'api.relay.status.response')
      
      return NextResponse.json(responseBody)
    } else {
      logger.warn({
        requestId,
        status: response.status,
        port: RELAY_PORT,
        duration
      }, '[/api/relay/status] Relay returned non-200 status')
      
      const responseBody = { 
        relay: 'down', 
        error: `Relay returned status ${response.status}` 
      }
      
      logger.debug({ 
        requestId,
        responseBody,
        status: 200,
        duration
      }, 'api.relay.status.down_response')
      
      return NextResponse.json(responseBody)
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    const errorMessage = error.code === 'ECONNREFUSED' 
      ? 'Relay service is not running'
      : error.code === 'ECONNABORTED'
      ? 'Relay health check timed out'
      : error.message || 'Unknown error'
    
    logger.error({
      requestId,
      error: {
        message: errorMessage,
        code: error.code,
        stack: error.stack
      },
      port: RELAY_PORT,
      duration
    }, '[/api/relay/status] Relay health check failed')
    
    const responseBody = { 
      relay: 'down', 
      error: errorMessage 
    }
    
    logger.debug({ 
      requestId,
      responseBody,
      status: 200,
      duration
    }, 'api.relay.status.error_response')
    
    return NextResponse.json(responseBody)
  }
}