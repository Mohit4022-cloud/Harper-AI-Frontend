import { z } from 'zod'

/**
 * User Settings Schema
 */
export const UserSettingsSchema = z.object({
  profile: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().optional(),
  }),
  notifications: z.object({
    callTranscripts: z.boolean(),
    emailCampaigns: z.boolean(),
    followUpReminders: z.boolean(),
  }),
  theme: z.enum(['light', 'dark', 'system']),
  integrations: z.object({
    // Twilio Configuration
    twilioAccountSid: z.string().optional().default(''),
    twilioAuthToken: z.string().optional().default(''),
    twilioCallerNumber: z.string().optional().default(''),
    twilioKey: z.string().optional().default(''), // Keep for backward compatibility
    
    // ElevenLabs Configuration
    elevenLabsKey: z.string().optional().default(''),
    elevenLabsVoiceId: z.string().optional().default('21m00Tcm4TlvDq8ikWAM'),
    elevenLabsAgentId: z.string().optional().default(''),
    elevenLabsAudioUrl: z.string().optional().default(''),
    
    // General Configuration
    webhookUrl: z.string().optional().default(''),
    baseUrl: z.string().optional().default(''),
  }),
})

export type UserSettings = z.infer<typeof UserSettingsSchema>

/**
 * Default user settings
 */
export const defaultUserSettings: UserSettings = {
  profile: {
    fullName: '',
    email: '',
    password: undefined,
  },
  notifications: {
    callTranscripts: true,
    emailCampaigns: true,
    followUpReminders: true,
  },
  theme: 'system',
  integrations: {
    // Twilio
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioCallerNumber: '',
    twilioKey: '', // Backward compatibility
    
    // ElevenLabs
    elevenLabsKey: '',
    elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM', // Default Rachel voice
    elevenLabsAgentId: '',
    elevenLabsAudioUrl: '',
    
    // General
    webhookUrl: '',
    baseUrl: '',
  },
}