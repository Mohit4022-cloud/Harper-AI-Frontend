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
  setTheme: (theme) => set((state) => {
    state.theme = theme
  }),
  
  toggleSidebar: () => set((state) => {
    state.sidebarCollapsed = !state.sidebarCollapsed
  }),
  
  setSidebarCollapsed: (collapsed) => set((state) => {
    state.sidebarCollapsed = collapsed
  }),
  
  setActiveView: (view) => set((state) => {
    state.activeView = view
  }),
  
  openModal: (modal, data) => set((state) => {
    if (modal === 'contactDetail' && data) {
      state.modals.contactDetail = data as ContactId
    } else if (modal !== 'contactDetail') {
      state.modals[modal] = true
    }
  }),
  
  closeModal: (modal) => set((state) => {
    if (modal === 'contactDetail') {
      state.modals.contactDetail = null
    } else {
      state.modals[modal] = false
    }
  }),
  
  addNotification: (notification) => set((state) => {
    state.notifications.push({
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    })
    
    // Keep only last 10 notifications
    if (state.notifications.length > 10) {
      state.notifications = state.notifications.slice(-10)
    }
  }),
  
  removeNotification: (id) => set((state) => {
    state.notifications = state.notifications.filter(n => n.id !== id)
  }),
  
  clearNotifications: () => set((state) => {
    state.notifications = []
  }),
})