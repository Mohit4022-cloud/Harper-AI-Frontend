import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import { parse } from 'url'
import next from 'next'
import jwt from 'jsonwebtoken'
import { EventMap, ContactId, CallId, UserId } from '../src/types/brand'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)
const wsPort = parseInt(process.env.WS_PORT || '3001', 10)

// Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Type definitions for Socket.io
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

interface InterServerEvents {
  ping: () => void
}

interface SocketData {
  userId: string
  teamId?: string
}

// Initialize Socket.io server
const httpServer = createServer()
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('Authentication error'))
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; teamId?: string }
    socket.data.userId = decoded.userId
    socket.data.teamId = decoded.teamId
    
    next()
  } catch (err) {
    next(new Error('Authentication error'))
  }
})

// Connection handler
io.on('connection', (socket) => {
  console.log(`User ${socket.data.userId} connected`)

  // Join user-specific room
  socket.on('join:user', (userId) => {
    if (userId === socket.data.userId) {
      socket.join(`user:${userId}`)
      console.log(`User ${userId} joined personal room`)
    }
  })

  // Join team room
  socket.on('join:team', (userId) => {
    if (socket.data.teamId) {
      socket.join(`team:${socket.data.teamId}`)
      console.log(`User ${userId} joined team room ${socket.data.teamId}`)
    }
  })

  // Join global room for system-wide updates
  socket.on('join:global', () => {
    socket.join('global')
    console.log(`User ${socket.data.userId} joined global room`)
  })

  // Subscribe to specific entity updates
  socket.on('subscribe:entity', ({ type, id }) => {
    const room = `${type}:${id}`
    socket.join(room)
    console.log(`User ${socket.data.userId} subscribed to ${room}`)
  })

  // Unsubscribe from entity updates
  socket.on('unsubscribe:entity', ({ type, id }) => {
    const room = `${type}:${id}`
    socket.leave(room)
    console.log(`User ${socket.data.userId} unsubscribed from ${room}`)
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.data.userId} disconnected`)
  })
})

// Helper functions to emit events
export function emitContactCreated(data: EventMap['contact:created']) {
  // Emit to user's personal room
  io.to(`user:${data.userId}`).emit('contact:created', data)
  
  // Emit to team room if applicable
  const teamId = getTeamIdForUser(data.userId)
  if (teamId) {
    io.to(`team:${teamId}`).emit('contact:created', data)
  }
  
  // Emit to contact-specific room
  io.to(`contact:${data.contactId}`).emit('contact:created', data)
}

export function emitContactUpdated(data: EventMap['contact:updated']) {
  io.to(`user:${data.userId}`).emit('contact:updated', data)
  
  const teamId = getTeamIdForUser(data.userId)
  if (teamId) {
    io.to(`team:${teamId}`).emit('contact:updated', data)
  }
  
  io.to(`contact:${data.contactId}`).emit('contact:updated', data)
}

export function emitContactDeleted(data: EventMap['contact:deleted']) {
  io.to(`user:${data.userId}`).emit('contact:deleted', data)
  
  const teamId = getTeamIdForUser(data.userId)
  if (teamId) {
    io.to(`team:${teamId}`).emit('contact:deleted', data)
  }
  
  io.to(`contact:${data.contactId}`).emit('contact:deleted', data)
}

export function emitCallStarted(data: EventMap['call:started']) {
  io.to(`user:${data.userId}`).emit('call:started', data)
  io.to(`call:${data.callId}`).emit('call:started', data)
  io.to(`contact:${data.contactId}`).emit('call:started', data)
}

export function emitCallEnded(data: EventMap['call:ended']) {
  io.to(`user:${data.userId}`).emit('call:ended', data)
  io.to(`call:${data.callId}`).emit('call:ended', data)
}

export function emitCallStatus(data: EventMap['call:status']) {
  io.to(`call:${data.callId}`).emit('call:status', data)
}

export function emitAIResponse(data: EventMap['ai:response']) {
  io.to(`call:${data.callId}`).emit('ai:response', data)
}

export function emitMetricsUpdated(data: EventMap['metrics:updated']) {
  io.to(`user:${data.userId}`).emit('metrics:updated', data)
}

export function emitUserActivity(data: EventMap['user:activity']) {
  const teamId = getTeamIdForUser(data.userId)
  if (teamId) {
    io.to(`team:${teamId}`).emit('user:activity', data)
  }
}

// Mock function - replace with actual implementation
function getTeamIdForUser(userId: UserId): string | null {
  // TODO: Implement actual team lookup
  return 'team-123'
}

// Start servers
app.prepare().then(() => {
  // Next.js server
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  }).listen(port, () => {
    console.log(`> Next.js ready on http://${hostname}:${port}`)
  })

  // WebSocket server
  httpServer.listen(wsPort, () => {
    console.log(`> WebSocket server ready on ws://${hostname}:${wsPort}`)
  })
})