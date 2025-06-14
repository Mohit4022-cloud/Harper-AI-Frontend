import { NextRequest, NextResponse } from 'next/server'
import { callRelayService } from '@/services/callRelayService'
import { logger } from '@/lib/logger'

/**
 * POST /api/call/start
 * Initiates an outbound call using Twilio + ElevenLabs relay
 * @param req - Request with { phone: string } in body
 * @returns { success: boolean, callSid?: string, error?: string }
 */
export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || Math.random().toString(36).substr(2, 9)
  
  try {
    const body = await req.json()
    const { phone } = body
    
    logger.info({ requestId, phone }, 'call.start.request')

    if (!phone) {
      logger.warn({ requestId }, 'call.start.missing_phone')
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
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

    // Get settings from in-memory store (since we're already on the server)
    // This avoids the circular API call issue
    const settingsModule = await import('@/app/api/settings/route')
    const settingsResponse = await settingsModule.GET(req)
    
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

    // Check for missing configuration
    const missingConfig = []
    if (!accountSid) missingConfig.push('Twilio Account SID')
    if (!authToken) missingConfig.push('Twilio Auth Token')
    if (!twilioNumber) missingConfig.push('Twilio Phone Number')
    if (!elevenLabsKey) missingConfig.push('ElevenLabs API Key')
    if (!elevenLabsAgentId) missingConfig.push('ElevenLabs Agent ID')
    
    if (missingConfig.length > 0) {
      logger.error({ requestId, missingConfig }, 'call.start.missing_config')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service configuration incomplete',
          details: `Missing: ${missingConfig.join(', ')}` 
        },
        { status: 500 }
      )
    }

    try {
      // Ensure relay service is running
      const isHealthy = await callRelayService.health()
      if (!isHealthy) {
        logger.info({ requestId }, 'call.start.relay_starting')
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
      
      logger.info({ requestId, callSid: result.callSid }, 'call.start.success')
      
      return NextResponse.json({
        success: true,
        callSid: result.callSid,
        status: 'initiated',
        direction: 'outbound-api',
        from: twilioNumber,
        to: phone,
      })
    } catch (twilioError: any) {
      logger.error({ requestId, error: twilioError }, 'call.start.twilio_error')
      
      // Parse Twilio-specific errors
      if (twilioError.code === 20003) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Authentication failed',
            details: 'Invalid Twilio credentials. Please check your Account SID and Auth Token.' 
          },
          { status: 401 }
        )
      }
      
      if (twilioError.code === 21211) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid phone number',
            details: 'The phone number format is invalid. Please use E.164 format (+1234567890).' 
          },
          { status: 400 }
        )
      }
      
      // Generic Twilio error
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to initiate call',
          details: twilioError.message || 'An error occurred with the calling service' 
        },
        { status: 502 }
      )
    }

  } catch (error: any) {
    logger.error({ requestId, error }, 'call.start.error')
    
    // Don't expose internal errors to client
    return NextResponse.json(
      { 
        success: false,
        error: 'Unable to process request', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later' 
      },
      { status: 500 }
    )
  }
}