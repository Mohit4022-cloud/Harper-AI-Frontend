import { NextRequest, NextResponse } from 'next/server'
import { callService } from '@/services/callService'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const requestId = req.headers.get('x-request-id') || `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    // Log incoming request at debug level
    logger.debug({ 
      requestId,
      method: req.method,
      path: '/api/call/terminate',
      headers: Object.fromEntries(req.headers.entries())
    }, 'api.call.terminate.incoming')
    
    const body = await req.json()
    const { callSid } = body
    
    // Log request body at debug level
    logger.debug({ 
      requestId,
      body,
      callSid
    }, 'api.call.terminate.body')

    if (!callSid) {
      return NextResponse.json(
        { error: 'Call SID is required' },
        { status: 400 }
      )
    }

    // Log before calling relay service
    logger.info({ 
      requestId,
      callSid 
    }, 'api.call.terminate.before_relay')
    
    // Terminate the call
    await callService.terminateCall(callSid)
    
    // Log after calling relay service
    const duration = Date.now() - startTime
    logger.info({ 
      requestId,
      callSid,
      duration
    }, 'api.call.terminate.after_relay')
    
    const responseBody = {
      success: true,
      message: 'Call terminated successfully',
      callSid,
    }
    
    logger.debug({ 
      requestId,
      responseBody,
      status: 200,
      duration: Date.now() - startTime
    }, 'api.call.terminate.response')
    
    return NextResponse.json(responseBody)
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error({
      requestId,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      duration
    }, '[/api/call/terminate] Error terminating call')
    
    // Check for timeout error and return 504
    if (errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('timed out')) {
      const errorResponse = { 
        error: 'Call termination timed out', 
        details: errorMessage,
        requestId
      }
      
      logger.debug({ 
        requestId,
        responseBody: errorResponse,
        status: 504,
        duration
      }, 'api.call.terminate.timeout_response')
      
      return NextResponse.json(errorResponse, { status: 504 })
    }
    
    const errorResponse = { 
      error: 'Failed to terminate call', 
      details: process.env.LOG_LEVEL === 'debug' ? errorMessage : 'An error occurred',
      requestId
    }
    
    logger.debug({ 
      requestId,
      responseBody: errorResponse,
      status: 500,
      duration
    }, 'api.call.terminate.error_response')
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}