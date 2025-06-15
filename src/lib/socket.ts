import { io, Socket } from 'socket.io-client'
import { logger } from './logger'
import type { EventMap, ContactId, CallId, UserId } from '@/types/brand'

type EventPayload<K extends keyof EventMap> = EventMap[K]

export interface ServerToClientEvents {
  // Mapped from EventMap
  'contact:created': (payload: EventPayload<'contact:created'>) => void
  'contact:updated': (payload: EventPayload<'contact:updated'>) => void
  'contact:deleted': (payload: EventPayload<'contact:deleted'>) => void
  'call:started': (payload: EventPayload<'call:started'>) => void
  'call:ended': (payload: EventPayload<'call:ended'>) => void
  'call:status': (payload: EventPayload<'call:status'>) => void
  'ai:response': (payload: EventPayload<'ai:response'>) => void
  'metrics:updated': (payload: EventPayload<'metrics:updated'>) => void
  'user:activity': (payload: EventPayload<'user:activity'>) => void
  
  // System events
  'notification': (notification: { type: string; message: string; severity: 'info' | 'warning' | 'error' }) => void
  'error': (error: { code: string; message: string }) => void
  'reconnect': () => void
}

export interface ClientToServerEvents {
  // Subscriptions
  'subscribe:contacts': (userId: UserId) => void
  'subscribe:calls': (userId: UserId) => void
  'subscribe:metrics': () => void
  'unsubscribe:all': () => void
  
  // Actions
  'call:initiate': (contactId: ContactId, userId: UserId) => void
  'call:terminate': (callId: CallId) => void
  
  // Sync events
  'sync:update': (data: { key: string; payload: any }) => void
}

class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  connect(token?: string): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) {
      return this.socket
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
    
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: this.maxReconnectAttempts,
    })

    this.setupEventHandlers()
    return this.socket
  }

  private setupEventHandlers() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      logger.info('Socket connected', { id: this.socket?.id })
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      logger.warn('Socket disconnected', { reason })
    })

    this.socket.on('connect_error', (error) => {
      logger.error('Socket connection error', { error: error.message })
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('Max reconnection attempts reached')
        this.disconnect()
      }
    })

    this.socket.on('error', (error) => {
      logger.error('Socket error', { error })
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }
  }

  emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) {
    if (!this.socket?.connected) {
      logger.warn('Cannot emit event, socket not connected', { event })
      return
    }
    this.socket.emit(event, ...args)
  }

  on<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) {
    if (!this.socket) {
      logger.warn('Cannot subscribe to event, socket not initialized', { event })
      return
    }
    this.socket.on(event, handler)
  }

  off<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ) {
    if (!this.socket) return
    if (handler) {
      this.socket.off(event, handler)
    } else {
      this.socket.off(event)
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket
  }
}

// Export singleton instance
export const socketClient = new SocketClient()

// Export hook for React components
export function useSocket() {
  return socketClient
}