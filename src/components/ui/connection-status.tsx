'use client'

import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function ConnectionStatus() {
  const connectionStatus = useAppStore(state => state.connectionStatus)
  const lastSyncTime = useAppStore(state => state.lastSyncTime)

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4" />
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'disconnected':
        return <WifiOff className="h-4 w-4" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600 dark:text-green-400'
      case 'connecting':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'disconnected':
      case 'error':
        return 'text-red-600 dark:text-red-400'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'disconnected':
        return 'Disconnected'
      case 'error':
        return 'Connection Error'
    }
  }

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never'
    
    const now = new Date()
    const diff = now.getTime() - lastSyncTime.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return lastSyncTime.toLocaleDateString()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-2 text-sm"
      >
        <div className={cn('flex items-center gap-1.5', getStatusColor())}>
          {getStatusIcon()}
          <span className="font-medium">{getStatusText()}</span>
        </div>
        
        {connectionStatus === 'connected' && lastSyncTime && (
          <span className="text-foreground-muted">
            Last sync: {formatLastSync()}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// Mini version for sidebar or header
export function ConnectionStatusMini() {
  const connectionStatus = useAppStore(state => state.connectionStatus)

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500 animate-pulse'
      case 'disconnected':
      case 'error':
        return 'bg-red-500'
    }
  }

  return (
    <div className="relative">
      <div 
        className={cn(
          'h-2 w-2 rounded-full',
          getStatusColor()
        )}
      />
      {connectionStatus === 'connecting' && (
        <div className="absolute inset-0 h-2 w-2 rounded-full bg-yellow-500 animate-ping" />
      )}
    </div>
  )
}