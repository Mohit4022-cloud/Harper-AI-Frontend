import { NextRequest, NextResponse } from 'next/server'
import { callRelayService } from '@/services/callRelayService'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Validate phone format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Get settings from API
    const settingsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!settingsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }
    
    const settingsData = await settingsResponse.json()
    const settings = settingsData.data?.integrations
    
    const accountSid = settings?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID
    const authToken = settings?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN
    const twilioNumber = settings?.twilioCallerNumber || process.env.TWILIO_CALLER_NUMBER
    const elevenLabsKey = settings?.elevenLabsKey || process.env.ELEVENLABS_API_KEY
    const elevenLabsAgentId = settings?.elevenLabsAgentId || process.env.ELEVENLABS_AGENT_ID

    if (!accountSid || !authToken || !twilioNumber || !elevenLabsKey || !elevenLabsAgentId) {
      return NextResponse.json(
        { error: 'Twilio/ElevenLabs configuration missing' },
        { status: 500 }
      )
    }

    // Ensure relay service is running
    const isHealthy = await callRelayService.health()
    if (!isHealthy) {
      // Start the relay service
      await callRelayService.start({
        elevenLabsAgentId,
        elevenLabsApiKey: elevenLabsKey,
        twilioAccountSid: accountSid,
        twilioAuthToken: authToken,
        twilioPhoneNumber: twilioNumber,
      })
    }

    // Start the call through relay
    const result = await callRelayService.startAutoDial({
      to: phone,
      from: twilioNumber,
    })

    return NextResponse.json({
      success: true,
      callSid: result.callSid,
      status: 'initiated',
      direction: 'outbound-api',
      from: twilioNumber,
      to: phone,
    })
  } catch (error) {
    console.error('Error starting call:', error)
    return NextResponse.json(
      { 
        error: 'Failed to start call', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}