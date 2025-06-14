import { NextRequest, NextResponse } from 'next/server'
import { callRelayService } from '@/services/callRelayService'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const callSid = searchParams.get('callSid')
    
    if (!callSid) {
      return NextResponse.json(
        { error: 'Call SID is required' },
        { status: 400 }
      )
    }

    // Check if relay service is running
    const isHealthy = await callRelayService.health()
    if (!isHealthy) {
      return NextResponse.json(
        { error: 'Call relay service is not running' },
        { status: 503 }
      )
    }

    // Get transcript from relay
    const transcriptData = await callRelayService.streamTranscript(callSid)
    
    return NextResponse.json({
      success: true,
      ...transcriptData,
    })
  } catch (error) {
    console.error('Error fetching transcript:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch transcript', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}