/**
 * Call Start API Route
 * Initiates outbound calls using the singleton relay service
 */

import { NextRequest, NextResponse } from 'next/server'
import { callService } from '@/services/callService'
import { createRequestLogger } from '@/lib/logger'
import { validateE164 } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const logger = createRequestLogger(req)
  const requestId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const body = await req.json()
    const { phone, settings: clientSettings } = body
    
    logger.info({ requestId, phone }, 'call.start.request')

    // Validate phone number
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!validateE164(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)' },
        { status: 400 }
      )
    }

    // Get configuration from environment or client settings
    const accountSid = clientSettings?.integrations?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID
    const authToken = clientSettings?.integrations?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN
    const twilioNumber = clientSettings?.integrations?.twilioCallerNumber || process.env.TWILIO_CALLER_NUMBER || process.env.TWILIO_PHONE_NUMBER
    const elevenLabsKey = clientSettings?.integrations?.elevenLabsKey || process.env.ELEVENLABS_API_KEY
    const elevenLabsAgentId = clientSettings?.integrations?.elevenLabsAgentId || process.env.ELEVENLABS_AGENT_ID

    // Debug log configuration sources
    logger.info({
      requestId,
      configSource: {
        twilioAccountSid: {
          fromClient: !!clientSettings?.integrations?.twilioAccountSid,
          fromEnv: !!process.env.TWILIO_ACCOUNT_SID,
          isSet: !!accountSid
        },
        twilioAuthToken: {
          fromClient: !!clientSettings?.integrations?.twilioAuthToken,
          fromEnv: !!process.env.TWILIO_AUTH_TOKEN,
          isSet: !!authToken
        },
        twilioCallerNumber: {
          fromClient: !!clientSettings?.integrations?.twilioCallerNumber,
          fromEnv: !!(process.env.TWILIO_CALLER_NUMBER || process.env.TWILIO_PHONE_NUMBER),
          isSet: !!twilioNumber,
          value: twilioNumber
        },
        elevenLabsKey: {
          fromClient: !!clientSettings?.integrations?.elevenLabsKey,
          fromEnv: !!process.env.ELEVENLABS_API_KEY,
          isSet: !!elevenLabsKey
        },
        elevenLabsAgentId: {
          fromClient: !!clientSettings?.integrations?.elevenLabsAgentId,
          fromEnv: !!process.env.ELEVENLABS_AGENT_ID,
          isSet: !!elevenLabsAgentId,
          value: elevenLabsAgentId
        }
      }
    }, 'call.start.config_debug')

    // Validate required configuration
    const missingConfig = []
    if (!accountSid || accountSid === 'your_account_sid_here') missingConfig.push('Twilio Account SID')
    if (!authToken || authToken === 'your_auth_token_here') missingConfig.push('Twilio Auth Token')
    if (!twilioNumber) missingConfig.push('Twilio Phone Number')
    if (!elevenLabsKey || elevenLabsKey === 'your_elevenlabs_api_key') missingConfig.push('ElevenLabs API Key')
    if (!elevenLabsAgentId || elevenLabsAgentId === 'your_agent_id') missingConfig.push('ElevenLabs Agent ID')

    if (missingConfig.length > 0) {
      logger.error({ requestId, missingConfig }, 'call.start.missing_config')
      return NextResponse.json(
        { 
          error: 'Missing required configuration',
          details: `Missing: ${missingConfig.join(', ')}` 
        },
        { status: 500 }
      )
    }

    // Initialize service if needed (for production)
    if (process.env.NODE_ENV === 'production') {
      await callService.initialize({
        elevenLabsAgentId,
        elevenLabsApiKey: elevenLabsKey,
        twilioAccountSid: accountSid,
        twilioAuthToken: authToken,
        twilioPhoneNumber: twilioNumber,
        baseUrl: process.env.BASE_URL || process.env.NEXT_PUBLIC_API_URL
      })
    }
    
    // Use the unified call service
    logger.info({ requestId }, 'call.start.using_unified_service')
    
    const result = await callService.startCall({
      to: phone,
      from: twilioNumber,
      script: clientSettings?.script || "You are a helpful AI assistant for Harper AI. Be friendly and professional.",
      persona: clientSettings?.persona || "Professional, friendly, and helpful sales assistant",
      context: clientSettings?.context || "This is a call from Harper AI."
    })
    
    if (!result.success) {
      logger.error({ 
        requestId, 
        error: result.error 
      }, 'call.start.failed')
      
      return NextResponse.json(
        { 
          error: 'Failed to start call',
          details: result.error 
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
    
  } catch (error: any) {
    logger.error({ 
      requestId, 
      error: error.message,
      stack: error.stack 
    }, 'call.start.error')
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}