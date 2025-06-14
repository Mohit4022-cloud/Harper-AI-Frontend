/**
 * Direct Call Relay Service
 * Calls relay functions directly without HTTP middleware
 * Production-ready implementation for Render deployment
 */

import twilio from 'twilio'
import axios from 'axios'
import crypto from 'crypto'
import { logger } from '@/lib/logger'

// Types for relay functions
export interface RelayConfig {
  elevenLabsAgentId: string
  elevenLabsApiKey: string
  twilioAccountSid: string
  twilioAuthToken: string
  twilioPhoneNumber: string
  baseUrl?: string // For webhook URLs
}

export interface OutboundCallParams {
  to: string
  from?: string
  script?: string
  persona?: string
  context?: string
  requestId?: string
}

export interface CallResult {
  success: boolean
  reqId: string
  callSid: string
  error?: string
  details?: string
}

export interface CallTranscript {
  role: 'user' | 'agent'
  text: string
  timestamp: string
}

export interface TranscriptResult {
  callSid: string
  transcript: CallTranscript[]
}

export interface CallMetrics {
  calls_total: number
  errors_total: number
  active_calls: number
  reconnects_total: number
}

// Global state (similar to relay)
const globalState = {
  twilioClient: null as twilio.Twilio | null,
  metrics: {
    calls: 0,
    errors: 0,
    active: 0,
    reconnects: 0
  },
  transcripts: {} as Record<string, CallTranscript[]>,
  callContextMap: {} as Record<string, any>,
  config: null as RelayConfig | null,
  initialized: false
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return crypto.randomBytes(8).toString('hex')
}

/**
 * Initialize the relay with configuration
 * Must be called before using any relay functions
 */
export async function initializeRelay(config: RelayConfig): Promise<void> {
  const requestId = generateRequestId()
  
  logger.info({ 
    requestId,
    elevenLabsAgentId: config.elevenLabsAgentId ? 'SET' : 'NOT_SET',
    twilioAccountSid: config.twilioAccountSid ? config.twilioAccountSid.substring(0, 6) + '...' : 'NOT_SET',
    baseUrl: config.baseUrl 
  }, 'relay.init.start')

  try {
    // Validate required configuration
    if (!config.elevenLabsAgentId || !config.elevenLabsApiKey) {
      throw new Error('ElevenLabs configuration missing')
    }
    
    if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
      throw new Error('Twilio configuration missing')
    }

    // Initialize Twilio client
    globalState.twilioClient = twilio(config.twilioAccountSid, config.twilioAuthToken)
    globalState.config = config
    globalState.initialized = true

    logger.info({ requestId }, 'relay.init.success')
  } catch (error) {
    logger.error({ requestId, error }, 'relay.init.failed')
    throw error
  }
}

/**
 * Get ElevenLabs signed URL
 */
async function getSignedUrl(): Promise<string> {
  if (!globalState.config) {
    throw new Error('Relay not initialized')
  }

  try {
    const { data } = await axios.get(
      'https://api.elevenlabs.io/v1/convai/conversation/get-signed-url',
      {
        params: { agent_id: globalState.config.elevenLabsAgentId },
        headers: { 'xi-api-key': globalState.config.elevenLabsApiKey }
      }
    )
    return data.signed_url
  } catch (err: any) {
    logger.error({ error: err?.response?.data || err }, 'elevenlabs.signed_url.error')
    throw new Error('Failed to obtain ElevenLabs signed URL')
  }
}

/**
 * Start an outbound call
 * Direct implementation of relay's outbound_call endpoint
 */
export async function startAutoDial(params: OutboundCallParams): Promise<CallResult> {
  const reqId = params.requestId || generateRequestId()
  
  logger.info({ 
    reqId, 
    to: params.to,
    from: params.from,
    hasScript: !!params.script,
    hasPersona: !!params.persona
  }, 'call.start.request')

  try {
    // Validate initialization
    if (!globalState.initialized || !globalState.twilioClient || !globalState.config) {
      throw new Error('Relay not initialized. Call initializeRelay first.')
    }

    // Validate phone number
    if (!params.to) {
      throw new Error('Missing "to" phone number')
    }
    
    if (!/^\+?[1-9]\d{1,14}$/.test(params.to)) {
      throw new Error('Invalid E.164 phone number format')
    }

    const baseUrl = globalState.config.baseUrl || process.env.BASE_URL || process.env.NEXT_PUBLIC_API_URL
    if (!baseUrl) {
      throw new Error('BASE_URL not configured for webhooks')
    }

    // Create Twilio call
    const call = await globalState.twilioClient.calls.create({
      to: params.to,
      from: params.from || globalState.config.twilioPhoneNumber,
      url: `${baseUrl}/api/twilio/voice?reqId=${reqId}`,
      method: 'POST',
      statusCallback: `${baseUrl}/api/twilio/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed', 'busy', 'no-answer', 'failed'],
      statusCallbackMethod: 'POST',
      timeout: 30,
      record: false
    })

    // Store call context
    globalState.callContextMap[reqId] = {
      script: params.script,
      persona: params.persona,
      context: params.context,
      callSid: call.sid
    }

    // Initialize transcript array for this call
    globalState.transcripts[call.sid] = []

    // Update metrics
    globalState.metrics.calls++
    globalState.metrics.active++

    logger.info({ 
      reqId, 
      callSid: call.sid,
      status: call.status 
    }, 'call.start.success')

    return {
      success: true,
      reqId,
      callSid: call.sid
    }
  } catch (error: any) {
    globalState.metrics.errors++
    
    logger.error({ 
      reqId, 
      error: error.message,
      code: error.code 
    }, 'call.start.failed')

    return {
      success: false,
      reqId,
      callSid: '',
      error: 'Failed to initiate call',
      details: error.message
    }
  }
}

/**
 * Handle call status updates
 * Direct implementation of relay's call_status endpoint
 */
export async function handleCallStatus(params: {
  CallSid: string
  CallStatus: string
  Duration?: string
  requestId?: string
}): Promise<void> {
  const requestId = params.requestId || generateRequestId()
  
  logger.info({ 
    requestId,
    callSid: params.CallSid,
    status: params.CallStatus,
    duration: params.Duration 
  }, 'call.status.update')

  const completedStatuses = ['completed', 'failed', 'busy', 'no-answer', 'canceled']
  
  if (completedStatuses.includes(params.CallStatus)) {
    globalState.metrics.active = Math.max(0, globalState.metrics.active - 1)
  }
}

/**
 * Get call transcript
 * Direct implementation of relay's transcript endpoint
 */
export async function streamTranscript(callSid: string): Promise<TranscriptResult> {
  const requestId = generateRequestId()
  
  logger.info({ requestId, callSid }, 'transcript.get.request')

  const transcript = globalState.transcripts[callSid] || []
  
  return {
    callSid,
    transcript
  }
}

/**
 * Terminate a call
 * Uses Twilio API directly
 */
export async function terminateCall(callSid: string): Promise<void> {
  const requestId = generateRequestId()
  
  logger.info({ requestId, callSid }, 'call.terminate.request')

  try {
    if (!globalState.twilioClient) {
      throw new Error('Relay not initialized')
    }

    await globalState.twilioClient.calls(callSid).update({
      status: 'completed'
    })

    // Update metrics
    globalState.metrics.active = Math.max(0, globalState.metrics.active - 1)

    logger.info({ requestId, callSid }, 'call.terminate.success')
  } catch (error: any) {
    logger.error({ 
      requestId, 
      callSid,
      error: error.message 
    }, 'call.terminate.failed')
    
    throw error
  }
}

/**
 * Get relay metrics
 */
export function getMetrics(): CallMetrics {
  return {
    calls_total: globalState.metrics.calls,
    errors_total: globalState.metrics.errors,
    active_calls: globalState.metrics.active,
    reconnects_total: globalState.metrics.reconnects
  }
}

/**
 * Add transcript entry (for webhook handlers to use)
 */
export function addTranscriptEntry(callSid: string, entry: CallTranscript): void {
  if (!globalState.transcripts[callSid]) {
    globalState.transcripts[callSid] = []
  }
  
  globalState.transcripts[callSid].push({
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString()
  })
}

/**
 * Get call context (for TwiML generation)
 */
export function getCallContext(reqId: string): any {
  return globalState.callContextMap[reqId] || {}
}

/**
 * Check if relay is initialized
 */
export function isInitialized(): boolean {
  return globalState.initialized
}