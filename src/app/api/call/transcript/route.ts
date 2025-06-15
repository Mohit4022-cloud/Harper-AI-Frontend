import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { callService } from '@/services/callService'

export async function GET(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const startTime = Date.now()
  
  try {
    // Log incoming request at debug level
    logger.debug({ 
      requestId,
      method: req.method,
      path: '/api/call/transcript',
      query: Object.fromEntries(req.nextUrl.searchParams)
    }, 'api.call.transcript.incoming')
    
    const searchParams = req.nextUrl.searchParams
    const callSid = searchParams.get('callSid')
    
    if (!callSid) {
      return NextResponse.json(
        { error: 'Call SID is required' },
        { status: 400 }
      )
    }

    logger.info({ requestId, callSid }, 'transcript.get.request')

    // Check if service is healthy
    logger.debug({ 
      requestId,
      action: 'health_check'
    }, 'api.call.transcript.before_health_check')
    
    const isHealthy = await callService.health()
    
    if (!isHealthy) {
      const duration = Date.now() - startTime
      logger.warn({ 
        requestId,
        duration
      }, 'api.call.transcript.service_unavailable')
      
      return NextResponse.json(
        { error: 'Call service is not available' },
        { status: 503 }
      )
    }
    
    // Log before calling relay service
    logger.debug({ 
      requestId,
      callSid,
      action: 'get_transcript'
    }, 'api.call.transcript.before_relay')
    
    // Get transcript using unified service
    const result = await callService.getTranscript(callSid)
    
    // Log after calling relay service
    const duration = Date.now() - startTime
    logger.debug({ 
      requestId,
      result,
      duration
    }, 'api.call.transcript.after_relay')
    
    logger.info({ 
      requestId, 
      callSid,
      transcriptCount: result.transcript?.length || 0,
      duration
    }, 'transcript.get.success')
    
    const responseBody = {
      success: true,
      ...result,
    }
    
    logger.debug({ 
      requestId,
      responseBody: process.env.LOG_LEVEL === 'debug' ? responseBody : { transcriptCount: result.transcript?.length || 0 },
      status: 200,
      duration
    }, 'api.call.transcript.response')
    
    return NextResponse.json(responseBody)
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    logger.error({ 
      requestId, 
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      duration
    }, 'transcript.get.error')
    
    const errorResponse = { 
      error: 'Failed to fetch transcript', 
      details: process.env.LOG_LEVEL === 'debug' ? error.message : 'An error occurred',
      requestId
    }
    
    logger.debug({ 
      requestId,
      responseBody: errorResponse,
      status: 500,
      duration
    }, 'api.call.transcript.error_response')
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}