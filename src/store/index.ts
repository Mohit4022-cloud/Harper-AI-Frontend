import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { createContactSlice, ContactSlice } from './slices/contact'
import { createCallSlice, CallSlice } from './slices/call'
import { createUISlice, UISlice } from './slices/ui'
import { createRealtimeSlice, RealtimeSlice } from './slices/realtime'

export interface AppState extends ContactSlice, CallSlice, UISlice, RealtimeSlice {}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      subscribeWithSelector((...args) => ({
        ...createContactSlice(...args),
        ...createCallSlice(...args),
        ...createUISlice(...args),
        ...createRealtimeSlice(...args),
      })),
      {
        name: 'harper-ai-v3-storage',
        partialize: (state) => ({
          // Only persist UI preferences
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          contactsViewMode: state.contactsViewMode,
          features: state.features,
        }),
      }
    ),
    {
      name: 'HarperAI V3',
    }
  )
)

// Selectors for common use cases
export const useContacts = () => useAppStore((state) => state.contacts)
export const useFilteredContacts = () => useAppStore((state) => state.getFilteredContacts())
export const useSelectedContacts = () => useAppStore((state) => state.selectedContacts)
export const useActiveCall = () => useAppStore((state) => state.activeCall)
export const useTheme = () => useAppStore((state) => state.theme)
export const useNotifications = () => useAppStore((state) => state.notifications)
export const useActiveUsers = () => useAppStore((state) => state.activeUsers)

// Subscribe to specific state changes
export const subscribeToContactChanges = (callback: (contacts: AppState['contacts']) => void) => {
  return useAppStore.subscribe(
    (state) => state.contacts,
    callback
  )
}

export const subscribeToActiveCall = (callback: (activeCall: AppState['activeCall']) => void) => {
  return useAppStore.subscribe(
    (state) => state.activeCall,
    callback
  )
}

// Actions for common workflows
export const bulkDeleteSelectedContacts = async () => {
  const { selectedContacts, deleteContacts, clearSelection, addNotification } = useAppStore.getState()
  const selectedIds = Array.from(selectedContacts)
  
  if (selectedIds.length === 0) return
  
  try {
    // Optimistic update
    deleteContacts(selectedIds)
    clearSelection()
    
    // API call would go here
    // await api.deleteContacts(selectedIds)
    
    addNotification({
      type: 'success',
      title: 'Contacts deleted',
      message: `Successfully deleted ${selectedIds.length} contacts`,
    })
  } catch (error) {
    // Rollback would happen here
    addNotification({
      type: 'error',
      title: 'Delete failed',
      message: 'Failed to delete contacts. Please try again.',
    })
  }
}

export const startCallWithContact = async (contactId: string) => {
  const { startCall, setCallStatus, addNotification } = useAppStore.getState()
  
  try {
    startCall(contactId as any) // Type assertion for demo
    
    // Simulate connection
    setTimeout(() => {
      setCallStatus('connected')
    }, 2000)
    
  } catch (error) {
    addNotification({
      type: 'error',
      title: 'Call failed',
      message: 'Failed to start call. Please check your connection.',
    })
  }
}