import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { 
  initializeRelay, 
  startAutoDial, 
  isInitialized,
  type RelayConfig 
} from '@/services/callRelayDirect'

/**
 * POST /api/call/start
 * Initiates an outbound call using direct relay functions
 * @param req - Request with { phone: string, settings?: any } in body
 * @returns { success: boolean, callSid?: string, error?: string }
 */
export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || Math.random().toString(36).substr(2, 9)
  
  try {
    const body = await req.json()
    const { phone, settings: clientSettings } = body
    
    logger.info({ requestId, phone }, 'call.start.request')

    // Validate phone number
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
      logger.warn({ requestId, phone }, 'call.start.invalid_phone')
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format. Use E.164 format (+1234567890)' },
        { status: 400 }
      )
    }

    // Get settings from client or environment
    const settings = clientSettings?.integrations || global.userSettings?.integrations
    
    const accountSid = settings?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID
    const authToken = settings?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN
    const twilioNumber = settings?.twilioCallerNumber || process.env.TWILIO_CALLER_NUMBER
    const elevenLabsKey = settings?.elevenLabsKey || process.env.ELEVENLABS_API_KEY
    const elevenLabsAgentId = settings?.elevenLabsAgentId || process.env.ELEVENLABS_AGENT_ID
    const baseUrl = settings?.baseUrl || process.env.BASE_URL || process.env.NEXT_PUBLIC_API_URL
    
    // Debug log configuration sources
    logger.info({
      requestId,
      configSource: {
        twilioAccountSid: {
          fromSettings: !!settings?.twilioAccountSid,
          fromEnv: !!process.env.TWILIO_ACCOUNT_SID,
          value: accountSid ? `${accountSid.substring(0, 6)}...` : 'NOT SET',
        },
        twilioAuthToken: {
          fromSettings: !!settings?.twilioAuthToken,
          fromEnv: !!process.env.TWILIO_AUTH_TOKEN,
          isSet: !!authToken,
        },
        twilioPhoneNumber: {
          fromSettings: !!settings?.twilioCallerNumber,
          fromEnv: !!process.env.TWILIO_CALLER_NUMBER,
          value: twilioNumber || 'NOT SET',
        },
        elevenLabsAgentId: {
          fromSettings: !!settings?.elevenLabsAgentId,
          fromEnv: !!process.env.ELEVENLABS_AGENT_ID,
          value: elevenLabsAgentId || 'NOT SET',
        },
        baseUrl: {
          value: baseUrl || 'NOT SET'
        }
      },
    }, 'call.start.config_debug')

    // Check for missing configuration
    const missingConfig = []
    if (!accountSid) missingConfig.push('Twilio Account SID')
    if (!authToken) missingConfig.push('Twilio Auth Token')
    if (!twilioNumber) missingConfig.push('Twilio Phone Number')
    if (!elevenLabsKey) missingConfig.push('ElevenLabs API Key')
    if (!elevenLabsAgentId) missingConfig.push('ElevenLabs Agent ID')
    if (!baseUrl) missingConfig.push('Base URL for webhooks')
    
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
      // Initialize relay if not already initialized
      if (!isInitialized()) {
        logger.info({ requestId }, 'call.start.relay_initializing')
        
        const relayConfig: RelayConfig = {
          elevenLabsAgentId,
          elevenLabsApiKey: elevenLabsKey,
          twilioAccountSid: accountSid,
          twilioAuthToken: authToken,
          twilioPhoneNumber: twilioNumber,
          baseUrl
        }
        
        await initializeRelay(relayConfig)
      }

      // Add default script and persona if not provided
      const defaultScript = "You are a helpful AI assistant for Harper AI. Be friendly and professional.";
      const defaultPersona = "Professional, friendly, and helpful sales assistant";
      
      // Start the call using direct relay function with context
      const result = await startAutoDial({
        to: phone,
        from: twilioNumber,
        requestId,
        script: defaultScript,
        persona: defaultPersona,
        context: "This is a test call from Harper AI to verify the voice pipeline is working."
      })
      
      logger.info({ 
        requestId,
        callSid: result.callSid,
        reqId: result.reqId,
        hasScript: true,
        hasPersona: true,
        script: defaultScript.substring(0, 50) + '...',
        persona: defaultPersona
      }, 'call.start.context_added')
      
      if (!result.success) {
        logger.error({ 
          requestId, 
          error: result.error,
          details: result.details 
        }, 'call.start.relay_error')
        
        // Parse specific Twilio errors
        if (result.details?.includes('authenticate')) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Authentication failed',
              details: 'Invalid Twilio credentials. Please check your Account SID and Auth Token.' 
            },
            { status: 401 }
          )
        }
        
        if (result.details?.includes('21211') || result.details?.includes('phone number')) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Invalid phone number',
              details: 'The phone number format is invalid or the number does not exist.' 
            },
            { status: 400 }
          )
        }
        
        return NextResponse.json(
          { 
            success: false, 
            error: result.error || 'Failed to initiate call',
            details: result.details 
          },
          { status: 502 }
        )
      }
      
      logger.info({ 
        requestId, 
        callSid: result.callSid,
        reqId: result.reqId 
      }, 'call.start.success')
      
      return NextResponse.json({
        success: true,
        callSid: result.callSid,
        status: 'initiated',
        direction: 'outbound-api',
        from: twilioNumber,
        to: phone,
      })
    } catch (relayError: any) {
      logger.error({ 
        requestId, 
        error: relayError.message,
        stack: relayError.stack 
      }, 'call.start.relay_error')
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service temporarily unavailable',
          details: process.env.NODE_ENV === 'development' ? relayError.message : 'Please try again later'
        },
        { status: 502 }
      )
    }
  } catch (error: any) {
    logger.error({ 
      requestId, 
      error: error.message,
      stack: error.stack 
    }, 'call.start.error')
    
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