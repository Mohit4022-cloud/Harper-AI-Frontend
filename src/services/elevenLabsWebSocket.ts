/**
 * ElevenLabs WebSocket Service
 * 
 * Handles WebSocket connections between Twilio and ElevenLabs
 * Manages audio streaming and transcript processing
 */

import WebSocket from 'ws'
import axios from 'axios'
import { logger } from '@/lib/logger'
import type { CallTranscript } from '@/services/callRelayDirect'

const MEDIA_STREAM_TIMEOUT_MS = 300000 // 5 minutes
const MAX_ELEVENLABS_RETRIES = 3

interface StreamContext {
  reqId: string
  callSid: string
  script?: string
  persona?: string
  context?: string
  onTranscript: (entry: CallTranscript) => void
}

/**
 * Get ElevenLabs signed URL for WebSocket connection
 */
async function getSignedUrl(): Promise<string> {
  const elevenLabsAgentId = process.env.ELEVENLABS_AGENT_ID
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY
  
  if (!elevenLabsAgentId || !elevenLabsApiKey) {
    throw new Error('ElevenLabs configuration missing')
  }
  
  try {
    const { data } = await axios.get(
      'https://api.elevenlabs.io/v1/convai/conversation/get-signed-url',
      {
        params: { agent_id: elevenLabsAgentId },
        headers: { 'xi-api-key': elevenLabsApiKey }
      }
    )
    return data.signed_url
  } catch (err: any) {
    logger.error({ error: err?.response?.data || err }, 'elevenlabs.signed_url.error')
    throw new Error('Failed to obtain ElevenLabs signed URL')
  }
}

/**
 * Handle WebSocket media stream
 */
export async function handleMediaStream(
  request: Request,
  context: StreamContext
): Promise<Response> {
  // Note: In a real implementation, you would need a WebSocket-capable server
  // Next.js App Router doesn't natively support WebSocket upgrades
  // This is a placeholder that shows the intended implementation
  
  logger.warn({ 
    reqId: context.reqId,
    callSid: context.callSid 
  }, 'websocket.not_supported_in_app_router')
  
  // For production, you would need to either:
  // 1. Use a separate WebSocket server (e.g., Socket.io, native WS)
  // 2. Use Next.js Pages API with custom server
  // 3. Use a WebSocket service like Pusher, Ably, or Supabase Realtime
  
  return new Response('WebSocket not supported in App Router. Use alternative implementation.', { 
    status: 501 
  })
}

/**
 * Connect to ElevenLabs WebSocket (for reference implementation)
 * This shows how the WebSocket connection would work
 */
export async function connectToElevenLabs(
  twilioWs: WebSocket,
  context: StreamContext
): Promise<WebSocket> {
  const requestId = context.reqId
  let streamSid: string | null = null
  let elevenWs: WebSocket | null = null
  let closed = false
  let retries = 0
  let elevenReady = false
  const buffer: string[] = []
  
  // Helper to flush buffered audio
  const flushBuffer = () => {
    if (!elevenReady || !elevenWs || elevenWs.readyState !== WebSocket.OPEN) return
    buffer.forEach(b => elevenWs!.send(JSON.stringify({ user_audio_chunk: b })))
    buffer.length = 0
  }
  
  // Connect to ElevenLabs
  const connectEleven = async () => {
    try {
      const url = await getSignedUrl()
      elevenWs = new WebSocket(url, { 
        headers: { 'User-Agent': 'HarperAI/1.0' } 
      })
      
      elevenWs.on('open', () => {
        retries = 0
        elevenReady = false
        
        logger.info({ requestId, callSid: context.callSid }, 'elevenlabs.connected')
        
        // Send initialization data if provided
        if (context.script || context.persona || context.context) {
          const init = {
            type: 'conversation_initiation_client_data',
            conversation_initiation_client_data: {
              script: context.script,
              persona: context.persona,
              context: context.context
            }
          }
          elevenWs!.send(JSON.stringify(init))
        }
      })
      
      elevenWs.on('message', (data: any) => {
        let msg: any
        try { 
          msg = JSON.parse(data.toString()) 
        } catch {
          return
        }
        
        switch (msg.type) {
          case 'conversation_initiation_metadata':
            elevenReady = true
            flushBuffer()
            break
            
          case 'audio':
            if (streamSid && msg.audio_event?.audio_base_64) {
              twilioWs.send(JSON.stringify({
                event: 'media',
                streamSid,
                media: { payload: msg.audio_event.audio_base_64 }
              }))
            }
            break
            
          case 'user_transcript':
            if (msg.user_transcript?.text) {
              context.onTranscript({
                role: 'user',
                text: msg.user_transcript.text,
                timestamp: new Date().toISOString()
              })
            }
            break
            
          case 'agent_response':
            if (msg.agent_response?.text) {
              context.onTranscript({
                role: 'agent',
                text: msg.agent_response.text,
                timestamp: new Date().toISOString()
              })
            }
            break
            
          case 'ping':
            if (msg.ping_event?.event_id) {
              elevenWs!.send(JSON.stringify({
                type: 'pong',
                event_id: msg.ping_event.event_id
              }))
            }
            break
            
          case 'interruption':
            if (streamSid) {
              twilioWs.send(JSON.stringify({ 
                event: 'clear', 
                streamSid 
              }))
            }
            break
        }
      })
      
      elevenWs.on('close', () => {
        elevenReady = false
        if (!closed && ++retries <= MAX_ELEVENLABS_RETRIES) {
          logger.info({ 
            requestId, 
            retries,
            callSid: context.callSid 
          }, 'elevenlabs.reconnecting')
          
          setTimeout(connectEleven, 1000 * retries)
        } else if (!closed) {
          logger.error({ 
            requestId,
            callSid: context.callSid 
          }, 'elevenlabs.max_retries_reached')
          
          twilioWs.close()
        }
      })
      
      elevenWs.on('error', (error: any) => {
        logger.error({ 
          requestId,
          callSid: context.callSid,
          error: error.message 
        }, 'elevenlabs.error')
      })
      
    } catch (error: any) {
      logger.error({ 
        requestId,
        callSid: context.callSid,
        error: error.message 
      }, 'elevenlabs.connect.error')
    }
  }
  
  // Handle Twilio WebSocket messages
  twilioWs.on('message', (raw: any) => {
    let data: any
    try { 
      data = JSON.parse(raw.toString()) 
    } catch {
      return
    }
    
    switch (data.event) {
      case 'start':
        streamSid = data.start.streamSid
        logger.info({ 
          requestId,
          callSid: context.callSid,
          streamSid 
        }, 'twilio.stream.start')
        break
        
      case 'media':
        const chunk = data.media?.payload
        if (!chunk) return
        
        if (elevenReady && elevenWs?.readyState === WebSocket.OPEN) {
          elevenWs.send(JSON.stringify({ user_audio_chunk: chunk }))
        } else {
          buffer.push(chunk)
        }
        break
        
      case 'stop':
        closed = true
        elevenWs?.close()
        logger.info({ 
          requestId,
          callSid: context.callSid 
        }, 'twilio.stream.stop')
        break
    }
  })
  
  twilioWs.on('close', () => {
    closed = true
    elevenWs?.close()
    logger.info({ 
      requestId,
      callSid: context.callSid 
    }, 'twilio.stream.closed')
  })
  
  // Start connection
  await connectEleven()
  
  // Set idle timeout
  setTimeout(() => {
    if (!closed) {
      logger.warn({ 
        requestId,
        callSid: context.callSid 
      }, 'stream.timeout')
      elevenWs?.close()
    }
  }, MEDIA_STREAM_TIMEOUT_MS)
  
  return elevenWs!
}