import { StateCreator } from 'zustand'
import { UserId } from '@/types/brand'

export interface RealtimeSlice {
  // Connection state
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastSyncTime: Date | null
  reconnectAttempts: number
  
  // Active users
  activeUsers: Set<UserId>
  
  // Sync queue
  pendingOperations: Array<{
    id: string
    type: 'create' | 'update' | 'delete'
    resource: 'contact' | 'call' | 'note'
    data: any
    timestamp: Date
    retries: number
  }>
  
  // Actions
  setConnectionStatus: (status: RealtimeSlice['connectionStatus']) => void
  setConnected: (connected: boolean) => void
  updateLastSyncTime: () => void
  incrementReconnectAttempts: () => void
  resetReconnectAttempts: () => void
  
  // User presence
  addActiveUser: (userId: UserId) => void
  removeActiveUser: (userId: UserId) => void
  setActiveUsers: (userIds: UserId[]) => void
  
  // Operation queue
  queueOperation: (operation: Omit<RealtimeSlice['pendingOperations'][0], 'id' | 'timestamp' | 'retries'>) => void
  removeOperation: (id: string) => void
  incrementOperationRetries: (id: string) => void
  clearOperationQueue: () => void
  
  // Computed
  hasUnsyncedChanges: () => boolean
  getOldestPendingOperation: () => RealtimeSlice['pendingOperations'][0] | undefined
}

export const createRealtimeSlice: StateCreator<RealtimeSlice, [], [], RealtimeSlice> = (set, get) => ({
  // Initial state
  isConnected: false,
  connectionStatus: 'disconnected',
  lastSyncTime: null,
  reconnectAttempts: 0,
  activeUsers: new Set(),
  pendingOperations: [],
  
  // Actions
  setConnectionStatus: (status) => set((state) => {
    state.connectionStatus = status
    state.isConnected = status === 'connected'
  }),
  
  setConnected: (connected) => set((state) => {
    state.isConnected = connected
    state.connectionStatus = connected ? 'connected' : 'disconnected'
  }),
  
  updateLastSyncTime: () => set((state) => {
    state.lastSyncTime = new Date()
  }),
  
  incrementReconnectAttempts: () => set((state) => {
    state.reconnectAttempts += 1
  }),
  
  resetReconnectAttempts: () => set((state) => {
    state.reconnectAttempts = 0
  }),
  
  addActiveUser: (userId) => set((state) => {
    state.activeUsers.add(userId)
  }),
  
  removeActiveUser: (userId) => set((state) => {
    state.activeUsers.delete(userId)
  }),
  
  setActiveUsers: (userIds) => set((state) => {
    state.activeUsers = new Set(userIds)
  }),
  
  queueOperation: (operation) => set((state) => {
    state.pendingOperations.push({
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retries: 0,
    })
  }),
  
  removeOperation: (id) => set((state) => {
    state.pendingOperations = state.pendingOperations.filter(op => op.id !== id)
  }),
  
  incrementOperationRetries: (id) => set((state) => {
    const operation = state.pendingOperations.find(op => op.id === id)
    if (operation) {
      operation.retries += 1
    }
  }),
  
  clearOperationQueue: () => set((state) => {
    state.pendingOperations = []
  }),
  
  // Computed
  hasUnsyncedChanges: () => {
    return get().pendingOperations.length > 0
  },
  
  getOldestPendingOperation: () => {
    const operations = get().pendingOperations
    return operations.length > 0 ? operations[0] : undefined
  },
})