/**
 * WebSocket Relay Service for ElevenLabs Streaming
 * 
 * This is a standalone WebSocket server that handles real-time audio streaming
 * between Twilio and ElevenLabs. It runs separately from Next.js.
 */

import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import axios from 'axios';
import { logger } from '@/lib/logger';
import { getCallContext, addTranscriptEntry } from '@/services/callRelayDirect';

const MEDIA_STREAM_TIMEOUT_MS = 300000; // 5 minutes
const MAX_ELEVENLABS_RETRIES = 3;

interface StreamConnection {
  reqId: string;
  twilioWs: WebSocket;
  elevenWs: WebSocket | null;
  streamSid: string | null;
  elevenReady: boolean;
  buffer: string[];
  closed: boolean;
  retries: number;
}

/**
 * Start the WebSocket relay server
 */
export function startWebSocketRelay(port: number = 8001) {
  const server = createServer();
  const wss = new WebSocketServer({ server });
  
  logger.info({ port }, 'websocket.relay.starting');
  
  wss.on('connection', (ws, request) => {
    const url = new URL(request.url!, `http://${request.headers.host}`);
    const reqId = url.searchParams.get('reqId');
    
    if (!reqId) {
      logger.error('websocket.relay.missing_reqId');
      ws.close(1002, 'Missing reqId parameter');
      return;
    }
    
    // Get call context
    const context = getCallContext(reqId);
    if (!context.callSid) {
      logger.error({ reqId }, 'websocket.relay.missing_context');
      ws.close(1002, 'Invalid request ID');
      return;
    }
    
    logger.info({ 
      reqId,
      callSid: context.callSid,
      hasScript: !!context.script,
      hasPersona: !!context.persona
    }, 'websocket.relay.connection');
    
    // Create stream connection
    const conn: StreamConnection = {
      reqId,
      twilioWs: ws,
      elevenWs: null,
      streamSid: null,
      elevenReady: false,
      buffer: [],
      closed: false,
      retries: 0
    };
    
    // Connect to ElevenLabs
    connectToElevenLabs(conn, context);
    
    // Handle Twilio messages
    ws.on('message', (data) => handleTwilioMessage(conn, data));
    ws.on('close', () => handleTwilioClose(conn));
    ws.on('error', (error) => {
      logger.error({ reqId, error: error.message }, 'websocket.relay.twilio_error');
    });
    
    // Set timeout
    setTimeout(() => {
      if (!conn.closed) {
        logger.warn({ reqId }, 'websocket.relay.timeout');
        conn.twilioWs.close();
      }
    }, MEDIA_STREAM_TIMEOUT_MS);
  });
  
  server.listen(port, () => {
    logger.info({ port }, 'websocket.relay.started');
  });
  
  return server;
}

/**
 * Connect to ElevenLabs WebSocket
 */
async function connectToElevenLabs(conn: StreamConnection, context: any) {
  const { reqId } = conn;
  
  try {
    // Get signed URL
    const elevenLabsAgentId = process.env.ELEVENLABS_AGENT_ID;
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!elevenLabsAgentId || !elevenLabsApiKey) {
      throw new Error('ElevenLabs configuration missing');
    }
    
    logger.info({ 
      reqId,
      elevenLabsAgentId,
      hasApiKey: !!elevenLabsApiKey,
      script: context.script?.substring(0, 50) || 'NO_SCRIPT',
      persona: context.persona || 'NO_PERSONA'
    }, 'elevenlabs.connecting');
    
    const { data } = await axios.get(
      'https://api.elevenlabs.io/v1/convai/conversation/get-signed-url',
      {
        params: { agent_id: elevenLabsAgentId },
        headers: { 'xi-api-key': elevenLabsApiKey }
      }
    );
    
    const signedUrl = data.signed_url;
    logger.info({ reqId, hasSignedUrl: !!signedUrl }, 'elevenlabs.signed_url.received');
    
    // Connect WebSocket
    conn.elevenWs = new WebSocket(signedUrl, {
      headers: { 'User-Agent': 'HarperAI/1.0' }
    });
    
    // Handle ElevenLabs events
    conn.elevenWs.on('open', () => {
      logger.info({ reqId }, 'elevenlabs.stream.connected');
      conn.retries = 0;
      conn.elevenReady = false;
      
      // Send initialization
      if (context.script || context.persona || context.context) {
        const initMessage = {
          type: 'conversation_initiation_client_data',
          conversation_initiation_client_data: {
            script: context.script || "You are a helpful AI assistant.",
            persona: context.persona || "Professional and friendly",
            context: context.context || "Customer service call"
          }
        };
        
        logger.info({ 
          reqId,
          initMessage: JSON.stringify(initMessage).substring(0, 200) + '...'
        }, 'elevenlabs.init.sending');
        
        conn.elevenWs!.send(JSON.stringify(initMessage));
      }
    });
    
    conn.elevenWs.on('message', (data) => handleElevenLabsMessage(conn, data, context));
    conn.elevenWs.on('close', () => handleElevenLabsClose(conn, context));
    conn.elevenWs.on('error', (error) => {
      logger.error({ reqId, error: error.message }, 'elevenlabs.stream.error');
    });
    
  } catch (error: any) {
    logger.error({ 
      reqId,
      error: error.message,
      response: error.response?.data
    }, 'elevenlabs.connect.failed');
  }
}

/**
 * Handle Twilio WebSocket messages
 */
function handleTwilioMessage(conn: StreamConnection, data: any) {
  try {
    const msg = JSON.parse(data.toString());
    
    switch (msg.event) {
      case 'start':
        conn.streamSid = msg.start.streamSid;
        logger.info({ 
          reqId: conn.reqId,
          streamSid: conn.streamSid 
        }, 'twilio.stream.started');
        break;
        
      case 'media':
        const chunk = msg.media?.payload;
        if (chunk) {
          if (conn.elevenReady && conn.elevenWs?.readyState === WebSocket.OPEN) {
            conn.elevenWs.send(JSON.stringify({ user_audio_chunk: chunk }));
          } else {
            conn.buffer.push(chunk);
          }
        }
        break;
        
      case 'stop':
        logger.info({ reqId: conn.reqId }, 'twilio.stream.stopped');
        conn.closed = true;
        conn.elevenWs?.close();
        break;
    }
  } catch (error: any) {
    logger.error({ 
      reqId: conn.reqId,
      error: error.message 
    }, 'twilio.message.error');
  }
}

/**
 * Handle ElevenLabs WebSocket messages
 */
function handleElevenLabsMessage(conn: StreamConnection, data: any, context: any) {
  try {
    const msg = JSON.parse(data.toString());
    
    logger.debug({ 
      reqId: conn.reqId,
      messageType: msg.type,
      hasAudio: !!msg.audio_event?.audio_base_64
    }, 'elevenlabs.message.received');
    
    switch (msg.type) {
      case 'conversation_initiation_metadata':
        conn.elevenReady = true;
        logger.info({ reqId: conn.reqId }, 'elevenlabs.stream.ready');
        
        // Flush buffered audio
        if (conn.buffer.length > 0) {
          logger.info({ 
            reqId: conn.reqId,
            bufferSize: conn.buffer.length 
          }, 'elevenlabs.buffer.flushing');
          
          conn.buffer.forEach(chunk => {
            conn.elevenWs!.send(JSON.stringify({ user_audio_chunk: chunk }));
          });
          conn.buffer = [];
        }
        break;
        
      case 'audio':
        if (conn.streamSid && msg.audio_event?.audio_base_64) {
          const audioData = msg.audio_event.audio_base_64;
          logger.debug({ 
            reqId: conn.reqId,
            audioLength: audioData.length 
          }, 'elevenlabs.audio.chunk.received');
          
          conn.twilioWs.send(JSON.stringify({
            event: 'media',
            streamSid: conn.streamSid,
            media: { payload: audioData }
          }));
        }
        break;
        
      case 'user_transcript':
        if (msg.user_transcript?.text) {
          logger.info({ 
            reqId: conn.reqId,
            text: msg.user_transcript.text 
          }, 'transcript.user');
          
          addTranscriptEntry(context.callSid, {
            role: 'user',
            text: msg.user_transcript.text,
            timestamp: new Date().toISOString()
          });
        }
        break;
        
      case 'agent_response':
        if (msg.agent_response?.text) {
          logger.info({ 
            reqId: conn.reqId,
            text: msg.agent_response.text 
          }, 'transcript.agent');
          
          addTranscriptEntry(context.callSid, {
            role: 'agent',
            text: msg.agent_response.text,
            timestamp: new Date().toISOString()
          });
        }
        break;
        
      case 'ping':
        if (msg.ping_event?.event_id) {
          conn.elevenWs!.send(JSON.stringify({
            type: 'pong',
            event_id: msg.ping_event.event_id
          }));
        }
        break;
        
      case 'interruption':
        if (conn.streamSid) {
          conn.twilioWs.send(JSON.stringify({
            event: 'clear',
            streamSid: conn.streamSid
          }));
        }
        break;
    }
  } catch (error: any) {
    logger.error({ 
      reqId: conn.reqId,
      error: error.message 
    }, 'elevenlabs.message.error');
  }
}

/**
 * Handle Twilio WebSocket close
 */
function handleTwilioClose(conn: StreamConnection) {
  logger.info({ reqId: conn.reqId }, 'twilio.stream.closed');
  conn.closed = true;
  conn.elevenWs?.close();
}

/**
 * Handle ElevenLabs WebSocket close
 */
function handleElevenLabsClose(conn: StreamConnection, context: any) {
  logger.info({ 
    reqId: conn.reqId,
    retries: conn.retries 
  }, 'elevenlabs.stream.closed');
  
  conn.elevenReady = false;
  
  if (!conn.closed && conn.retries < MAX_ELEVENLABS_RETRIES) {
    conn.retries++;
    logger.info({ 
      reqId: conn.reqId,
      retries: conn.retries 
    }, 'elevenlabs.stream.reconnecting');
    
    setTimeout(() => {
      connectToElevenLabs(conn, context);
    }, 1000 * conn.retries);
  } else if (!conn.closed) {
    logger.error({ reqId: conn.reqId }, 'elevenlabs.stream.max_retries');
    conn.twilioWs.close();
  }
}