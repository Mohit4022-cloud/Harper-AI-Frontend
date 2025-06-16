import { useEffect, useRef, useCallback } from 'react'
import { useWebSocket } from '@/lib/websocket/client'
import { useAppStore } from '@/store'
import { ContactId } from '@/types/brand'

interface UseTypingIndicatorOptions {
  field: string
  contactId?: ContactId
  debounceMs?: number
}

export function useTypingIndicator({
  field,
  contactId,
  debounceMs = 1000
}: UseTypingIndicatorOptions) {
  const { send } = useWebSocket()
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const isTypingRef = useRef(false)
  
  // Get current user ID from auth store or session
  const userId = 'current-user-id' // Would get from auth

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true
      send('user:typing', {
        userId: userId as any, // Type assertion for demo
        contactId,
        field,
        timestamp: new Date()
      })
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, debounceMs)
  }, [field, contactId, userId, send, debounceMs])

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false
      // In a real app, you'd send a stop typing event
      // For now, the indicator auto-removes after timeout
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = undefined
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTyping()
    }
  }, [stopTyping])

  return {
    onType: startTyping,
    onBlur: stopTyping
  }
}

// Hook to watch for typing indicators
export function useWatchTyping(field: string, contactId?: ContactId) {
  const typingIndicators = useAppStore(state => state.typingIndicators)
  const activeUsers = useAppStore(state => state.activeUsers)

  // Get users typing in this field
  const typingUsers = Array.from(typingIndicators.entries())
    .filter(([key, indicator]) => {
      return indicator.field === field && 
        (!contactId || indicator.contactId === contactId)
    })
    .map(([_, indicator]) => {
      const user = activeUsers.get(indicator.userId)
      return user ? {
        ...indicator,
        userName: user.name,
        userAvatar: user.avatar
      } : null
    })
    .filter(Boolean)

  return typingUsers
}