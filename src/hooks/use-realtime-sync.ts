import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store'
import { wsManager } from '@/lib/websocket'
import { ContactId, CallId } from '@/types/brand'

interface UseRealtimeSyncOptions {
  enabled?: boolean
  syncContacts?: boolean
  syncCalls?: boolean
  syncMetrics?: boolean
}

export function useRealtimeSync(options: UseRealtimeSyncOptions = {}) {
  const {
    enabled = true,
    syncContacts = true,
    syncCalls = true,
    syncMetrics = true,
  } = options

  const queryClient = useQueryClient()
  const connectionStatus = useAppStore(state => state.connectionStatus)
  const queueOperation = useAppStore(state => state.queueOperation)
  const pendingOperations = useAppStore(state => state.pendingOperations)

  // Process pending operations when connection is restored
  useEffect(() => {
    if (connectionStatus === 'connected' && pendingOperations.length > 0) {
      processPendingOperations()
    }
  }, [connectionStatus, pendingOperations.length])

  const processPendingOperations = useCallback(async () => {
    const operations = useAppStore.getState().pendingOperations
    const removeOperation = useAppStore.getState().removeOperation
    const incrementOperationRetries = useAppStore.getState().incrementOperationRetries

    for (const operation of operations) {
      try {
        // Send operation through WebSocket
        wsManager.emit(
          `${operation.resource}:${operation.type}` as any,
          operation.data
        )
        
        // Remove successful operation
        removeOperation(operation.id)
        
        // Update last sync time
        useAppStore.getState().updateLastSyncTime()
      } catch (error) {
        console.error('Failed to process operation:', operation, error)
        incrementOperationRetries(operation.id)
        
        // Remove operation if too many retries
        if (operation.retries >= 3) {
          removeOperation(operation.id)
          useAppStore.getState().addNotification({
            type: 'error',
            title: 'Sync failed',
            message: `Failed to sync ${operation.resource} ${operation.type} operation`,
          })
        }
      }
    }
  }, [])

  // Optimistic update helper
  const optimisticUpdate = useCallback(
    async <T,>(
      operation: {
        type: 'create' | 'update' | 'delete'
        resource: 'contact' | 'call' | 'note'
        data: any
      },
      localUpdate: () => void,
      rollback: () => void
    ): Promise<T> => {
      // Apply optimistic update
      localUpdate()

      // Queue operation if offline
      if (connectionStatus !== 'connected') {
        queueOperation(operation)
        return Promise.resolve({} as T)
      }

      try {
        // Send through WebSocket
        const response = await new Promise<T>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Operation timeout'))
          }, 10000)

          wsManager.emit(
            `${operation.resource}:${operation.type}` as any,
            operation.data
          )

          // Listen for acknowledgment
          const ackEvent = `${operation.resource}:${operation.type}:ack`
          wsManager.socket?.once(ackEvent, (result: T) => {
            clearTimeout(timeout)
            resolve(result)
          })

          // Listen for error
          const errorEvent = `${operation.resource}:${operation.type}:error`
          wsManager.socket?.once(errorEvent, (error: Error) => {
            clearTimeout(timeout)
            reject(error)
          })
        })

        // Update last sync time on success
        useAppStore.getState().updateLastSyncTime()
        return response
      } catch (error) {
        // Rollback on error
        rollback()
        
        // Queue for retry
        queueOperation(operation)
        
        throw error
      }
    },
    [connectionStatus, queueOperation]
  )

  // Subscribe to real-time updates for specific entities
  const subscribeToEntity = useCallback(
    (type: 'contact' | 'call', id: ContactId | CallId) => {
      if (!enabled || connectionStatus !== 'connected') return

      wsManager.emit('subscribe:entity' as any, { type, id })

      return () => {
        wsManager.emit('unsubscribe:entity' as any, { type, id })
      }
    },
    [enabled, connectionStatus]
  )

  // Subscribe to bulk updates
  const subscribeToBulkUpdates = useCallback(
    (type: 'contacts' | 'calls' | 'metrics') => {
      if (!enabled || connectionStatus !== 'connected') return

      const shouldSubscribe = 
        (type === 'contacts' && syncContacts) ||
        (type === 'calls' && syncCalls) ||
        (type === 'metrics' && syncMetrics)

      if (shouldSubscribe) {
        wsManager.emit(`subscribe:${type}` as any, {})
      }

      return () => {
        wsManager.emit(`unsubscribe:${type}` as any, {})
      }
    },
    [enabled, connectionStatus, syncContacts, syncCalls, syncMetrics]
  )

  // Auto-subscribe to bulk updates
  useEffect(() => {
    if (!enabled || connectionStatus !== 'connected') return

    const unsubscribers: Array<() => void> = []

    if (syncContacts) {
      unsubscribers.push(subscribeToBulkUpdates('contacts') || (() => {}))
    }
    if (syncCalls) {
      unsubscribers.push(subscribeToBulkUpdates('calls') || (() => {}))
    }
    if (syncMetrics) {
      unsubscribers.push(subscribeToBulkUpdates('metrics') || (() => {}))
    }

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [enabled, connectionStatus, syncContacts, syncCalls, syncMetrics, subscribeToBulkUpdates])

  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    optimisticUpdate,
    subscribeToEntity,
    subscribeToBulkUpdates,
    processPendingOperations,
  }
}

// Hook for syncing a specific contact
export function useRealtimeContact(contactId: ContactId | null) {
  const { subscribeToEntity } = useRealtimeSync()

  useEffect(() => {
    if (!contactId) return

    return subscribeToEntity('contact', contactId)
  }, [contactId, subscribeToEntity])
}

// Hook for syncing a specific call
export function useRealtimeCall(callId: CallId | null) {
  const { subscribeToEntity } = useRealtimeSync()

  useEffect(() => {
    if (!callId) return

    return subscribeToEntity('call', callId)
  }, [callId, subscribeToEntity])
}