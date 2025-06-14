/**
 * Type declarations for productiv-ai-relay module
 */

declare module '@/lib/productiv-ai-relay' {
  export interface RelayConfig {
    ELEVENLABS_AGENT_ID: string
    ELEVENLABS_API_KEY: string
    TWILIO_ACCOUNT_SID: string
    TWILIO_AUTH_TOKEN: string
    TWILIO_PHONE_NUMBER: string
    PORT?: number
  }

  export interface CallResponse {
    callSid: string
    status: string
  }

  export interface TranscriptEntry {
    role: 'user' | 'agent'
    text: string
    timestamp: string
  }

  export function startServer(config: RelayConfig): Promise<void>
  export function startAutoDial(params: { to: string; from?: string }): Promise<CallResponse>
  export function streamTranscript(callSid: string): Promise<{ transcript: TranscriptEntry[] }>
}