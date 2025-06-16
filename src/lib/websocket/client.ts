import { EventEmitter } from 'events'
import { useAppStore } from '@/store'
import { EventMap } from '@/types/brand'

type WebSocketEventHandler<T extends keyof EventMap> = EventMap[T] extends void 
  ? () => void 
  : (data: EventMap[T]) => void

interface WebSocketOptions {
  url?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null
  private url: string
  private reconnectInterval: number
  private maxReconnectAttempts: number
  private heartbeatInterval: number
  private reconnectAttempts = 0
  private heartbeatTimer?: NodeJS.Timeout
  private reconnectTimer?: NodeJS.Timeout
  private isIntentionallyClosed = false

  constructor(options: WebSocketOptions = {}) {
    super()
    this.url = options.url || this.getWebSocketUrl()
    this.reconnectInterval = options.reconnectInterval || 5000
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10
    this.heartbeatInterval = options.heartbeatInterval || 30000
  }

  private getWebSocketUrl(): string {
    if (typeof window === 'undefined') return ''
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = process.env.NEXT_PUBLIC_WS_URL || window.location.host
    return `${protocol}//${host}/ws`
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return

    try {
      this.ws = new WebSocket(this.url)
      this.setupEventHandlers()
    } catch (error) {
      console.error('[WebSocket] Connection error:', error)
      this.scheduleReconnect()
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected')
      this.reconnectAttempts = 0
      this.emit('connected')
      
      // Update store
      const { setConnected, resetReconnectAttempts } = useAppStore.getState()
      setConnected(true)
      resetReconnectAttempts()
      
      // Start heartbeat
      this.startHeartbeat()
      
      // Send authentication
      this.authenticate()
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('[WebSocket] Message parse error:', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error)
      this.emit('error', error)
    }

    this.ws.onclose = () => {
      console.log('[WebSocket] Disconnected')
      this.emit('disconnected')
      
      // Update store
      const { setConnected, incrementReconnectAttempts } = useAppStore.getState()
      setConnected(false)
      
      // Stop heartbeat
      this.stopHeartbeat()
      
      // Attempt reconnect if not intentionally closed
      if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
        incrementReconnectAttempts()
        this.scheduleReconnect()
      }
    }
  }

  private handleMessage(message: any): void {
    const { type, data } = message

    // Handle system messages
    switch (type) {
      case 'pong':
        this.handlePong()
        break
      case 'auth:success':
        this.emit('authenticated')
        break
      case 'auth:error':
        this.emit('authError', data)
        break
      default:
        // Emit typed events
        this.emit(type, data)
        
        // Update store based on event type
        this.updateStoreFromEvent(type, data)
    }
  }

  private updateStoreFromEvent(type: string, data: any): void {
    const store = useAppStore.getState()

    switch (type) {
      case 'user:active':
        store.updateActiveUser(data)
        break
      case 'user:typing':
        store.addTypingIndicator(data)
        break
      case 'user:idle':
        store.setUserStatus(data.userId, 'idle')
        break
      case 'contact:created':
      case 'contact:updated':
        // Invalidate queries to refetch data
        if (typeof window !== 'undefined') {
          import('@/lib/query-client').then(({ invalidateContacts }) => {
            invalidateContacts()
          })
        }
        break
      case 'call:started':
      case 'call:ended':
        // Update call state
        if (typeof window !== 'undefined') {
          import('@/lib/query-client').then(({ invalidateCallHistory }) => {
            invalidateCallHistory()
          })
        }
        break
    }
  }

  private authenticate(): void {
    // Get auth token from cookies or store
    const token = this.getAuthToken()
    if (token) {
      this.send('auth', { token })
    }
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    
    // Try to get from cookie
    const match = document.cookie.match(/auth-token=([^;]+)/)
    return match ? match[1] : null
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: Date.now() })
      }
    }, this.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }
  }

  private handlePong(): void {
    const { updatePing } = useAppStore.getState()
    updatePing()
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return

    this.reconnectAttempts++
    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    )

    console.log(`[WebSocket] Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined
      this.connect()
    }, delay)
  }

  send<T extends keyof EventMap>(type: T, ...args: EventMap[T] extends void ? [] : [data: EventMap[T]]): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send message, not connected')
      return
    }

    try {
      const data = args.length > 0 ? args[0] : undefined
      this.ws.send(JSON.stringify({ type, data }))
    } catch (error) {
      console.error('[WebSocket] Send error:', error)
    }
  }

  // Typed event listeners
  on<T extends keyof EventMap>(event: T, handler: WebSocketEventHandler<T>): this {
    return super.on(event, handler)
  }

  off<T extends keyof EventMap>(event: T, handler: WebSocketEventHandler<T>): this {
    return super.off(event, handler)
  }

  disconnect(): void {
    this.isIntentionallyClosed = true
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
    
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  getState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'open'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
        return 'closed'
      default:
        return 'closed'
    }
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null

export function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    wsClient = new WebSocketClient()
  }
  return wsClient
}

export function connectWebSocket(): void {
  getWebSocketClient().connect()
}

export function disconnectWebSocket(): void {
  getWebSocketClient().disconnect()
}

// React hook for WebSocket
export function useWebSocket() {
  const isConnected = useAppStore(state => state.isConnected)
  const reconnectAttempts = useAppStore(state => state.reconnectAttempts)
  const lastPing = useAppStore(state => state.lastPing)

  return {
    isConnected,
    reconnectAttempts,
    lastPing,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    send: <T extends keyof EventMap>(type: T, ...args: EventMap[T] extends void ? [] : [data: EventMap[T]]) => {
      getWebSocketClient().send(type, ...args)
    },
    on: <T extends keyof EventMap>(event: T, handler: WebSocketEventHandler<T>) => {
      const client = getWebSocketClient()
      client.on(event, handler)
      return () => client.off(event, handler)
    }
  }
}