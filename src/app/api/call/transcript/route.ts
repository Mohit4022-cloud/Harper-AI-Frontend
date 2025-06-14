import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { streamTranscript, isInitialized } from '@/services/callRelayDirect'

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

    // Check if relay is initialized
    if (!isInitialized()) {
      logger.warn({ requestId }, 'transcript.get.relay_not_initialized')
      return NextResponse.json(
        { error: 'Call relay service is not initialized' },
        { status: 503 }
      )
    }

    // Get transcript using direct relay function
    const transcriptData = await streamTranscript(callSid)
    
    logger.info({ 
      requestId, 
      callSid,
      transcriptCount: transcriptData.transcript.length 
    }, 'transcript.get.success')
    
    return NextResponse.json({
      success: true,
      ...transcriptData,
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