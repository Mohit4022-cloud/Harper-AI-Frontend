import { StateCreator } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'
export type ViewMode = 'grid' | 'list' | 'kanban'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  timestamp: Date
}

export interface UISlice {
  // Theme
  theme: Theme
  setTheme: (theme: Theme) => void
  
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  
  // View preferences
  contactsViewMode: ViewMode
  setContactsViewMode: (mode: ViewMode) => void
  
  // Modals
  modals: {
    createContact: boolean
    importContacts: boolean
    exportContacts: boolean
    aiSettings: boolean
    userProfile: boolean
  }
  openModal: (modal: keyof UISlice['modals']) => void
  closeModal: (modal: keyof UISlice['modals']) => void
  closeAllModals: () => void
  
  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Command palette
  commandPaletteOpen: boolean
  toggleCommandPalette: () => void
  
  // Loading states
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void
  
  // Feature flags
  features: {
    aiCalling: boolean
    bulkOperations: boolean
    advancedFiltering: boolean
    realtimeSync: boolean
  }
  setFeature: (feature: keyof UISlice['features'], enabled: boolean) => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  // Theme
  theme: 'system',
  setTheme: (theme) => {
    set({ theme })
    // Apply theme to document
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },
  
  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  
  // View preferences
  contactsViewMode: 'list',
  setContactsViewMode: (contactsViewMode) => set({ contactsViewMode }),
  
  // Modals
  modals: {
    createContact: false,
    importContacts: false,
    exportContacts: false,
    aiSettings: false,
    userProfile: false,
  },
  openModal: (modal) => set((state) => ({
    modals: { ...state.modals, [modal]: true }
  })),
  closeModal: (modal) => set((state) => ({
    modals: { ...state.modals, [modal]: false }
  })),
  closeAllModals: () => set((state) => ({
    modals: Object.keys(state.modals).reduce((acc, key) => ({
      ...acc,
      [key]: false
    }), {} as UISlice['modals'])
  })),
  
  // Notifications
  notifications: [],
  addNotification: (notification) => {
    const id = `notification-${Date.now()}`
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
    }
    
    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }))
    
    // Auto-remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }))
      }, notification.duration || 5000)
    }
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  clearNotifications: () => set({ notifications: [] }),
  
  // Command palette
  commandPaletteOpen: false,
  toggleCommandPalette: () => set((state) => ({ 
    commandPaletteOpen: !state.commandPaletteOpen 
  })),
  
  // Loading states
  globalLoading: false,
  setGlobalLoading: (globalLoading) => set({ globalLoading }),
  
  // Feature flags
  features: {
    aiCalling: true,
    bulkOperations: true,
    advancedFiltering: true,
    realtimeSync: true,
  },
  setFeature: (feature, enabled) => set((state) => ({
    features: { ...state.features, [feature]: enabled }
  })),
})