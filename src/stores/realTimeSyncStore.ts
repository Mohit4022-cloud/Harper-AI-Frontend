import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { QueryClient } from '@tanstack/react-query'
import { socketClient } from '@/lib/socket'
import { logger } from '@/lib/logger'

interface RealTimeSyncState {
  // Connection state
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastSyncTime: Date | null
  
  // Sync queues
  pendingUpdates: Map<string, any>
  syncErrors: Map<string, Error>
  
  // Subscriptions
  activeSubscriptions: Set<string>
  
  // Actions
  connect: (token?: string) => void
  disconnect: () => void
  subscribe: (channel: string) => void
  unsubscribe: (channel: string) => void
  queueUpdate: (key: string, data: any) => void
  processPendingUpdates: () => Promise<void>
  clearSyncError: (key: string) => void
}

export const useRealTimeSyncStore = create<RealTimeSyncState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      isConnected: false,
      connectionStatus: 'disconnected',
      lastSyncTime: null,
      pendingUpdates: new Map(),
      syncErrors: new Map(),
      activeSubscriptions: new Set(),

      // Connect to real-time service
      connect: (token?: string) => {
        set({ connectionStatus: 'connecting' })
        
        const socket = socketClient.connect(token)
        
        // Set up event handlers
        socket.on('connect', () => {
          set({ 
            isConnected: true, 
            connectionStatus: 'connected',
            lastSyncTime: new Date()
          })
          
          // Re-subscribe to active channels
          const { activeSubscriptions } = get()
          activeSubscriptions.forEach(channel => {
            socketClient.emit('subscribe:' + channel as any)
          })
          
          // Process any pending updates
          get().processPendingUpdates()
        })

        socket.on('disconnect', () => {
          set({ 
            isConnected: false, 
            connectionStatus: 'disconnected' 
          })
        })

        socket.on('error', (error) => {
          logger.error('Real-time sync error', { error })
          set({ connectionStatus: 'error' })
        })

        // Set up data sync handlers
        socket.on('contact:created', (contact) => {
          get().invalidateQueries(['contacts'])
          get().updateLocalCache('contact', contact.id, contact)
        })

        socket.on('contact:updated', (contact) => {
          get().invalidateQueries(['contacts', contact.id])
          get().updateLocalCache('contact', contact.id, contact)
        })

        socket.on('contact:deleted', (contactId) => {
          get().invalidateQueries(['contacts'])
          get().removeFromLocalCache('contact', contactId)
        })

        socket.on('call:started', (call) => {
          get().invalidateQueries(['calls'])
          get().updateLocalCache('call', call.id, call)
        })

        socket.on('call:ended', (call) => {
          get().invalidateQueries(['calls', call.id])
          get().updateLocalCache('call', call.id, call)
        })

        socket.on('metrics:updated', (metrics) => {
          get().invalidateQueries(['metrics'])
          get().updateLocalCache('metrics', 'dashboard', metrics)
        })
      },

      // Disconnect from real-time service
      disconnect: () => {
        socketClient.disconnect()
        set({ 
          isConnected: false, 
          connectionStatus: 'disconnected',
          activeSubscriptions: new Set()
        })
      },

      // Subscribe to a channel
      subscribe: (channel: string) => {
        const { activeSubscriptions, isConnected } = get()
        
        if (!activeSubscriptions.has(channel)) {
          set(state => ({
            activeSubscriptions: new Set([...state.activeSubscriptions, channel])
          }))
          
          if (isConnected) {
            socketClient.emit(`subscribe:${channel}` as any)
          }
        }
      },

      // Unsubscribe from a channel
      unsubscribe: (channel: string) => {
        set(state => {
          const newSubscriptions = new Set(state.activeSubscriptions)
          newSubscriptions.delete(channel)
          return { activeSubscriptions: newSubscriptions }
        })
        
        if (get().isConnected) {
          socketClient.emit('unsubscribe:all')
        }
      },

      // Queue an update for syncing
      queueUpdate: (key: string, data: any) => {
        set(state => {
          const updates = new Map(state.pendingUpdates)
          updates.set(key, data)
          return { pendingUpdates: updates }
        })
        
        // Try to process immediately if connected
        if (get().isConnected) {
          get().processPendingUpdates()
        }
      },

      // Process all pending updates
      processPendingUpdates: async () => {
        const { pendingUpdates, isConnected } = get()
        
        if (!isConnected || pendingUpdates.size === 0) return
        
        const updates = Array.from(pendingUpdates.entries())
        const errors = new Map<string, Error>()
        
        for (const [key, data] of updates) {
          try {
            // Send update through socket
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('Sync timeout')), 5000)
              
              socketClient.emit('sync:update', { key, data })
              socketClient.on('sync:acknowledged', (ackKey: string) => {
                if (ackKey === key) {
                  clearTimeout(timeout)
                  resolve(true)
                }
              })
            })
            
            // Remove from pending if successful
            set(state => {
              const updates = new Map(state.pendingUpdates)
              updates.delete(key)
              return { pendingUpdates: updates }
            })
          } catch (error) {
            logger.error('Failed to sync update', { key, error })
            errors.set(key, error as Error)
          }
        }
        
        if (errors.size > 0) {
          set(state => ({
            syncErrors: new Map([...state.syncErrors, ...errors])
          }))
        }
        
        set({ lastSyncTime: new Date() })
      },

      // Clear a sync error
      clearSyncError: (key: string) => {
        set(state => {
          const errors = new Map(state.syncErrors)
          errors.delete(key)
          return { syncErrors: errors }
        })
      },

      // Helper methods (not exposed in state)
      invalidateQueries: (queryKey: string[]) => {
        if (typeof window !== 'undefined' && window.queryClient) {
          window.queryClient.invalidateQueries({ queryKey })
        }
      },

      updateLocalCache: (type: string, id: string, data: any) => {
        if (typeof window !== 'undefined' && window.queryClient) {
          const queryKey = [type + 's', id]
          window.queryClient.setQueryData(queryKey, data)
        }
      },

      removeFromLocalCache: (type: string, id: string) => {
        if (typeof window !== 'undefined' && window.queryClient) {
          const queryKey = [type + 's', id]
          window.queryClient.removeQueries({ queryKey })
        }
      },
    })),
    {
      name: 'real-time-sync',
    }
  )
)

// Auto-connect on store creation if token exists
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('auth_token')
  if (token) {
    useRealTimeSyncStore.getState().connect(token)
  }
}

// Subscribe to auth changes
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'auth_token') {
      if (e.newValue) {
        useRealTimeSyncStore.getState().connect(e.newValue)
      } else {
        useRealTimeSyncStore.getState().disconnect()
      }
    }
  })
}

// Extend window interface
declare global {
  interface Window {
    queryClient: QueryClient
  }
}