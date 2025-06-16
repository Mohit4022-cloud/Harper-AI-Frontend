import { StateCreator } from 'zustand'
import { UserId, ContactId } from '@/types/brand'

export interface ActiveUser {
  userId: UserId
  name: string
  avatar?: string
  currentPage: string
  lastActive: Date
  status: 'online' | 'idle' | 'offline'
}

export interface TypingIndicator {
  userId: UserId
  contactId?: ContactId
  field: string
  timestamp: Date
}

export interface RealtimeSlice {
  // Connection status
  isConnected: boolean
  reconnectAttempts: number
  lastPing: Date | null
  
  // Active users
  activeUsers: Map<UserId, ActiveUser>
  typingIndicators: Map<string, TypingIndicator> // key: userId-field
  
  // Connection management
  setConnected: (connected: boolean) => void
  incrementReconnectAttempts: () => void
  resetReconnectAttempts: () => void
  updatePing: () => void
  
  // User presence
  updateActiveUser: (user: ActiveUser) => void
  removeActiveUser: (userId: UserId) => void
  setUserStatus: (userId: UserId, status: ActiveUser['status']) => void
  
  // Typing indicators
  addTypingIndicator: (indicator: TypingIndicator) => void
  removeTypingIndicator: (userId: UserId, field: string) => void
  clearStaleTypingIndicators: () => void
  
  // Helpers
  getActiveUsersOnPage: (page: string) => ActiveUser[]
  isUserTyping: (userId: UserId, field: string) => boolean
}

export const createRealtimeSlice: StateCreator<RealtimeSlice> = (set, get) => ({
  // Initial state
  isConnected: false,
  reconnectAttempts: 0,
  lastPing: null,
  activeUsers: new Map(),
  typingIndicators: new Map(),

  // Connection management
  setConnected: (isConnected) => set({ 
    isConnected,
    reconnectAttempts: isConnected ? 0 : get().reconnectAttempts 
  }),
  
  incrementReconnectAttempts: () => set((state) => ({
    reconnectAttempts: state.reconnectAttempts + 1
  })),
  
  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
  
  updatePing: () => set({ lastPing: new Date() }),

  // User presence
  updateActiveUser: (user) => set((state) => {
    const newActiveUsers = new Map(state.activeUsers)
    newActiveUsers.set(user.userId, user)
    return { activeUsers: newActiveUsers }
  }),
  
  removeActiveUser: (userId) => set((state) => {
    const newActiveUsers = new Map(state.activeUsers)
    newActiveUsers.delete(userId)
    
    // Also remove their typing indicators
    const newTypingIndicators = new Map(state.typingIndicators)
    for (const [key, indicator] of newTypingIndicators) {
      if (indicator.userId === userId) {
        newTypingIndicators.delete(key)
      }
    }
    
    return { 
      activeUsers: newActiveUsers,
      typingIndicators: newTypingIndicators
    }
  }),
  
  setUserStatus: (userId, status) => set((state) => {
    const user = state.activeUsers.get(userId)
    if (!user) return state
    
    const newActiveUsers = new Map(state.activeUsers)
    newActiveUsers.set(userId, { ...user, status, lastActive: new Date() })
    return { activeUsers: newActiveUsers }
  }),

  // Typing indicators
  addTypingIndicator: (indicator) => {
    const key = `${indicator.userId}-${indicator.field}`
    set((state) => {
      const newTypingIndicators = new Map(state.typingIndicators)
      newTypingIndicators.set(key, indicator)
      return { typingIndicators: newTypingIndicators }
    })
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      get().removeTypingIndicator(indicator.userId, indicator.field)
    }, 3000)
  },
  
  removeTypingIndicator: (userId, field) => {
    const key = `${userId}-${field}`
    set((state) => {
      const newTypingIndicators = new Map(state.typingIndicators)
      newTypingIndicators.delete(key)
      return { typingIndicators: newTypingIndicators }
    })
  },
  
  clearStaleTypingIndicators: () => set((state) => {
    const now = Date.now()
    const newTypingIndicators = new Map<string, TypingIndicator>()
    
    for (const [key, indicator] of state.typingIndicators) {
      // Keep indicators less than 5 seconds old
      if (now - indicator.timestamp.getTime() < 5000) {
        newTypingIndicators.set(key, indicator)
      }
    }
    
    return { typingIndicators: newTypingIndicators }
  }),

  // Helpers
  getActiveUsersOnPage: (page) => {
    return Array.from(get().activeUsers.values())
      .filter(user => user.currentPage === page && user.status === 'online')
  },
  
  isUserTyping: (userId, field) => {
    const key = `${userId}-${field}`
    return get().typingIndicators.has(key)
  },
})