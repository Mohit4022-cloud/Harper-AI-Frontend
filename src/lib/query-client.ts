import { QueryClient } from '@tanstack/react-query'
import { ContactId, UserId, CallId, EmailId } from '@/types/brand'
import { ContactFilters } from '@/store/slices/contact'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false
        return failureCount < 3
      },
      refetchInterval: false,
    },
    mutations: {
      retry: 1,
      onError: (error: any) => {
        console.error('Mutation error:', error)
      },
    },
  },
})

// Query key factories for type-safe query keys
export const queryKeys = {
  // Contacts
  contacts: {
    all: ['contacts'] as const,
    lists: () => [...queryKeys.contacts.all, 'list'] as const,
    list: (filters: ContactFilters) => [...queryKeys.contacts.lists(), { filters }] as const,
    details: () => [...queryKeys.contacts.all, 'detail'] as const,
    detail: (id: ContactId) => [...queryKeys.contacts.details(), id] as const,
    search: (query: string) => [...queryKeys.contacts.all, 'search', query] as const,
    enrichment: (id: ContactId) => [...queryKeys.contacts.detail(id), 'enrichment'] as const,
  },

  // Calls
  calls: {
    all: ['calls'] as const,
    active: () => [...queryKeys.calls.all, 'active'] as const,
    history: (contactId?: ContactId) => 
      [...queryKeys.calls.all, 'history', { contactId }] as const,
    transcript: (callId: CallId) => 
      [...queryKeys.calls.all, 'transcript', callId] as const,
    analytics: (userId?: UserId) => 
      [...queryKeys.calls.all, 'analytics', { userId }] as const,
  },

  // Emails
  emails: {
    all: ['emails'] as const,
    sent: (userId?: UserId) => [...queryKeys.emails.all, 'sent', { userId }] as const,
    templates: () => [...queryKeys.emails.all, 'templates'] as const,
    template: (id: string) => [...queryKeys.emails.templates(), id] as const,
    personalization: (contactId: ContactId) => 
      [...queryKeys.emails.all, 'personalization', contactId] as const,
    tracking: (emailId: EmailId) => 
      [...queryKeys.emails.all, 'tracking', emailId] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    performance: (dateRange?: { start: Date; end: Date }) => 
      [...queryKeys.analytics.all, 'performance', { dateRange }] as const,
    leaderboard: () => [...queryKeys.analytics.all, 'leaderboard'] as const,
    insights: (userId?: UserId) => 
      [...queryKeys.analytics.all, 'insights', { userId }] as const,
  },

  // Users & Teams
  users: {
    all: ['users'] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
    profile: (id: UserId) => [...queryKeys.users.all, 'profile', id] as const,
    preferences: () => [...queryKeys.users.all, 'preferences'] as const,
  },

  // Real-time
  realtime: {
    presence: () => ['realtime', 'presence'] as const,
    notifications: () => ['realtime', 'notifications'] as const,
  },
}

// Mutation key factories
export const mutationKeys = {
  contacts: {
    create: ['createContact'] as const,
    update: ['updateContact'] as const,
    delete: ['deleteContact'] as const,
    bulkUpdate: ['bulkUpdateContacts'] as const,
    bulkDelete: ['bulkDeleteContacts'] as const,
    import: ['importContacts'] as const,
    export: ['exportContacts'] as const,
  },
  calls: {
    start: ['startCall'] as const,
    end: ['endCall'] as const,
    updateTranscript: ['updateCallTranscript'] as const,
  },
  emails: {
    send: ['sendEmail'] as const,
    personalize: ['personalizeEmail'] as const,
    schedule: ['scheduleEmail'] as const,
  },
}

// Prefetch helpers
export const prefetchContacts = async (filters: ContactFilters) => {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.contacts.list(filters),
    queryFn: () => fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
    }).then(res => res.json()),
  })
}

export const prefetchDashboard = async () => {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.analytics.dashboard(),
    queryFn: () => fetch('/api/analytics/dashboard').then(res => res.json()),
  })
}

// Cache invalidation helpers
export const invalidateContacts = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all })
}

export const invalidateContactDetail = (id: ContactId) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.contacts.detail(id) })
}

export const invalidateCallHistory = (contactId?: ContactId) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.calls.history(contactId) })
}