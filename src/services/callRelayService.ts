/**
 * Call Relay Service
 * Wrapper for productiv-ai-relay functionality
 */

import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import axios from 'axios'

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
   * Start the relay server process
   */
  async start(config: CallRelayConfig): Promise<void> {
    if (this.isRunning) {
      console.log('Call relay service is already running')
      return
    }

    this.config = config
    const relayPath = path.join(process.cwd(), 'src/lib/productiv-ai-relay')
    const port = config.relayPort || 8000
    this.relayUrl = `http://localhost:${port}`

    // Set up environment variables for the relay process
    const env = {
      ...process.env,
      ELEVENLABS_AGENT_ID: config.elevenLabsAgentId,
      ELEVENLABS_API_KEY: config.elevenLabsApiKey,
      TWILIO_ACCOUNT_SID: config.twilioAccountSid,
      TWILIO_AUTH_TOKEN: config.twilioAuthToken,
      TWILIO_PHONE_NUMBER: config.twilioPhoneNumber,
      PORT: port.toString(),
    }

    return new Promise((resolve, reject) => {
      this.relayProcess = spawn('node', ['index.js'], {
        cwd: relayPath,
        env,
        stdio: ['inherit', 'pipe', 'pipe'],
      })

      this.relayProcess.stdout?.on('data', (data) => {
        const output = data.toString()
        console.log('[Relay]:', output)
        
        // Check if server is ready
        if (output.includes('Server listening on')) {
          this.isRunning = true
          resolve()
        }
      })

      this.relayProcess.stderr?.on('data', (data) => {
        console.error('[Relay Error]:', data.toString())
      })

      this.relayProcess.on('error', (error) => {
        console.error('Failed to start relay process:', error)
        this.isRunning = false
        reject(error)
      })

      this.relayProcess.on('exit', (code) => {
        console.log(`Relay process exited with code ${code}`)
        this.isRunning = false
      })

      // Timeout if server doesn't start within 10 seconds
      setTimeout(() => {
        if (!this.isRunning) {
          this.stop()
          reject(new Error('Relay server failed to start within timeout'))
        }
      }, 10000)
    })
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