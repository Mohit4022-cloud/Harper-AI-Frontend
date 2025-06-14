import { faker } from '@faker-js/faker'

export interface Contact {
  id: string
  name: string
  company: string
  title: string
  phone: string
  email: string
  industry: string
  lastCalled?: Date
  callStatus?: 'queued' | 'ringing' | 'connected' | 'failed' | 'completed'
  callDuration?: number
  notes?: string
}

// Generate 100 mock contacts
export const mockContacts: Contact[] = Array.from({ length: 100 }, (_, i) => ({
  id: `${i + 1}`,
  name: faker.person.fullName(),
  company: faker.company.name(),
  title: faker.person.jobTitle(),
  phone: faker.phone.number({ style: 'international' }),
  email: faker.internet.email(),
  industry: faker.commerce.department(),
  lastCalled: i % 3 === 0 ? faker.date.recent({ days: 30 }) : undefined,
  callStatus: i % 3 === 0 ? faker.helpers.arrayElement(['completed', 'failed']) : undefined,
  callDuration: i % 3 === 0 ? faker.number.int({ min: 30, max: 600 }) : undefined,
  notes: i % 3 === 0 ? faker.lorem.sentence() : undefined,
}))

// Helper function to format phone numbers
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }
  return cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`
}

// Validate E.164 format
export function isValidE164(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/
  return e164Regex.test(phone)
}

// Mock transcript generator for development
export function generateMockTranscript(duration: number): string[] {
  const transcripts = [
    "AI: Hello, this is Harper AI calling regarding your recent inquiry about our sales automation platform.",
    "Prospect: Oh hi, yes I was interested in learning more.",
    "AI: Great! I understand you're looking to streamline your sales development process. Could you tell me about your current team size?",
    "Prospect: We have about 5 SDRs right now.",
    "AI: Perfect. Many teams your size see a 40% increase in qualified meetings using our platform. Would you be interested in a 15-minute demo?",
    "Prospect: Sure, that sounds interesting.",
    "AI: Excellent! I'll have our solutions team reach out to schedule that. Is tomorrow afternoon available?",
    "Prospect: Yes, that works.",
    "AI: Wonderful! You'll receive a calendar invite shortly. Thank you for your time!",
  ]
  
  // Return a portion based on duration
  const numLines = Math.min(transcripts.length, Math.floor(duration / 10))
  return transcripts.slice(0, numLines)
}