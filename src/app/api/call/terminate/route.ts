import { NextRequest, NextResponse } from 'next/server'
import { callService } from '@/services/callService'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { callSid } = body

    if (!callSid) {
      return NextResponse.json(
        { error: 'Call SID is required' },
        { status: 400 }
      )
    }

    // Terminate the call
    await callService.terminateCall(callSid)
    
    return NextResponse.json({
      success: true,
      message: 'Call terminated successfully',
      callSid,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error({
      message: '[/api/call/terminate] Error terminating call',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Check for timeout error and return 504
    if (errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('timed out')) {
      return NextResponse.json(
        { 
          error: 'Call termination timed out', 
          details: errorMessage 
        },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to terminate call', 
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}