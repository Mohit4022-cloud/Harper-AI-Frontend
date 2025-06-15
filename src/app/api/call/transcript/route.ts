import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { callService } from '@/services/callService'

export async function GET(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || Math.random().toString(36).substr(2, 9)
  
  try {
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
    const isHealthy = await callService.health()
    if (!isHealthy) {
      return NextResponse.json(
        { error: 'Call service is not available' },
        { status: 503 }
      )
    }
    
    // Get transcript using unified service
    const result = await callService.getTranscript(callSid)
    
    logger.info({ 
      requestId, 
      callSid,
      transcriptCount: result.transcript?.length || 0
    }, 'transcript.get.success')
    
    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    logger.error({ 
      requestId, 
      error: error.message,
      stack: error.stack 
    }, 'transcript.get.error')
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch transcript', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}