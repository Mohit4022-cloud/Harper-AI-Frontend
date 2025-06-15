/**
 * Unified Call Service
 * Intelligently routes between direct implementation (production) and HTTP relay (development)
 */

import { logger } from '@/lib/logger'
import * as callRelayDirect from './callRelayDirect'
import { callRelayService } from './callRelayService'

// Determine which implementation to use based on environment
// Note: Direct implementation requires WebSocket support which Next.js App Router doesn't provide
// For production, we need to use the HTTP relay service
const USE_DIRECT_IMPLEMENTATION = process.env.USE_DIRECT_RELAY === 'true'

export interface CallServiceConfig {
  elevenLabsAgentId: string
  elevenLabsApiKey: string
  twilioAccountSid: string
  twilioAuthToken: string
  twilioPhoneNumber: string
  baseUrl?: string
}

export interface StartCallParams {
  to: string
  from?: string
  script?: string
  persona?: string
  context?: string
}

export interface CallResult {
  success: boolean
  callSid?: string
  reqId?: string
  error?: string
  details?: string
}

class UnifiedCallService {
  private initialized = false
  private config: CallServiceConfig | null = null

  /**
   * Initialize the call service
   */
  async initialize(config: CallServiceConfig): Promise<void> {
    if (USE_DIRECT_IMPLEMENTATION) {
      logger.info('Initializing direct call implementation')
      await callRelayDirect.initializeRelay(config)
    } else {
      logger.info('Using HTTP relay implementation')
      // HTTP relay doesn't need initialization but we should check if it's available
      const isHealthy = await callRelayService.health()
      if (!isHealthy) {
        logger.warn('HTTP relay service is not available. Calls may fail.')
      }
    }
    
    this.config = config
    this.initialized = true
  }

  /**
   * Start an outbound call
   */
  async startCall(params: StartCallParams): Promise<CallResult> {
    // Auto-initialize if not already done
    if (!this.initialized && USE_DIRECT_IMPLEMENTATION) {
      const config = this.buildConfigFromEnv()
      await this.initialize(config)
    }

    if (USE_DIRECT_IMPLEMENTATION) {
      // Use direct implementation
      const result = await callRelayDirect.startAutoDial({
        to: params.to,
        from: params.from,
        script: params.script,
        persona: params.persona,
        context: params.context
      })
      
      return {
        success: result.success,
        callSid: result.callSid,
        reqId: result.reqId,
        error: result.error,
        details: result.details
      }
    } else {
      // Use HTTP relay
      const result = await callRelayService.startAutoDial({
        to: params.to,
        from: params.from,
        script: params.script,
        persona: params.persona,
        context: params.context
      })
      
      return result
    }
  }

  /**
   * Get transcript for a call
   */
  async getTranscript(callSid: string): Promise<any> {
    if (USE_DIRECT_IMPLEMENTATION) {
      return callRelayDirect.streamTranscript(callSid)
    } else {
      return callRelayService.streamTranscript(callSid)
    }
  }

  /**
   * Terminate a call
   */
  async terminateCall(callSid: string): Promise<void> {
    if (USE_DIRECT_IMPLEMENTATION) {
      await callRelayDirect.terminateCall(callSid)
    } else {
      await callRelayService.terminateCall(callSid)
    }
  }

  /**
   * Get service health status
   */
  async health(): Promise<boolean> {
    if (USE_DIRECT_IMPLEMENTATION) {
      return this.initialized
    } else {
      return callRelayService.health()
    }
  }

  /**
   * Build configuration from environment variables
   */
  private buildConfigFromEnv(): CallServiceConfig {
    const config = {
      elevenLabsAgentId: process.env.ELEVENLABS_AGENT_ID || '',
      elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
      twilioPhoneNumber: process.env.TWILIO_CALLER_NUMBER || process.env.TWILIO_PHONE_NUMBER || '',
      baseUrl: process.env.BASE_URL || process.env.NEXT_PUBLIC_API_URL
    }

    // Validate required fields
    const missing = []
    if (!config.elevenLabsAgentId) missing.push('ELEVENLABS_AGENT_ID')
    if (!config.elevenLabsApiKey) missing.push('ELEVENLABS_API_KEY')
    if (!config.twilioAccountSid) missing.push('TWILIO_ACCOUNT_SID')
    if (!config.twilioAuthToken) missing.push('TWILIO_AUTH_TOKEN')
    if (!config.twilioPhoneNumber) missing.push('TWILIO_CALLER_NUMBER or TWILIO_PHONE_NUMBER')

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }

    return config
  }
}

// Export singleton instance
export const callService = new UnifiedCallService()

// Also export types
export type { CallTranscript } from './callRelayDirect'