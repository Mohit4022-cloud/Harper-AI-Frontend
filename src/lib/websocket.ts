import { io, Socket } from 'socket.io-client'
import { EventMap, ContactId, CallId, Contact, UserId } from '@/types/brand'
import { useAppStore } from '@/store'
import { queryClient, invalidateContacts, invalidateCalls, invalidateMetrics } from './query-client'

interface ServerToClientEvents {
  'contact:created': (data: EventMap['contact:created']) => void
  'contact:updated': (data: EventMap['contact:updated']) => void
  'contact:deleted': (data: EventMap['contact:deleted']) => void
  'call:started': (data: EventMap['call:started']) => void
  'call:ended': (data: EventMap['call:ended']) => void
  'call:status': (data: EventMap['call:status']) => void
  'ai:response': (data: EventMap['ai:response']) => void
  'metrics:updated': (data: EventMap['metrics:updated']) => void
  'user:activity': (data: EventMap['user:activity']) => void
}

interface ClientToServerEvents {
  'join:user': (userId: string) => void
  'join:team': (userId: string) => void
  'join:global': () => void
  'subscribe:entity': (data: { type: string; id: string }) => void
  'unsubscribe:entity': (data: { type: string; id: string }) => void
}

class WebSocketManager {
  public socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private userId: string | null = null
  
  connect(token: string, userId: string) {
    if (this.socket?.connected) return
    
    this.userId = userId
    
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    })
    
    this.setupEventHandlers()
  }
  
  private setupEventHandlers() {
    if (!this.socket) return
    
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected')
      this.reconnectAttempts = 0
      this.subscribeToChannels()
      
      // Update connection status in store
      useAppStore.getState().setConnectionStatus('connected')
    })
    
    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason)
      useAppStore.getState().setConnectionStatus('disconnected')
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, attempt reconnect
        this.attemptReconnect()
      }
    })
    
    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error)
      useAppStore.getState().setConnectionStatus('error')
      this.attemptReconnect()
    })
    
    // Contact events
    this.socket.on('contact:created', (data: EventMap['contact:created']) => {
      this.handleContactCreated(data)
    })
    
    this.socket.on('contact:updated', (data: EventMap['contact:updated']) => {
      this.handleContactUpdated(data)
    })
    
    this.socket.on('contact:deleted', (data: EventMap['contact:deleted']) => {
      this.handleContactDeleted(data)
    })
    
    // Call events
    this.socket.on('call:started', (data: EventMap['call:started']) => {
      this.handleCallStarted(data)
    })
    
    this.socket.on('call:ended', (data: EventMap['call:ended']) => {
      this.handleCallEnded(data)
    })
    
    this.socket.on('call:status', (data: EventMap['call:status']) => {
      this.handleCallStatus(data)
    })
    
    // AI events
    this.socket.on('ai:response', (data: EventMap['ai:response']) => {
      this.handleAIResponse(data)
    })
    
    // Metrics events
    this.socket.on('metrics:updated', (data: EventMap['metrics:updated']) => {
      this.handleMetricsUpdated(data)
    })
    
    // User activity events
    this.socket.on('user:activity', (data: EventMap['user:activity']) => {
      this.handleUserActivity(data)
    })
  }
  
  private subscribeToChannels() {
    if (!this.socket || !this.userId) return
    
    // Subscribe to user-specific channel
    this.socket.emit('join:user', this.userId)
    
    // Subscribe to team channels
    this.socket.emit('join:team', this.userId)
    
    // Subscribe to global events
    this.socket.emit('join:global')
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached')
      useAppStore.getState().setConnectionStatus('error')
      return
    }
    
    this.reconnectAttempts++
    console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
    
    setTimeout(() => {
      this.socket?.connect()
    }, this.reconnectDelay * this.reconnectAttempts)
  }
  
  // Event handlers
  private handleContactCreated(data: EventMap['contact:created']) {
    // Only update if it's not from the current user (to avoid duplicates)
    if (data.userId !== this.userId) {
      const { addContact } = useAppStore.getState()
      addContact(data.contact)
      
      // Invalidate contact queries
      invalidateContacts()
      
      // Show notification
      this.showNotification('New contact created', `${data.contact.firstName} ${data.contact.lastName}`)
    }
  }
  
  private handleContactUpdated(data: EventMap['contact:updated']) {
    if (data.userId !== this.userId) {
      const { updateContact } = useAppStore.getState()
      updateContact(data.contactId, data.updates)
      
      // Update specific contact query
      queryClient.setQueryData(['contacts', 'detail', data.contactId], (old: Contact) => ({
        ...old,
        ...data.updates,
      }))
    }
  }
  
  private handleContactDeleted(data: EventMap['contact:deleted']) {
    if (data.userId !== this.userId) {
      const { deleteContact } = useAppStore.getState()
      deleteContact(data.contactId)
      
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['contacts', 'detail', data.contactId] })
      invalidateContacts()
    }
  }
  
  private handleCallStarted(data: EventMap['call:started']) {
    const { setActiveCall } = useAppStore.getState()
    
    // Fetch full call details
    fetch(`/api/calls/${data.callId}`)
      .then(res => res.json())
      .then(call => {
        setActiveCall(call)
        invalidateCalls()
        
        if (data.userId !== this.userId) {
          this.showNotification('Call started', `Call with contact ${data.contactId}`)
        }
      })
      .catch(console.error)
  }
  
  private handleCallEnded(data: EventMap['call:ended']) {
    const { setActiveCall, addToHistory } = useAppStore.getState()
    
    // Fetch complete call record
    fetch(`/api/calls/${data.callId}`)
      .then(res => res.json())
      .then(call => {
        setActiveCall(null)
        addToHistory(call)
        invalidateCalls()
        
        if (data.userId !== this.userId) {
          this.showNotification('Call ended', `Duration: ${Math.round(data.duration / 1000)}s`)
        }
      })
      .catch(console.error)
  }
  
  private handleCallStatus(data: EventMap['call:status']) {
    const { updateActiveCall } = useAppStore.getState()
    updateActiveCall({ status: data.status })
  }
  
  private handleAIResponse(data: EventMap['ai:response']) {
    const { addTranscriptEntry } = useAppStore.getState()
    addTranscriptEntry({
      speaker: 'ai',
      text: data.message,
      timestamp: data.timestamp,
      sentiment: data.sentiment,
    })
  }
  
  private handleMetricsUpdated(data: EventMap['metrics:updated']) {
    const { setMetrics } = useAppStore.getState()
    setMetrics(data.metrics)
    
    // Update metrics cache
    queryClient.setQueryData(['metrics', 'realtime'], data.metrics)
  }
  
  private handleUserActivity(data: EventMap['user:activity']) {
    // Handle user activity updates (e.g., show who's online)
    console.log('User activity:', data)
  }
  
  private showNotification(title: string, message: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      })
    }
  }
  
  // Public methods
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
    this.socket?.emit(event, data)
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
  
  isConnected(): boolean {
    return this.socket?.connected ?? false
  }
  
  getConnectionState(): 'connected' | 'disconnected' | 'connecting' | 'error' {
    if (!this.socket) return 'disconnected'
    if (this.socket.connected) return 'connected'
    if (this.socket.connecting) return 'connecting'
    return 'error'
  }
}

export const wsManager = new WebSocketManager()

// React hook for WebSocket connection
export function useWebSocket() {
  const connectionStatus = useAppStore(state => state.connectionStatus)
  
  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    emit: wsManager.emit.bind(wsManager),
    disconnect: wsManager.disconnect.bind(wsManager),
  }
}

// Initialize WebSocket on app startup
export function initializeWebSocket(token: string, userId: string) {
  wsManager.connect(token, userId)
  
  // Request notification permissions
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}