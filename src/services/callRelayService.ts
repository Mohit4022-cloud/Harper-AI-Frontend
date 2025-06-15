/**
 * Call Relay Service
 * Manages communication with the singleton relay process
 */

import axios from 'axios'
import { ensureRelayIsRunning, getRelayStatus, RELAY_BASE_URL } from '@/lib/relaySingleton'
import { logger } from '@/lib/logger'
// Types
interface RelayConfig {
  elevenLabsAgentId: string
  elevenLabsApiKey: string
  twilioAccountSid: string
  twilioAuthToken: string
  twilioPhoneNumber: string
  baseUrl?: string
}

interface OutboundCallParams {
  to: string
  from?: string
  script?: string
  persona?: string
  context?: string
}

interface CallTranscript {
  role: 'user' | 'agent'
  text: string
  timestamp: string
}

/**
 * Call Relay Service - Singleton pattern
 * Communicates with the long-lived relay process
 */
class CallRelayService {
  private static instance: CallRelayService
  
  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): CallRelayService {
    if (!CallRelayService.instance) {
      CallRelayService.instance = new CallRelayService()
    }
    return CallRelayService.instance
  }

  /**
   * Check relay health status
   */
  async health(): Promise<boolean> {
    const startTime = Date.now()
    try {
      logger.debug('[CallRelayService] Checking relay health')
      const status = await getRelayStatus()
      const duration = Date.now() - startTime
      
      logger.info({ 
        status, 
        duration,
        healthy: status.healthy 
      }, '[CallRelayService] Health check completed')
      
      return status.healthy
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error({ 
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error,
        duration
      }, '[CallRelayService] Health check failed')
      return false
    }
  }

  /**
   * Get relay status details
   */
  async status(): Promise<{
    running: boolean
    healthy: boolean
    port: string
    pid?: number
    restartCount: number
  }> {
    return getRelayStatus()
  }

  /**
   * Start an outbound call using the relay
   */
  async startAutoDial(params: OutboundCallParams): Promise<{ success: boolean; callSid?: string; reqId?: string; error?: string }> {
    const startTime = Date.now()
    const maxRetries = 3
    let lastError: any
    
    logger.info({ 
      to: params.to,
      from: params.from,
      hasScript: !!params.script,
      hasPersona: !!params.persona,
      hasContext: !!params.context
    }, '[CallRelayService] Starting auto-dial')
    
    // Log full payload in debug mode
    logger.debug({ 
      payload: params,
      relayUrl: RELAY_BASE_URL 
    }, '[CallRelayService] Auto-dial request payload')
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Ensure relay is running
        logger.debug(`[CallRelayService] Attempt #${attempt + 1} - Ensuring relay is running`)
        await ensureRelayIsRunning()
        
        const url = `${RELAY_BASE_URL}/twilio/outbound_call`
        const payload = {
          to: params.to,
          from: params.from,
          script: params.script,
          persona: params.persona,
          context: params.context,
          baseUrl: process.env.BASE_URL || 'http://localhost:3000'
        }
        
        logger.debug({ 
          attempt: attempt + 1,
          url,
          payload 
        }, '[CallRelayService] Sending request to relay')
        
        const response = await axios.post(url, payload, {
          timeout: 10000,
          validateStatus: (status) => status < 500
        })
        
        const duration = Date.now() - startTime
        
        if (response.status >= 400) {
          logger.warn({
            attempt: attempt + 1,
            status: response.status,
            error: response.data.error,
            response: response.data,
            duration
          }, '[CallRelayService] Call failed with client error')
          lastError = new Error(response.data.error || 'Call failed')
          continue
        }
        
        logger.info({ 
          callSid: response.data.callSid,
          reqId: response.data.reqId,
          attempt: attempt + 1,
          duration,
          response: process.env.LOG_LEVEL === 'debug' ? response.data : undefined
        }, '[CallRelayService] Auto-dial started successfully')
        
        return response.data
      } catch (error: any) {
        lastError = error
        const duration = Date.now() - startTime
        
        logger.error({ 
          attempt: attempt + 1,
          error: {
            message: error.message,
            code: error.code,
            stack: error.stack
          },
          response: error.response?.data,
          duration
        }, `[CallRelayService] Auto-dial attempt #${attempt + 1} failed`)
        
        if (attempt < maxRetries - 1) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 5000)
          logger.debug({ 
            nextAttemptIn: backoffMs 
          }, '[CallRelayService] Waiting before retry')
          await new Promise(resolve => setTimeout(resolve, backoffMs))
        }
      }
    }
    
    // All attempts failed
    logger.error({ 
      lastError: {
        message: lastError?.message,
        stack: lastError?.stack
      },
      totalAttempts: maxRetries,
      totalDuration: Date.now() - startTime
    }, '[CallRelayService] All relay attempts failed')
    
    return {
      success: false,
      error: lastError?.response?.data?.details || lastError?.message || 'Failed to start call after all retries'
    }
  }

  /**
   * Get call transcript
   */
  async streamTranscript(callSid: string): Promise<{ callSid: string; transcript: CallTranscript[] }> {
    const startTime = Date.now()
    try {
      await ensureRelayIsRunning()
      
      const url = `${RELAY_BASE_URL}/transcripts/${callSid}`
      logger.debug({ url, callSid }, '[CallRelayService] Fetching transcript')
      
      const response = await axios.get(url, {
        timeout: 5000
      })
      
      const duration = Date.now() - startTime
      
      logger.info({ 
        callSid,
        transcriptCount: response.data.transcript?.length || 0,
        duration,
        transcript: process.env.LOG_LEVEL === 'debug' ? response.data.transcript : undefined
      }, '[CallRelayService] Transcript fetched')
      
      return response.data
    } catch (error: any) {
      const duration = Date.now() - startTime
      logger.error({
        callSid,
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code
        },
        response: error.response?.data,
        duration
      }, '[CallRelayService] Failed to get transcript')
      
      return {
        callSid,
        transcript: []
      }
    }
  }

  /**
   * Get relay metrics
   */
  async getMetrics(): Promise<string> {
    const startTime = Date.now()
    try {
      await ensureRelayIsRunning()
      
      const url = `${RELAY_BASE_URL}/metrics`
      logger.debug({ url }, '[CallRelayService] Fetching metrics')
      
      const response = await axios.get(url, {
        timeout: 5000
      })
      
      const duration = Date.now() - startTime
      logger.debug({ 
        duration,
        metrics: response.data 
      }, '[CallRelayService] Metrics fetched')
      
      return response.data
    } catch (error: any) {
      const duration = Date.now() - startTime
      logger.error({
        error: {
          message: error.message,
          stack: error.stack
        },
        duration
      }, '[CallRelayService] Failed to get metrics')
      
      return 'metrics_unavailable 1'
    }
  }

  /**
   * Terminate an active call
   */
  async terminateCall(callSid: string): Promise<void> {
    const startTime = Date.now()
    try {
      await ensureRelayIsRunning()
      
      const url = `${RELAY_BASE_URL}/twilio/terminate_call`
      const payload = { callSid }
      
      logger.info({ callSid }, '[CallRelayService] Terminating call')
      logger.debug({ 
        url, 
        payload 
      }, '[CallRelayService] Sending terminate request')

      const response = await axios.post(
        url,
        payload,
        {
          timeout: 5000, // 5 second timeout
          validateStatus: (status) => status < 500
        }
      )
      
      const duration = Date.now() - startTime

      if (response.status === 504) {
        logger.error({ 
          callSid,
          duration 
        }, '[CallRelayService] Call termination timed out')
        throw new Error('Call termination timed out')
      }

      if (response.status >= 400) {
        logger.warn({
          callSid,
          status: response.status,
          error: response.data.error,
          response: response.data,
          duration
        }, '[CallRelayService] Call termination failed')
        throw new Error(response.data.error || 'Failed to terminate call')
      }

      logger.info({ 
        callSid,
        duration,
        response: process.env.LOG_LEVEL === 'debug' ? response.data : undefined
      }, '[CallRelayService] Call terminated successfully')
    } catch (error: any) {
      const duration = Date.now() - startTime
      
      // Handle timeout specifically
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        logger.error({
          callSid,
          error: {
            message: error.message,
            code: error.code
          },
          duration
        }, '[CallRelayService] Call termination timed out')
        throw new Error('Call termination timed out after 5 seconds')
      }

      logger.error({
        callSid,
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack
        },
        response: error.response?.data,
        duration
      }, '[CallRelayService] Failed to terminate call')
      
      throw new Error(error.response?.data?.error || error.message || 'Failed to terminate call')
    }
  }
}

// Export singleton instance
export const callRelayService = CallRelayService.getInstance()

// Also export the class for testing
export { CallRelayService }