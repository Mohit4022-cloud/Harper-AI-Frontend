/**
 * Twilio Voice Webhook Handler
 * 
 * Handles incoming voice calls and generates TwiML responses
 * This endpoint is called by Twilio when making outbound calls
 * Uses direct relay functions for ElevenLabs integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getCallContext, isInitialized } from '@/services/callRelayDirect';
import axios from 'axios';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || Math.random().toString(36).substr(2, 9);
  
  try {
    // Get form data from Twilio webhook
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callStatus = formData.get('CallStatus') as string;
    const direction = formData.get('Direction') as string;
    
    // Extract request ID from URL
    const url = new URL(request.url);
    const reqId = url.searchParams.get('reqId');

    logger.info({
      requestId,
      callSid,
      from,
      to,
      callStatus,
      direction,
      reqId
    }, 'twilio.voice.webhook');

    if (!reqId) {
      logger.error({ requestId }, 'twilio.voice.missing_reqId');
      return new NextResponse('Missing reqId parameter', { status: 400 });
    }

    // Get call context for this request
    const context = getCallContext(reqId);
    
    // Generate TwiML response with WebSocket stream
    const twiml = await generateStreamingTwiML(request, reqId);

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error: any) {
    logger.error({ 
      requestId, 
      error: error.message,
      stack: error.stack 
    }, 'twilio.voice.error');
    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * Create ElevenLabs phone call configuration
 */
async function createElevenLabsPhoneCall(reqId: string, callSid: string): Promise<string | null> {
  try {
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!agentId || !apiKey) {
      logger.error('Missing ElevenLabs configuration');
      return null;
    }
    
    // Get call context
    const context = getCallContext(reqId);
    
    // Create a phone call with ElevenLabs
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/convai/conversations/phone_call`,
      {
        agent_id: agentId,
        first_message: context?.script || "Hello! I'm calling from Harper AI. How can I help you today?",
        webhook_url: `${process.env.BASE_URL || process.env.NEXT_PUBLIC_API_URL}/api/elevenlabs/webhook`,
        custom_data: {
          callSid,
          reqId,
          persona: context?.persona,
          context: context?.context
        }
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.phone_number;
  } catch (error: any) {
    logger.error({ error: error?.response?.data || error }, 'Failed to create ElevenLabs phone call');
    return null;
  }
}

/**
 * Generate TwiML for streaming to ElevenLabs
 */
async function generateStreamingTwiML(request: NextRequest, reqId: string): Promise<string> {
  const host = request.headers.get('host') || 'localhost';
  const isLocal = /localhost|127\.0\.0\.1/.test(host);
  
  // Log the call context and ElevenLabs configuration
  const context = getCallContext(reqId);
  logger.info({
    reqId,
    callSid: context.callSid,
    script: context.script || 'NO_SCRIPT',
    persona: context.persona || 'NO_PERSONA',
    context: context.context || 'NO_CONTEXT',
    elevenLabsAgentId: process.env.ELEVENLABS_AGENT_ID || 'NOT_SET',
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ? 'SET' : 'NOT_SET',
    isInitialized: isInitialized()
  }, 'twilio.voice.twiml.generating');

  // Check if we should use the relay subprocess (local development)
  const useRelay = process.env.USE_RELAY_SUBPROCESS === 'true';
  
  if (useRelay) {
    // Use the original relay subprocess approach for local development
    const relayPort = process.env.RELAY_PORT || '8000';
    const streamUrl = `ws://localhost:${relayPort}/media-stream?reqId=${reqId}`;
    
    logger.info({
      reqId,
      streamUrl,
      useRelay: true,
      context: context
    }, 'twilio.voice.using_relay_subprocess');
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting you to the AI assistant.</Say>
  <Connect>
    <Stream url="${streamUrl}" />
  </Connect>
</Response>`;
    
    return twiml;
  }
  
  // For production, check if ElevenLabs is configured
  const elevenLabsConfigured = process.env.ELEVENLABS_AGENT_ID && process.env.ELEVENLABS_API_KEY;
  
  if (!elevenLabsConfigured) {
    // Fallback if ElevenLabs is not configured
    logger.warn({ reqId }, 'twilio.voice.elevenlabs_not_configured');
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>I'm sorry, but the AI assistant is not properly configured. Please contact support.</Say>
  <Pause length="2"/>
  <Say>Thank you for calling. Goodbye.</Say>
  <Hangup/>
</Response>`;

    return twiml;
  }
  
  // For now, use a simple fallback until WebSocket support is added
  logger.info({
    reqId,
    context,
    elevenLabsConfigured: true,
    note: 'WebSocket streaming requires separate relay service'
  }, 'twilio.voice.using_fallback');
  
  // Provide a helpful response explaining the limitation
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for calling Harper AI. Our AI assistant requires advanced streaming capabilities that are currently being configured.</Say>
  <Pause length="1"/>
  <Say>Please contact our support team for assistance, or try again later.</Say>
  <Pause length="2"/>
  <Say>Thank you for your patience. Goodbye.</Say>
  <Hangup/>
</Response>`;
  
  return twiml;
}

/**
 * GET endpoint for testing
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Twilio Voice Webhook is ready',
    endpoint: '/api/twilio/voice',
    method: 'POST',
  });
}