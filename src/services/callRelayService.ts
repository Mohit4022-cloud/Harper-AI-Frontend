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
    try {
      const status = await getRelayStatus()
      return status.healthy
    } catch {
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
    try {
      // Ensure relay is running before making the call
      await ensureRelayIsRunning()
      
      logger.info({
        to: params.to,
        from: params.from
      }, '[CallRelayService] Starting auto-dial')

      const response = await axios.post(`${RELAY_BASE_URL}/twilio/outbound_call`, {
        to: params.to,
        from: params.from,
        script: params.script,
        persona: params.persona,
        context: params.context,
        baseUrl: process.env.BASE_URL || 'http://localhost:3000'
      }, {
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      })

      if (response.status >= 400) {
        logger.warn({
          status: response.status,
          data: response.data
        }, '[CallRelayService] Call failed with client error')
        return {
          success: false,
          error: response.data.error || 'Call failed'
        }
      }

      logger.info({
        callSid: response.data.callSid,
        reqId: response.data.reqId
      }, '[CallRelayService] Call initiated successfully')

      return response.data
    } catch (error: any) {
      logger.error({
        error: error.message,
        code: error.code,
        response: error.response?.data
      }, '[CallRelayService] Failed to start call')
      
      // Return a structured error response
      return {
        success: false,
        error: error.response?.data?.details || error.message || 'Failed to start call'
      }
    }
  }

  /**
   * Get call transcript
   */
  async streamTranscript(callSid: string): Promise<{ callSid: string; transcript: CallTranscript[] }> {
    try {
      await ensureRelayIsRunning()
      
      const response = await axios.get(`${RELAY_BASE_URL}/transcripts/${callSid}`, {
        timeout: 5000
      })
      
      return response.data
    } catch (error: any) {
      logger.error({
        callSid,
        error: error.message
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
    try {
      await ensureRelayIsRunning()
      
      const response = await axios.get(`${RELAY_BASE_URL}/metrics`, {
        timeout: 5000
      })
      
      return response.data
    } catch (error: any) {
      logger.error({
        error: error.message
      }, '[CallRelayService] Failed to get metrics')
      
      return 'metrics_unavailable 1'
    }
  }

  /**
   * Terminate an active call
   */
  async terminateCall(callSid: string): Promise<void> {
    try {
      await ensureRelayIsRunning()
      
      logger.info({ callSid }, '[CallRelayService] Terminating call')

      const response = await axios.post(
        `${RELAY_BASE_URL}/twilio/terminate_call`,
        { callSid },
        {
          timeout: 5000, // 5 second timeout
          validateStatus: (status) => status < 500
        }
      )

      if (response.status === 504) {
        logger.error({ callSid }, '[CallRelayService] Call termination timed out')
        throw new Error('Call termination timed out')
      }

      if (response.status >= 400) {
        logger.warn({
          status: response.status,
          data: response.data,
          callSid
        }, '[CallRelayService] Call termination failed')
        throw new Error(response.data.error || 'Failed to terminate call')
      }

      logger.info({ callSid }, '[CallRelayService] Call terminated successfully')
    } catch (error: any) {
      // Handle timeout specifically
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        logger.error({
          callSid,
          error: error.message
        }, '[CallRelayService] Call termination timed out')
        throw new Error('Call termination timed out')
      }

      logger.error({
        callSid,
        error: error.message,
        code: error.code,
        response: error.response?.data
      }, '[CallRelayService] Failed to terminate call')
      
      throw new Error(error.response?.data?.error || error.message || 'Failed to terminate call')
    }
  }
}

// Export singleton instance
export const callRelayService = CallRelayService.getInstance()

// Also export the class for testing
export { CallRelayService }