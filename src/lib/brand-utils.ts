import type { UserId as UserIdType, ContactId as ContactIdType, CallId as CallIdType, TeamId as TeamIdType } from '@/types/brand'

// Brand type constructors
export const UserId = (id: string): UserIdType => id as UserIdType
export const ContactId = (id: string): ContactIdType => id as ContactIdType
export const CallId = (id: string): CallIdType => id as CallIdType
export const TeamId = (id: string): TeamIdType => id as TeamIdType

// Type guards
export const isUserId = (value: unknown): value is UserIdType => 
  typeof value === 'string' && value.length > 0

export const isContactId = (value: unknown): value is ContactIdType => 
  typeof value === 'string' && value.length > 0

export const isCallId = (value: unknown): value is CallIdType => 
  typeof value === 'string' && value.length > 0

export const isTeamId = (value: unknown): value is TeamIdType => 
  typeof value === 'string' && value.length > 0

// Generate IDs (for new entities)
export const generateUserId = (): UserIdType => 
  UserId(`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

export const generateContactId = (): ContactIdType => 
  ContactId(`contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

export const generateCallId = (): CallIdType => 
  CallId(`call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

export const generateTeamId = (): TeamIdType => 
  TeamId(`team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)