/**
 * ElevenLabs WebSocket Stream Handler
 * Bridges Twilio Media Streams with ElevenLabs Conversational AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getCallContext } from '@/services/callRelayDirect';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || Math.random().toString(36).substr(2, 9);
  
  try {
    // Get request ID from query params
    const url = new URL(request.url);
    const reqId = url.searchParams.get('reqId');
    
    if (!reqId) {
      return NextResponse.json({ error: 'Missing reqId parameter' }, { status: 400 });
    }
    
    // Get call context
    const context = getCallContext(reqId);
    
    logger.info({
      requestId,
      reqId,
      hasContext: !!context,
      callSid: context?.callSid
    }, 'elevenlabs.stream.request');
    
    // Get ElevenLabs configuration
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!agentId || !apiKey) {
      logger.error({ requestId }, 'elevenlabs.stream.missing_config');
      return NextResponse.json(
        { error: 'ElevenLabs configuration missing' },
        { status: 500 }
      );
    }
    
    // Generate the WebSocket URL with custom data
    const customData = {
      script: context?.script || "You are a helpful AI assistant. Be friendly and professional.",
      persona: context?.persona || "Professional and friendly assistant",
      context: context?.context || "This is a call from Harper AI",
      callSid: context?.callSid || reqId
    };
    
    // Construct ElevenLabs WebSocket URL with parameters
    const wsUrl = new URL('wss://api.elevenlabs.io/v1/convai/conversation');
    wsUrl.searchParams.set('agent_id', agentId);
    
    // Add custom data as base64 encoded JSON
    const customDataB64 = Buffer.from(JSON.stringify(customData)).toString('base64');
    wsUrl.searchParams.set('custom_data', customDataB64);
    
    logger.info({
      requestId,
      reqId,
      wsUrl: wsUrl.toString().replace(apiKey, '***'),
      customData
    }, 'elevenlabs.stream.websocket_url');
    
    // Return WebSocket URL configuration
    return NextResponse.json({
      url: wsUrl.toString(),
      headers: {
        'xi-api-key': apiKey
      }
    });
    
  } catch (error: any) {
    logger.error({ 
      requestId, 
      error: error.message,
      stack: error.stack 
    }, 'elevenlabs.stream.error');
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}