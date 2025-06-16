import { StateCreator } from 'zustand'
import { ContactId } from '@/types/brand'

export interface UISlice {
  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  
  // View state
  activeView: string
  setActiveView: (view: string) => void
  
  // Modals
  modals: {
    createContact: boolean
    importContacts: boolean
    contactDetail: ContactId | null
    testCall: boolean
    settings: boolean
  }
  openModal: (modal: keyof UISlice['modals'], data?: any) => void
  closeModal: (modal: keyof UISlice['modals']) => void
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    timestamp: Date
  }>
  addNotification: (notification: Omit<UISlice['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  // Initial state
  theme: 'system',
  sidebarCollapsed: false,
  activeView: 'dashboard',
  modals: {
    createContact: false,
    importContacts: false,
    contactDetail: null,
    testCall: false,
    settings: false,
  },
  notifications: [],
  
  // Actions
  setTheme: (theme) => set((state) => ({
    ...state,
    theme
  })),
  
  toggleSidebar: () => set((state) => ({
    ...state,
    sidebarCollapsed: !state.sidebarCollapsed
  })),
  
  setSidebarCollapsed: (collapsed) => set((state) => ({
    ...state,
    sidebarCollapsed: collapsed
  })),
  
  setActiveView: (view) => set((state) => ({
    ...state,
    activeView: view
  })),
  
  openModal: (modal, data) => set((state) => ({
    ...state,
    modals: {
      ...state.modals,
      ...(modal === 'contactDetail' && data
        ? { contactDetail: data as ContactId }
        : modal !== 'contactDetail'
        ? { [modal]: true }
        : {})
    }
  })),
  
  closeModal: (modal) => set((state) => ({
    ...state,
    modals: {
      ...state.modals,
      ...(modal === 'contactDetail'
        ? { contactDetail: null }
        : { [modal]: false })
    }
  })),
  
  addNotification: (notification) => set((state) => {
    const newNotifications = [
      ...state.notifications,
      {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      }
    ]
    
    return {
      ...state,
      notifications: newNotifications.length > 10 ? newNotifications.slice(-10) : newNotifications
    }
  }),
  
  removeNotification: (id) => set((state) => ({
    ...state,
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  clearNotifications: () => set((state) => ({
    ...state,
    notifications: []
  })),
})