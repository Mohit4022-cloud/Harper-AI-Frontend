import { QueryClient } from '@tanstack/react-query'
import { ContactId, CallId, ContactFilters } from '@/types/brand'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false
        return failureCount < 3
      },
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error)
      },
    },
  },
})

// Query key factories for consistent caching
export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (filters: ContactFilters) => [...contactKeys.lists(), { filters }] as const,
  infinite: (filters: ContactFilters) => [...contactKeys.lists(), 'infinite', { filters }] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: ContactId) => [...contactKeys.details(), id] as const,
  search: (query: string) => [...contactKeys.all, 'search', query] as const,
  stats: () => [...contactKeys.all, 'stats'] as const,
  export: (filters: ContactFilters) => [...contactKeys.all, 'export', { filters }] as const,
}

export const callKeys = {
  all: ['calls'] as const,
  active: () => [...callKeys.all, 'active'] as const,
  history: (contactId?: ContactId) => [...callKeys.all, 'history', { contactId }] as const,
  detail: (id: CallId) => [...callKeys.all, 'detail', id] as const,
  transcript: (id: CallId) => [...callKeys.all, 'transcript', id] as const,
  analytics: () => [...callKeys.all, 'analytics'] as const,
}

export const metricsKeys = {
  all: ['metrics'] as const,
  realtime: () => [...metricsKeys.all, 'realtime'] as const,
  dashboard: (timeRange: string) => [...metricsKeys.all, 'dashboard', timeRange] as const,
  performance: () => [...metricsKeys.all, 'performance'] as const,
}

export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  settings: () => [...userKeys.all, 'settings'] as const,
  team: () => [...userKeys.all, 'team'] as const,
}

// Utility functions for cache management
export const invalidateContacts = () => {
  queryClient.invalidateQueries({ queryKey: contactKeys.all })
}

export const invalidateCalls = () => {
  queryClient.invalidateQueries({ queryKey: callKeys.all })
}

export const invalidateMetrics = () => {
  queryClient.invalidateQueries({ queryKey: metricsKeys.all })
}

// Pre-fetch commonly used data
export const prefetchContactList = (filters: ContactFilters = {}) => {
  return queryClient.prefetchQuery({
    queryKey: contactKeys.list(filters),
    queryFn: () => fetch('/api/contacts/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
    }).then(res => res.json()),
  })
}

export const prefetchRealtimeMetrics = () => {
  return queryClient.prefetchQuery({
    queryKey: metricsKeys.realtime(),
    queryFn: () => fetch('/api/metrics/realtime').then(res => res.json()),
  })
}