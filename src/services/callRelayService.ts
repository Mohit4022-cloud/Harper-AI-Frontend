/**
 * Call Relay Service
 * Manages communication with the singleton relay process
 */

import axios from 'axios'
import { ensureRelayIsRunning, getRelayStatus, RELAY_BASE_URL } from '@/lib/relaySingleton'
import { logger } from '@/lib/logger'
import type { RelayConfig, OutboundCallParams, CallTranscript } from '@/types/relay'

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
      
      logger.info('[CallRelayService] Starting auto-dial', {
        to: params.to,
        from: params.from
      })

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
        logger.warn('[CallRelayService] Call failed with client error', {
          status: response.status,
          data: response.data
        })
        return {
          success: false,
          error: response.data.error || 'Call failed'
        }
      }

      logger.info('[CallRelayService] Call initiated successfully', {
        callSid: response.data.callSid,
        reqId: response.data.reqId
      })

      return response.data
    } catch (error: any) {
      logger.error('[CallRelayService] Failed to start call', {
        error: error.message,
        code: error.code,
        response: error.response?.data
      })
      
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
      logger.error('[CallRelayService] Failed to get transcript', {
        callSid,
        error: error.message
      })
      
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
      logger.error('[CallRelayService] Failed to get metrics', {
        error: error.message
      })
      
      return 'metrics_unavailable 1'
    }
  }
}

// Export singleton instance
export const callRelayService = CallRelayService.getInstance()

// Also export the class for testing
export { CallRelayService }