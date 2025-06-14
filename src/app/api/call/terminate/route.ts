import { NextRequest, NextResponse } from 'next/server'
import { callRelayService } from '@/services/callRelayService'

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
    await callRelayService.terminateCall(callSid)
    
    return NextResponse.json({
      success: true,
      message: 'Call terminated successfully',
      callSid,
    })
  } catch (error) {
    console.error('Error terminating call:', error)
    return NextResponse.json(
      { 
        error: 'Failed to terminate call', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}