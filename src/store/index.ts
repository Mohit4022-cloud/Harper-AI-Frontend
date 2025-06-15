import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createContactSlice, ContactSlice } from './slices/contact'
import { createCallSlice, CallSlice } from './slices/call'
import { createUISlice, UISlice } from './slices/ui'
import { createRealtimeSlice, RealtimeSlice } from './slices/realtime'
import { createMetricsSlice, MetricsSlice } from './slices/metrics'
import type { Contact, Call, RealtimeMetrics } from '@/types/brand'

export interface AppState extends ContactSlice, CallSlice, UISlice, RealtimeSlice, MetricsSlice {}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((...args) => ({
          ...createContactSlice(...args),
          ...createCallSlice(...args),
          ...createUISlice(...args),
          ...createRealtimeSlice(...args),
          ...createMetricsSlice(...args),
        }))
      ),
      {
        name: 'harper-ai-storage',
        partialize: (state) => ({
          // Only persist UI preferences and user settings
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
        }),
        version: 1,
      }
    ),
    {
      name: 'HarperAI Store',
    }
  )
)

// Store subscriptions for real-time sync
export const subscribeToContactChanges = (callback: (contacts: Contact[]) => void) => {
  return useAppStore.subscribe(
    (state) => state.contacts,
    callback,
    {
      equalityFn: (a, b) => a.length === b.length && a.every((contact, i) => contact.id === b[i]?.id)
    }
  )
}

export const subscribeToActiveCall = (callback: (call: Call | null) => void) => {
  return useAppStore.subscribe(
    (state) => state.activeCall,
    callback
  )
}

export const subscribeToMetrics = (callback: (metrics: RealtimeMetrics) => void) => {
  return useAppStore.subscribe(
    (state) => state.metrics,
    callback
  )
}