import type { UserId, ContactId, CallId, TeamId } from '@/types/brand'

// Brand type constructors
export const UserId = (id: string): UserId => id as UserId
export const ContactId = (id: string): ContactId => id as ContactId
export const CallId = (id: string): CallId => id as CallId
export const TeamId = (id: string): TeamId => id as TeamId

// Type guards
export const isUserId = (value: unknown): value is UserId => 
  typeof value === 'string' && value.length > 0

export const isContactId = (value: unknown): value is ContactId => 
  typeof value === 'string' && value.length > 0

export const isCallId = (value: unknown): value is CallId => 
  typeof value === 'string' && value.length > 0

export const isTeamId = (value: unknown): value is TeamId => 
  typeof value === 'string' && value.length > 0

// Generate IDs (for new entities)
export const generateUserId = (): UserId => 
  UserId(`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

export const generateContactId = (): ContactId => 
  ContactId(`contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

export const generateCallId = (): CallId => 
  CallId(`call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

export const generateTeamId = (): TeamId => 
  TeamId(`team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)