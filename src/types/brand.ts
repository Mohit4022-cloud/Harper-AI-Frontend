// Branded types for domain safety
export type UserId = string & { readonly brand: unique symbol }
export type ContactId = string & { readonly brand: unique symbol }
export type CallId = string & { readonly brand: unique symbol }
export type TeamId = string & { readonly brand: unique symbol }
export type OrganizationId = string & { readonly brand: unique symbol }
export type EmailId = string & { readonly brand: unique symbol }
export type TaskId = string & { readonly brand: unique symbol }

// Type guards
export const isUserId = (id: string): id is UserId => !!id && id.length > 0
export const isContactId = (id: string): id is ContactId => !!id && id.length > 0
export const isCallId = (id: string): id is CallId => !!id && id.length > 0

// API route type safety
export type APIRoute<T extends string> = `/api/${T}`
export type ContactRoutes = APIRoute<'contacts' | 'contacts/search' | 'contacts/bulk' | 'contacts/export' | 'contacts/import'>
export type CallRoutes = APIRoute<'calls' | 'calls/start' | 'calls/end' | 'calls/transcript'>
export type EmailRoutes = APIRoute<'emails' | 'emails/send' | 'emails/personalize' | 'emails/track'>

// Event system types
export interface EventMap {
  // Contact events
  'contact:created': { contactId: ContactId; userId: UserId; timestamp: Date }
  'contact:updated': { contactId: ContactId; changes: Partial<Contact>; userId: UserId }
  'contact:deleted': { contactId: ContactId; userId: UserId }
  'contact:imported': { count: number; userId: UserId }
  
  // Call events
  'call:started': { callId: CallId; contactId: ContactId; userId: UserId }
  'call:ended': { callId: CallId; duration: number; transcript?: string; sentiment?: number }
  'call:transcription': { callId: CallId; text: string; speaker: 'agent' | 'contact' }
  'call:failed': { callId: CallId; error: string }
  
  // AI events
  'ai:response': { callId: CallId; message: string; sentiment: number; intent?: string }
  'ai:suggestion': { callId: CallId; suggestion: string; confidence: number }
  'ai:coaching': { userId: UserId; feedback: string; score: number }
  
  // Email events
  'email:sent': { emailId: EmailId; contactId: ContactId; userId: UserId }
  'email:opened': { emailId: EmailId; contactId: ContactId; timestamp: Date }
  'email:clicked': { emailId: EmailId; contactId: ContactId; link: string }
  'email:replied': { emailId: EmailId; contactId: ContactId; content: string }
  
  // Real-time collaboration
  'user:active': { userId: UserId; page: string }
  'user:typing': { userId: UserId; contactId?: ContactId; field: string }
  'user:idle': { userId: UserId }
}

// Enhanced Contact type
export interface Contact {
  id: ContactId
  firstName: string
  lastName: string
  email?: string
  phone: string
  company?: string
  title?: string
  department?: string
  avatar?: string // Added for UI components
  
  // Lead information
  leadStatus: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'nurture'
  leadScore: number
  leadSource?: string
  
  // Enrichment data
  enrichmentData?: {
    linkedIn?: string
    twitter?: string
    companySize?: number
    industry?: string
    revenue?: number
    technologies?: string[]
  }
  
  // Activity tracking
  lastContactedAt?: Date
  totalCalls: number
  totalEmails: number
  sentiment?: number // -1 to 1
  interactions?: number // Total interactions count
  
  // Assignment
  assignedToId?: UserId
  teamId?: TeamId
  tags: string[]
  
  // Custom fields
  customFields: Record<string, any>
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  createdById: UserId
}