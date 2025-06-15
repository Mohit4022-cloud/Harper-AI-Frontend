'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRealtimeSync, useOfflineSync } from '@/hooks/use-realtime-sync-complete'
import { cn } from '@/lib/utils'
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function SyncIndicator() {
  const { isConnected, connectionState } = useRealtimeSync()
  const { isOnline, pendingActions, queueAction } = useOfflineSync()
  const [syncProgress, setSyncProgress] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  
  // Simulate sync progress
  useEffect(() => {
    if (isSyncing) {
      const interval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 100) {
            setIsSyncing(false)
            return 0
          }
          return prev + 10
        })
      }, 200)
      
      return () => clearInterval(interval)
    }
  }, [isSyncing])
  
  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (!isConnected) return <CloudOff className="h-4 w-4" />
    if (pendingActions > 0) return <AlertCircle className="h-4 w-4" />
    return <Cloud className="h-4 w-4" />
  }
  
  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500'
    if (isSyncing) return 'text-blue-500'
    if (!isConnected) return 'text-yellow-500'
    if (pendingActions > 0) return 'text-orange-500'
    return 'text-green-500'
  }
  
  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (isSyncing) return 'Syncing...'
    if (!isConnected) return 'Connecting...'
    if (pendingActions > 0) return `${pendingActions} pending`
    return 'Synced'
  }
  
  const handleManualSync = () => {
    setIsSyncing(true)
    // Trigger manual sync
    // This would call your sync API
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2",
            getStatusColor()
          )}
        >
          {getStatusIcon()}
          <span className="text-xs font-medium">{getStatusText()}</span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Sync Status</h3>
            <StatusBadge 
              isOnline={isOnline}
              isConnected={isConnected}
              connectionState={connectionState}
            />
          </div>
          
          {/* Connection Details */}
          <div className="space-y-2">
            <ConnectionStatus isOnline={isOnline} isConnected={isConnected} />
            
            {pendingActions > 0 && (
              <PendingActions count={pendingActions} />
            )}
            
            {isSyncing && (
              <SyncProgress progress={syncProgress} />
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing}
              className="gap-2"
            >
              <RefreshCw className={cn(
                "h-3 w-3",
                isSyncing && "animate-spin"
              )} />
              Sync Now
            </Button>
            
            {!isOnline && (
              <span className="text-xs text-muted-foreground">
                Changes will sync when online
              </span>
            )}
          </div>
          
          {/* Last Sync */}
          <LastSyncTime />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function StatusBadge({ 
  isOnline, 
  isConnected, 
  connectionState 
}: {
  isOnline: boolean
  isConnected: boolean
  connectionState: string
}) {
  const getConfig = () => {
    if (!isOnline) {
      return { icon: WifiOff, color: 'bg-red-500', pulse: false }
    }
    if (connectionState === 'error') {
      return { icon: AlertCircle, color: 'bg-red-500', pulse: true }
    }
    if (connectionState === 'connecting') {
      return { icon: Loader2, color: 'bg-yellow-500', pulse: true }
    }
    if (isConnected) {
      return { icon: Wifi, color: 'bg-green-500', pulse: false }
    }
    return { icon: CloudOff, color: 'bg-gray-500', pulse: false }
  }
  
  const config = getConfig()
  const Icon = config.icon
  
  return (
    <div className="relative">
      <div className={cn(
        "flex items-center justify-center h-6 w-6 rounded-full",
        config.color
      )}>
        <Icon className={cn(
          "h-3 w-3 text-white",
          config.icon === Loader2 && "animate-spin"
        )} />
      </div>
      {config.pulse && (
        <div className={cn(
          "absolute inset-0 rounded-full opacity-75 animate-ping",
          config.color
        )} />
      )}
    </div>
  )
}

function ConnectionStatus({ 
  isOnline, 
  isConnected 
}: {
  isOnline: boolean
  isConnected: boolean
}) {
  return (
    <div className="rounded-lg border p-3 space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Network</span>
        <span className={cn(
          "font-medium",
          isOnline ? "text-green-600" : "text-red-600"
        )}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Server</span>
        <span className={cn(
          "font-medium",
          isConnected ? "text-green-600" : "text-yellow-600"
        )}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  )
}

function PendingActions({ count }: { count: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-lg border border-orange-200 bg-orange-50 p-3"
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-orange-900">
            {count} pending {count === 1 ? 'action' : 'actions'}
          </p>
          <p className="text-xs text-orange-700">
            Will sync when connection is restored
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function SyncProgress({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Syncing data...</span>
        <span className="font-medium">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </motion.div>
  )
}

function LastSyncTime() {
  const [lastSync, setLastSync] = useState<Date | null>(null)
  
  useEffect(() => {
    const stored = localStorage.getItem('lastContactSync')
    if (stored) {
      setLastSync(new Date(stored))
    }
  }, [])
  
  const formatTime = (date: Date | null) => {
    if (!date) return 'Never'
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }
  
  return (
    <div className="text-xs text-muted-foreground">
      Last sync: {formatTime(lastSync)}
    </div>
  )
}