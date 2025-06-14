/**
 * Call Relay Service
 * Wrapper for productiv-ai-relay functionality
 */

import { ChildProcess } from 'child_process'
import axios from 'axios'
import { startRelayWithRetry, RelayConfig } from '@/lib/relayBootstrap'
import { logger } from '@/lib/logger'

export interface CallRelayConfig {
  elevenLabsAgentId: string
  elevenLabsApiKey: string
  twilioAccountSid: string
  twilioAuthToken: string
  twilioPhoneNumber: string
  relayPort?: number
}

export interface OutboundCallParams {
  to: string
  from?: string
  script?: string
  persona?: string
  context?: string
}

export interface CallTranscript {
  role: 'user' | 'agent'
  text: string
  timestamp: string
}

class CallRelayService {
  private relayProcess: ChildProcess | null = null
  private relayUrl: string
  private config: CallRelayConfig | null = null
  private isRunning: boolean = false

  constructor() {
    this.relayUrl = 'http://localhost:8000'
  }

  /**
   * Start the relay server process with retry logic
   */
  async start(config: CallRelayConfig): Promise<void> {
    if (this.isRunning) {
      logger.info('Call relay service is already running')
      return
    }

    this.config = config
    const port = config.relayPort || 8000
    this.relayUrl = `http://localhost:${port}`

    try {
      // Use the relay bootstrap with retry logic
      const relayConfig: RelayConfig = {
        elevenLabsAgentId: config.elevenLabsAgentId,
        elevenLabsApiKey: config.elevenLabsApiKey,
        twilioAccountSid: config.twilioAccountSid,
        twilioAuthToken: config.twilioAuthToken,
        twilioPhoneNumber: config.twilioPhoneNumber,
        relayPort: port,
      }

      this.relayProcess = await startRelayWithRetry(relayConfig)
      this.isRunning = true

      // Monitor process exit
      this.relayProcess.on('exit', (code) => {
        logger.warn({ code }, 'Relay process exited')
        this.isRunning = false
        this.relayProcess = null
      })
    } catch (error) {
      logger.error({ error }, 'Failed to start relay service')
      this.isRunning = false
      throw error
    }
  }

  /**
   * Stop the relay server process
   */
  stop(): void {
    if (this.relayProcess) {
      this.relayProcess.kill('SIGTERM')
      this.relayProcess = null
      this.isRunning = false
    }
  }

  /**
   * Check if relay service is running
   */
  async health(): Promise<boolean> {
    if (!this.isRunning) return false
    
    try {
      const response = await axios.get(`${this.relayUrl}/health`)
      return response.data.status === 'healthy'
    } catch {
      return false
    }
  }

  /**
   * Start an outbound call using the relay
   */
  async startAutoDial(params: OutboundCallParams): Promise<{ callSid: string }> {
    if (!this.isRunning) {
      throw new Error('Call relay service is not running')
    }

    const response = await axios.post(`${this.relayUrl}/twilio/outbound_call`, {
      to: params.to,
      from: params.from || this.config?.twilioPhoneNumber,
      script: params.script,
      persona: params.persona,
      context: params.context,
    })

    return response.data
  }

  /**
   * Get call transcript
   */
  async streamTranscript(callSid: string): Promise<{ callSid: string; transcript: CallTranscript[] }> {
    if (!this.isRunning) {
      throw new Error('Call relay service is not running')
    }

    const response = await axios.get(`${this.relayUrl}/transcripts/${callSid}`)
    return response.data
  }

  /**
   * Get relay metrics
   */
  async getMetrics(): Promise<string> {
    if (!this.isRunning) {
      throw new Error('Call relay service is not running')
    }

    const response = await axios.get(`${this.relayUrl}/metrics`)
    return response.data
  }

  /**
   * Get the WebSocket URL for media streaming
   */
  getMediaStreamUrl(): string {
    const wsUrl = this.relayUrl.replace('http://', 'ws://')
    return `${wsUrl}/twilio/stream`
  }

  /**
   * Terminate a call (using Twilio API directly)
   */
  async terminateCall(callSid: string): Promise<void> {
    if (!this.config) {
      throw new Error('Call relay service not configured')
    }

    // Use Twilio client to terminate the call
    const accountSid = this.config.twilioAccountSid
    const authToken = this.config.twilioAuthToken
    
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`,
      'Status=completed',
      {
        auth: {
          username: accountSid,
          password: authToken,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    if (response.status !== 200) {
      throw new Error(`Failed to terminate call: ${response.statusText}`)
    }
  }
}

// Singleton instance
export const callRelayService = new CallRelayService()