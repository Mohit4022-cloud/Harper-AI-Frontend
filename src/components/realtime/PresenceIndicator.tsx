'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { ActiveUser } from '@/store/slices/realtime'

export function PresenceIndicator() {
  const activeUsers = useAppStore(state => state.activeUsers)
  const [isExpanded, setIsExpanded] = useState(false)

  // Convert Map to array for rendering
  const users = Array.from(activeUsers.values()).filter(user => user.status === 'online')

  if (users.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-[300px]"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Active Users ({users.length})</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {users.map((user) => (
                <UserPresenceCard key={user.userId} user={user} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsExpanded(true)}
            className="bg-white dark:bg-gray-800 rounded-full shadow-lg p-3 flex items-center gap-2 hover:shadow-xl transition-shadow"
          >
            <div className="flex -space-x-2">
              {users.slice(0, 3).map((user, index) => (
                <Avatar key={user.userId} className="h-8 w-8 border-2 border-white dark:border-gray-800">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-xs">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {users.length > 3 && (
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                +{users.length - 3}
              </span>
            )}
            <div className="relative">
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

function UserPresenceCard({ user }: { user: ActiveUser }) {
  const [showTyping, setShowTyping] = useState(false)
  const typingIndicators = useAppStore(state => state.typingIndicators)
  
  useEffect(() => {
    // Check if user is typing
    const isTyping = Array.from(typingIndicators.values()).some(
      indicator => indicator.userId === user.userId
    )
    setShowTyping(isTyping)
  }, [typingIndicators, user.userId])

  const getPageName = (page: string) => {
    const segments = page.split('/').filter(Boolean)
    if (segments.length === 0) return 'Home'
    return segments[segments.length - 1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>
            {user.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <span className={cn(
          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800",
          user.status === 'online' && "bg-green-500",
          user.status === 'idle' && "bg-yellow-500",
          user.status === 'offline' && "bg-gray-400"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{user.name}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getPageName(user.currentPage)}
          </p>
          {showTyping && (
            <Badge variant="secondary" className="text-xs">
              <TypingDots />
              typing
            </Badge>
          )}
        </div>
      </div>
      
      <div className="text-xs text-gray-400">
        {getRelativeTime(user.lastActive)}
      </div>
    </motion.div>
  )
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 mr-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1 w-1 bg-current rounded-full"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </span>
  )
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  
  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}