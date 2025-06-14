/**
 * WebSocket Media Stream Handler
 * 
 * Handles real-time audio streaming between Twilio and ElevenLabs
 * This replaces the relay's WebSocket server with Next.js compatible implementation
 */

import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { getCallContext, addTranscriptEntry } from '@/services/callRelayDirect'
import { handleMediaStream } from '@/services/elevenLabsWebSocket'

export const runtime = 'nodejs'

// WebSocket upgrade handler
export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || Math.random().toString(36).substr(2, 9)
  
  try {
    // Extract request ID from URL
    const url = new URL(request.url)
    const reqId = url.searchParams.get('reqId')
    
    if (!reqId) {
      logger.error({ requestId }, 'media.stream.missing_reqId')
      return new Response('Missing reqId parameter', { status: 400 })
    }
    
    // Get call context
    const context = getCallContext(reqId)
    if (!context.callSid) {
      logger.error({ requestId, reqId }, 'media.stream.missing_context')
      return new Response('Invalid request ID', { status: 404 })
    }
    
    logger.info({ 
      requestId, 
      reqId,
      callSid: context.callSid,
      hasScript: !!context.script,
      hasPersona: !!context.persona
    }, 'media.stream.request')
    
    // Upgrade to WebSocket
    const upgradeHeader = request.headers.get('upgrade')
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 })
    }
    
    // Handle WebSocket connection
    return handleMediaStream(request, {
      reqId,
      callSid: context.callSid,
      script: context.script,
      persona: context.persona,
      context: context.context,
      onTranscript: (entry) => {
        // Add transcript entry to relay state
        addTranscriptEntry(context.callSid, entry)
      }
    })
  } catch (error: any) {
    logger.error({ 
      requestId, 
      error: error.message,
      stack: error.stack 
    }, 'media.stream.error')
    
    return new Response('Internal server error', { status: 500 })
  }
}

// Handle POST for non-WebSocket requests (fallback)
export async function POST(request: NextRequest) {
  return new Response('WebSocket connection required', { status: 426 })
}