'use client'

import { useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { initializeWebSocket, wsManager } from '@/lib/websocket'
import { useAppStore } from '@/store'

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { data: session, status } = useSession()
  const setConnectionStatus = useAppStore(state => state.setConnectionStatus)

  useEffect(() => {
    if (status === 'authenticated' && session?.user && (session as any)?.accessToken) {
      // Initialize WebSocket connection
      setConnectionStatus('connecting')
      initializeWebSocket((session as any).accessToken, (session.user as any).id || session.user.email || 'unknown')
      
      // Cleanup on unmount
      return () => {
        wsManager.disconnect()
        setConnectionStatus('disconnected')
      }
    }
  }, [status, session, setConnectionStatus])

  // Handle visibility change to reconnect when app comes back to foreground
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (session as any)?.accessToken && session?.user) {
        if (!wsManager.isConnected()) {
          console.log('🔄 Reconnecting WebSocket after visibility change')
          initializeWebSocket((session as any).accessToken, (session.user as any).id || session.user.email || 'unknown')
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session])

  // Handle network reconnection
  useEffect(() => {
    const handleOnline = () => {
      if ((session as any)?.accessToken && session?.user && !wsManager.isConnected()) {
        console.log('🔄 Reconnecting WebSocket after network recovery')
        initializeWebSocket((session as any).accessToken, (session.user as any).id || session.user.email || 'unknown')
      }
    }

    const handleOffline = () => {
      console.log('📵 Network offline')
      setConnectionStatus('disconnected')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [session, setConnectionStatus])

  return <>{children}</>
}