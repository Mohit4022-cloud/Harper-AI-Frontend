// Branded types for domain safety
export type UserId = string & { readonly brand: unique symbol }
export type ContactId = string & { readonly brand: unique symbol }
export type CallId = string & { readonly brand: unique symbol }
export type TeamId = string & { readonly brand: unique symbol }

// API route type safety
export type APIRoute<T extends string> = `/api/${T}`
export type ContactRoutes = APIRoute<'contacts' | 'contacts/search' | 'contacts/bulk'>
export type CallRoutes = APIRoute<'call/start' | 'call/terminate' | 'call/status'>

// Event system types for real-time synchronization
export interface EventMap {
  'contact:created': { contactId: ContactId; userId: UserId; contact: Contact }
  'contact:updated': { contactId: ContactId; userId: UserId; updates: Partial<Contact> }
  'contact:deleted': { contactId: ContactId; userId: UserId }
  'call:started': { callId: CallId; contactId: ContactId; userId: UserId }
  'call:ended': { callId: CallId; duration: number; transcript?: string; userId: UserId }
  'call:status': { callId: CallId; status: CallStatus; userId: UserId }
  'ai:response': { callId: CallId; message: string; sentiment: number; timestamp: Date }
  'metrics:updated': { metrics: RealtimeMetrics; timestamp: Date }
  'user:activity': { userId: UserId; action: string; metadata: Record<string, any> }
}

// Contact types
export interface Contact {
  id: ContactId
  firstName: string
  lastName: string
  email?: string
  phone: string
  company?: string
  title?: string
  tags: string[]
  leadScore: number
  status: ContactStatus
  lastContactedAt?: Date
  sentiment?: number
  avatar?: string
  customFields: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export type ContactStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'disqualified'

export interface ContactFilters {
  search?: string
  status?: ContactStatus[]
  leadScoreMin?: number
  leadScoreMax?: number
  tags?: string[]
  company?: string[]
  lastContactedWithin?: number // days
  sentimentMin?: number
  sentimentMax?: number
}

// Call types
export interface Call {
  id: CallId
  contactId: ContactId
  userId: UserId
  contact?: Contact
  startTime: Date
  endTime?: Date
  duration?: number
  status: CallStatus
  transcript?: TranscriptEntry[]
  sentiment?: number
  outcome?: CallOutcome
  notes?: string
  isMuted?: boolean
  isOnHold?: boolean
}

export type CallStatus = 'initiated' | 'ringing' | 'connected' | 'ended' | 'failed'
export type CallOutcome = 'answered' | 'voicemail' | 'busy' | 'no_answer' | 'failed'

export interface TranscriptEntry {
  speaker: 'user' | 'contact' | 'ai'
  text: string
  timestamp: Date
  sentiment?: number
  confidence?: number
}

// Metrics types
export interface RealtimeMetrics {
  activeCalls: number
  contactsReached: number
  totalCalls: number
  averageCallDuration: number
  sentimentAverage: number
  conversionRate: number
  activeUsers: number
  timestamp: Date
  callsToday: number
  callsThisHour: number
  successfulCalls: number
  failedCalls: number
}

// UI State types
export interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  activeView: string
  selectedContactIds: Set<ContactId>
  searchQuery: string
  filters: ContactFilters
  sortBy: string
  sortOrder: 'asc' | 'desc'
}