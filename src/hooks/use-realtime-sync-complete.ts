import { useEffect, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store'
import { wsManager } from '@/lib/websocket'
import { contactKeys, callKeys, metricsKeys } from '@/lib/query-client'
import { Contact, Call, RealtimeMetrics } from '@/types/brand'

export function useRealtimeSync() {
  const queryClient = useQueryClient()
  const { 
    addContact, 
    updateContact, 
    deleteContact,
    setActiveCall,
    addToHistory,
    setMetrics,
  } = useAppStore()
  
  const handleContactSync = useCallback((data: any) => {
    switch (data.type) {
      case 'created':
        // Update Zustand store
        addContact(data.contact)
        
        // Update React Query cache
        queryClient.setQueryData(contactKeys.detail(data.contact.id), data.contact)
        
        // Invalidate contact lists to trigger refetch
        queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
        
        // Update infinite query cache
        queryClient.setQueryData(contactKeys.infinite({}), (old: any) => {
          if (!old) return old
          
          return {
            ...old,
            pages: old.pages.map((page: any, index: number) => 
              index === 0 
                ? { ...page, contacts: [data.contact, ...page.contacts] }
                : page
            )
          }
        })
        break
        
      case 'updated':
        // Update Zustand store
        updateContact(data.contactId, data.updates)
        
        // Update React Query cache
        queryClient.setQueryData(contactKeys.detail(data.contactId), (old: Contact) => ({
          ...old,
          ...data.updates,
        }))
        
        // Update infinite query cache
        queryClient.setQueryData(contactKeys.infinite({}), (old: any) => {
          if (!old) return old
          
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              contacts: page.contacts.map((contact: Contact) =>
                contact.id === data.contactId 
                  ? { ...contact, ...data.updates }
                  : contact
              )
            }))
          }
        })
        break
        
      case 'deleted':
        // Update Zustand store
        deleteContact(data.contactId)
        
        // Remove from React Query cache
        queryClient.removeQueries({ queryKey: contactKeys.detail(data.contactId) })
        
        // Update infinite query cache
        queryClient.setQueryData(contactKeys.infinite({}), (old: any) => {
          if (!old) return old
          
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              contacts: page.contacts.filter((contact: Contact) => 
                contact.id !== data.contactId
              )
            }))
          }
        })
        
        // Invalidate contact lists
        queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
        break
    }
  }, [addContact, updateContact, deleteContact, queryClient])
  
  const handleCallSync = useCallback((data: any) => {
    switch (data.type) {
      case 'started':
        setActiveCall(data.call)
        queryClient.setQueryData(callKeys.active(), data.call)
        break
        
      case 'ended':
        setActiveCall(null)
        addToHistory(data.call)
        queryClient.removeQueries({ queryKey: callKeys.active() })
        queryClient.invalidateQueries({ queryKey: callKeys.history() })
        break
        
      case 'updated':
        // Update active call in both stores
        queryClient.setQueryData(callKeys.active(), (old: Call) => ({
          ...old,
          ...data.updates,
        }))
        
        const { updateActiveCall } = useAppStore.getState()
        updateActiveCall(data.updates)
        break
    }
  }, [setActiveCall, addToHistory, queryClient])
  
  const handleMetricsSync = useCallback((data: RealtimeMetrics) => {
    // Update Zustand store
    setMetrics(data)
    
    // Update React Query cache
    queryClient.setQueryData(metricsKeys.realtime(), data)
  }, [setMetrics, queryClient])
  
  useEffect(() => {
    if (!wsManager.isConnected()) return
    
    // Set up event listeners
    wsManager.socket?.on('contact:sync', handleContactSync)
    wsManager.socket?.on('call:sync', handleCallSync)
    wsManager.socket?.on('metrics:sync', handleMetricsSync)
    
    // Cleanup
    return () => {
      wsManager.socket?.off('contact:sync', handleContactSync)
      wsManager.socket?.off('call:sync', handleCallSync)
      wsManager.socket?.off('metrics:sync', handleMetricsSync)
    }
  }, [handleContactSync, handleCallSync, handleMetricsSync])
  
  return {
    isConnected: wsManager.isConnected(),
    connectionState: wsManager.getConnectionState(),
  }
}

// Hook for syncing specific data types
export function useContactSync() {
  const queryClient = useQueryClient()
  const { contacts, addContact, updateContact, deleteContact } = useAppStore()
  
  // Sync contacts from server on mount
  useEffect(() => {
    const syncContacts = async () => {
      try {
        const response = await fetch('/api/contacts/sync')
        const { contacts: serverContacts, lastSync } = await response.json()
        
        // Compare and sync differences
        // This is a simplified version - in production, you'd want more sophisticated sync logic
        serverContacts.forEach((serverContact: Contact) => {
          const localContact = contacts.find(c => c.id === serverContact.id)
          
          if (!localContact) {
            addContact(serverContact)
          } else if (serverContact.updatedAt > localContact.updatedAt) {
            updateContact(serverContact.id, serverContact)
          }
        })
        
        // Store last sync timestamp
        localStorage.setItem('lastContactSync', lastSync)
      } catch (error) {
        console.error('Failed to sync contacts:', error)
      }
    }
    
    syncContacts()
  }, [contacts, addContact, updateContact])
  
  return { contacts }
}

// Hook for offline sync capabilities
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingActions, setPendingActions] = useState<any[]>([])
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Process pending actions when coming back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      const processPendingActions = async () => {
        for (const action of pendingActions) {
          try {
            await action.execute()
          } catch (error) {
            console.error('Failed to execute pending action:', error)
          }
        }
        setPendingActions([])
      }
      
      processPendingActions()
    }
  }, [isOnline, pendingActions])
  
  const queueAction = useCallback((action: any) => {
    if (isOnline) {
      action.execute()
    } else {
      setPendingActions(prev => [...prev, action])
    }
  }, [isOnline])
  
  return {
    isOnline,
    queueAction,
    pendingActions: pendingActions.length,
  }
}