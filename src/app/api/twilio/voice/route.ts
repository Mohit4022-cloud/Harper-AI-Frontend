/**
 * Twilio Voice Webhook Handler
 * 
 * Handles incoming voice calls and generates TwiML responses
 * This endpoint is called by Twilio when making outbound calls
 * Uses direct relay functions for ElevenLabs integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getCallContext } from '@/services/callRelayDirect';

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
    const twiml = generateStreamingTwiML(request, reqId);

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
 * Generate TwiML for streaming to ElevenLabs
 */
function generateStreamingTwiML(request: NextRequest, reqId: string): string {
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
  }, 'twilio.voice.twiml.generating');

  // Check if we should use the relay subprocess (local development)
  const useRelay = process.env.USE_RELAY_SUBPROCESS === 'true';
  
  if (useRelay && isLocal) {
    // Use the original relay subprocess approach for local development
    const relayPort = process.env.RELAY_PORT || '8000';
    const streamUrl = `ws://localhost:${relayPort}/media-stream?reqId=${reqId}`;
    
    logger.info({
      reqId,
      streamUrl,
      useRelay: true
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
  
  // For production/Render, use a simpler approach
  const baseUrl = isLocal ? `http://${host}` : `https://${host}`;
  const testAudioUrl = `${baseUrl}/api/elevenlabs/test-audio?reqId=${reqId}`;
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting you to the AI assistant.</Say>
  <Play>${testAudioUrl}</Play>
  <Say>Real-time conversation requires WebSocket streaming. This is a test of the audio pipeline.</Say>
  <Pause length="2"/>
  <Say>Thank you for calling. Goodbye.</Say>
  <Hangup/>
</Response>`;

  logger.info({
    reqId,
    twiml: twiml.replace(/\n/g, ' ').substring(0, 200) + '...',
    useRelay: false
  }, 'twilio.voice.twiml.generated');

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