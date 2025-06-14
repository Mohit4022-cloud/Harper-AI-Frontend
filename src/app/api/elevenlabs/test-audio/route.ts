/**
 * ElevenLabs Test Audio Endpoint
 * 
 * Generates a test audio response using ElevenLabs TTS
 * This helps verify the audio pipeline is working
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getCallContext } from '@/services/callRelayDirect';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || Math.random().toString(36).substr(2, 9);
  
  try {
    // Extract request ID from URL
    const url = new URL(request.url);
    const reqId = url.searchParams.get('reqId');
    
    if (!reqId) {
      logger.error({ requestId }, 'elevenlabs.test_audio.missing_reqId');
      return new NextResponse('Missing reqId parameter', { status: 400 });
    }
    
    // Get call context
    const context = getCallContext(reqId);
    
    // Log the ElevenLabs configuration
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Default voice
    const elevenLabsAgentId = process.env.ELEVENLABS_AGENT_ID;
    
    logger.info({
      requestId,
      reqId,
      callSid: context.callSid,
      elevenLabsAgentId,
      elevenLabsVoiceId,
      hasApiKey: !!elevenLabsApiKey,
      script: context.script || 'NO_SCRIPT',
      persona: context.persona || 'NO_PERSONA',
    }, 'elevenlabs.test_audio.request');
    
    if (!elevenLabsApiKey) {
      logger.error({ requestId }, 'elevenlabs.test_audio.missing_api_key');
      // Return a fallback audio message
      return generateFallbackAudio('ElevenLabs API key is not configured.');
    }
    
    // Test message based on context
    const testMessage = context.script || 
      "Hi, this is your AI agent. How can I help you today? " +
      "If you can hear this message, the audio pipeline is working correctly. " +
      "However, real-time conversation requires WebSocket streaming which needs a separate server.";
    
    try {
      // Call ElevenLabs TTS API
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
        {
          text: testMessage,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': elevenLabsApiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer'
        }
      );
      
      logger.info({ 
        requestId,
        audioSize: response.data.byteLength,
        contentType: response.headers['content-type']
      }, 'elevenlabs.test_audio.success');
      
      // Return the audio data
      return new NextResponse(response.data, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'no-cache',
        },
      });
      
    } catch (apiError: any) {
      logger.error({ 
        requestId,
        error: apiError.message,
        response: apiError.response?.data?.toString(),
        status: apiError.response?.status
      }, 'elevenlabs.test_audio.api_error');
      
      // Return fallback audio with error message
      return generateFallbackAudio('Failed to generate ElevenLabs audio. Check your API key and voice ID.');
    }
    
  } catch (error: any) {
    logger.error({ 
      requestId, 
      error: error.message,
      stack: error.stack 
    }, 'elevenlabs.test_audio.error');
    
    return generateFallbackAudio('An error occurred while generating test audio.');
  }
}

/**
 * Generate fallback audio using Twilio's TTS
 */
function generateFallbackAudio(message: string): NextResponse {
  // Return TwiML that Twilio will convert to audio
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${message}</Say>
</Response>`;
  
  return new NextResponse(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}