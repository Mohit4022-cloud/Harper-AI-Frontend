/**
 * Twilio Configuration
 * 
 * Central configuration for all Twilio-related settings.
 * Validates environment variables and provides typed configuration.
 */

import { z } from 'zod';

// Zod schema for Twilio configuration validation
const twilioConfigSchema = z.object({
  accountSid: z.string().min(34).startsWith('AC'),
  authToken: z.string().min(32),
  apiKey: z.string().min(34).startsWith('SK'),
  apiSecret: z.string().min(32),
  twimlAppSid: z.string().min(34).startsWith('AP'),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid E.164 phone number format'),
  callerNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid E.164 phone number format').optional(),
  isEnabled: z.boolean(),
  isDevelopment: z.boolean(),
});

export type TwilioConfig = z.infer<typeof twilioConfigSchema>;

/**
 * Get Twilio configuration from environment variables
 */
export function getTwilioConfig(): TwilioConfig | null {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isEnabled = process.env.ENABLE_TWILIO_CALLING === 'true';

  // Return null if Twilio is disabled
  if (!isEnabled) {
    console.log('[Twilio] Calling feature is disabled');
    return null;
  }

  // In development, allow mock configuration
  if (isDevelopment && !process.env.TWILIO_ACCOUNT_SID) {
    console.log('[Twilio] Running in development mode with mock configuration');
    return {
      accountSid: 'ACmock_development_account_sid_12345678',
      authToken: 'mock_auth_token_for_development_only',
      apiKey: 'SKmock_api_key_for_development_12345678',
      apiSecret: 'mock_api_secret_for_development_only',
      twimlAppSid: 'APmock_twiml_app_sid_for_development',
      phoneNumber: '+15555551234',
      callerNumber: '+15555551234',
      isEnabled: true,
      isDevelopment: true,
    };
  }

  // Production configuration requires all environment variables
  const config = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    apiKey: process.env.TWILIO_API_KEY || '',
    apiSecret: process.env.TWILIO_API_SECRET || '',
    twimlAppSid: process.env.TWILIO_TWIML_APP_SID || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '',
    callerNumber: process.env.TWILIO_CALLER_NUMBER || process.env.TWILIO_PHONE_NUMBER || '',
    isEnabled,
    isDevelopment,
  };

  // Validate configuration
  try {
    return twilioConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Twilio] Configuration validation failed:', error.errors);
      if (!isDevelopment) {
        throw new Error('Invalid Twilio configuration. Please check environment variables.');
      }
    }
    return null;
  }
}

/**
 * Check if Twilio is properly configured
 */
export function isTwilioConfigured(): boolean {
  const config = getTwilioConfig();
  return config !== null && config.isEnabled;
}

/**
 * Get public Twilio configuration (safe for client-side)
 */
export function getPublicTwilioConfig() {
  const config = getTwilioConfig();
  if (!config) return null;

  return {
    phoneNumber: config.phoneNumber,
    callerNumber: config.callerNumber,
    isEnabled: config.isEnabled,
    isDevelopment: config.isDevelopment,
  };
}

/**
 * Twilio webhook configuration
 */
export const TWILIO_WEBHOOK_PATHS = {
  voice: '/api/twilio/voice',
  status: '/api/twilio/status',
  recording: '/api/twilio/recording',
  transcription: '/api/twilio/transcription',
} as const;

/**
 * Twilio call status values
 */
export const TWILIO_CALL_STATUS = {
  QUEUED: 'queued',
  RINGING: 'ringing',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  BUSY: 'busy',
  FAILED: 'failed',
  NO_ANSWER: 'no-answer',
  CANCELED: 'canceled',
} as const;

export type TwilioCallStatus = typeof TWILIO_CALL_STATUS[keyof typeof TWILIO_CALL_STATUS];

/**
 * Twilio recording status values
 */
export const TWILIO_RECORDING_STATUS = {
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type TwilioRecordingStatus = typeof TWILIO_RECORDING_STATUS[keyof typeof TWILIO_RECORDING_STATUS];

/**
 * Default Twilio voice settings
 */
export const TWILIO_VOICE_SETTINGS = {
  voice: 'alice',
  language: 'en-US',
  loop: 1,
} as const;

/**
 * Twilio error codes that should trigger retry
 */
export const TWILIO_RETRY_ERROR_CODES = [
  20429, // Too Many Requests
  20503, // Service Unavailable
  20504, // Gateway Timeout
] as const;