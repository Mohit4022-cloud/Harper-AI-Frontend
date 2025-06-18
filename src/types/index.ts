// User and Authentication Types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  organizationId: string
  teamId?: string
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  phone?: string
}

export type UserRole = 'ORG_ADMIN' | 'SALES_MANAGER' | 'TEAM_LEAD' | 'SDR' | 'ACCOUNT_EXECUTIVE'

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

// Contact and Lead Types
export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company: string
  title?: string
  industry?: string
  leadScore: number
  status: ContactStatus
  source: string
  assignedTo?: string
  tags: string[]
  notes: Note[]
  activities: Activity[]
  customFields: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export type ContactStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'

export interface Note {
  id: string
  content: string
  authorId: string
  authorName: string
  createdAt: Date
}

// Activity Types
export interface Activity {
  id: string
  type: ActivityType
  contactId: string
  userId: string
  subject: string
  description?: string
  outcome?: string
  duration?: number
  scheduledAt?: Date
  completedAt?: Date
  createdAt: Date
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note'

// Call Types
export interface Call {
  id: string
  contactId: string
  userId: string
  twilioCallSid?: string
  phoneNumber: string
  direction: 'inbound' | 'outbound'
  status: CallStatus
  duration?: number
  recordingUrl?: string
  transcription?: string
  sentiment?: CallSentiment
  startedAt: Date
  endedAt?: Date
  notes?: string
}

export type CallStatus = 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer'

export interface CallSentiment {
  overall: 'positive' | 'neutral' | 'negative'
  confidence: number
  keywords: string[]
}

// Email Types
export interface Email {
  id: string
  contactId: string
  userId: string
  subject: string
  body: string
  templateId?: string
  status: EmailStatus
  opens: number
  clicks: number
  replies: number
  sentAt?: Date
  openedAt?: Date
  clickedAt?: Date
  repliedAt?: Date
  createdAt: Date
}

export type EmailStatus = 'draft' | 'scheduled' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]
  category: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Analytics Types
export interface DashboardMetrics {
  totalCalls: number
  callsToday: number
  callConnectRate: number
  averageCallDuration: number
  emailsSent: number
  emailOpenRate: number
  emailReplyRate: number
  leadsGenerated: number
  dealsWon: number
  revenue: number
  lastUpdated: Date
}

export interface PerformanceMetrics {
  userId: string
  userName: string
  avatar?: string
  callsMade: number
  callsConnected: number
  connectRate: number
  averageCallDuration: number
  emailsSent: number
  emailReplies: number
  replyRate: number
  leadsGenerated: number
  dealsWon: number
  revenue: number
  rank: number
}

// Organization and Team Types
export interface Organization {
  id: string
  name: string
  logo?: string
  domain: string
  industry?: string
  size?: string
  settings: OrganizationSettings
  createdAt: Date
  updatedAt: Date
}

export interface OrganizationSettings {
  timezone: string
  currency: string
  workingHours: {
    start: string
    end: string
    days: number[]
  }
  features: {
    calling: boolean
    recording: boolean
    transcription: boolean
    emailTracking: boolean
    aiCoaching: boolean
  }
}

export interface Team {
  id: string
  name: string
  organizationId: string
  managerId: string
  members: User[]
  territories: Territory[]
  createdAt: Date
  updatedAt: Date
}

export interface Territory {
  id: string
  name: string
  type: 'geographic' | 'account_based' | 'industry'
  criteria: Record<string, any>
  assignedUsers: string[]
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form Types
export interface FormState {
  isLoading: boolean
  errors: Record<string, string>
  touched: Record<string, boolean>
}

// Component Props Types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// WebRTC/Twilio Types
export interface TwilioDevice {
  device: any
  isInitialized: boolean
  isConnecting: boolean
  isConnected: boolean
  activeCall: any
}

// Socket.io Types
export interface SocketEvents {
  'call:started': (call: Call) => void
  'call:ended': (callId: string) => void
  'notification': (notification: Notification) => void
  'user:activity': (activity: Activity) => void
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  userId: string
  isRead: boolean
  createdAt: Date
}