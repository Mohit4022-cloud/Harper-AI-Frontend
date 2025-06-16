'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
}

const colorMap = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
}

export function Toaster() {
  const notifications = useAppStore(state => state.notifications)
  const removeNotification = useAppStore(state => state.removeNotification)

  useEffect(() => {
    const timers = notifications.map(notification => {
      // Auto-dismiss after 5 seconds
      return setTimeout(() => {
        removeNotification(notification.id)
      }, 5000)
    })

    return () => {
      timers.forEach(timer => {
        if (timer) clearTimeout(timer)
      })
    }
  }, [notifications, removeNotification])

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => {
          const Icon = iconMap[notification.type]
          const colorClass = colorMap[notification.type]

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <div className="max-w-sm w-full bg-background rounded-lg shadow-lg border border-border overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start">
                    <div className={cn('flex-shrink-0', colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="ml-3 w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="mt-1 text-sm text-foreground-subtle">
                          {notification.message}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                      <button
                        className="rounded-md inline-flex text-foreground-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                        onClick={() => removeNotification(notification.id)}
                      >
                        <span className="sr-only">Close</span>
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
                {/* Progress bar removed - notifications auto-dismiss after 5s */}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}