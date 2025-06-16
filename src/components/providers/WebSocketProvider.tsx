'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useWebSocket } from '@/lib/websocket/client'
import { useAppStore } from '@/store'
import { UserId } from '@/types/brand'

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const pathname = usePathname()
  const { connect, disconnect, on, isConnected } = useWebSocket()
  const { 
    addNotification, 
    updateActiveUser, 
    removeActiveUser,
    clearStaleTypingIndicators 
  } = useAppStore()
  
  const cleanupRef = useRef<(() => void)[]>([])

  useEffect(() => {
    // Don't connect on auth pages
    if (pathname.startsWith('/login') || 
        pathname.startsWith('/register') || 
        pathname.startsWith('/forgot-password')) {
      return
    }

    // Connect to WebSocket
    connect()

    // Set up event listeners
    const cleanup1 = on('connected', () => {
      addNotification({
        type: 'success',
        title: 'Connected',
        message: 'Real-time connection established',
        duration: 3000,
      })
    })

    const cleanup2 = on('disconnected', () => {
      addNotification({
        type: 'warning',
        title: 'Disconnected',
        message: 'Real-time connection lost. Reconnecting...',
        duration: 5000,
      })
    })

    const cleanup3 = on('user:active', (data) => {
      updateActiveUser({
        userId: data.userId,
        name: 'Unknown User', // Would come from data
        currentPage: data.page,
        lastActive: new Date(),
        status: 'online',
      })
    })

    const cleanup4 = on('user:idle', (data) => {
      removeActiveUser(data.userId)
    })

    const cleanup5 = on('contact:created', (data) => {
      addNotification({
        type: 'info',
        title: 'New Contact',
        message: `Contact #${data.contactId} was created`,
        duration: 5000,
      })
    })

    const cleanup6 = on('call:started', (data) => {
      addNotification({
        type: 'info',
        title: 'Call Started',
        message: `Call initiated with contact #${data.contactId}`,
        duration: 5000,
      })
    })

    const cleanup7 = on('call:ended', (data) => {
      const duration = Math.floor(data.duration / 60)
      addNotification({
        type: 'success',
        title: 'Call Ended',
        message: `Call completed (${duration} minutes)`,
        duration: 5000,
      })
    })

    cleanupRef.current = [
      cleanup1, cleanup2, cleanup3, cleanup4, 
      cleanup5, cleanup6, cleanup7
    ]

    // Periodic cleanup of stale data
    const intervalId = setInterval(() => {
      clearStaleTypingIndicators()
    }, 5000)

    // Send current page on mount
    if (isConnected) {
      // Would send user:active event here
    }

    return () => {
      // Clean up listeners
      cleanupRef.current.forEach(cleanup => cleanup())
      cleanupRef.current = []
      
      // Clear interval
      clearInterval(intervalId)
      
      // Disconnect on unmount
      disconnect()
    }
  }, [pathname, connect, disconnect, on, isConnected])

  // Update active page when pathname changes
  useEffect(() => {
    if (isConnected && pathname) {
      // Would send page update here
    }
  }, [pathname, isConnected])

  return <>{children}</>
}