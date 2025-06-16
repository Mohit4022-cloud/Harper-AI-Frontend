'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useTypingIndicator, useWatchTyping } from '@/hooks/use-typing-indicator'
import { ContactId } from '@/types/brand'

interface CollaborativeInputProps extends InputHTMLAttributes<HTMLInputElement> {
  field: string
  contactId?: ContactId
  showTypingIndicators?: boolean
}

export const CollaborativeInput = forwardRef<HTMLInputElement, CollaborativeInputProps>(
  ({ field, contactId, showTypingIndicators = true, onChange, onBlur, className, ...props }, ref) => {
    const { onType, onBlur: onStopTyping } = useTypingIndicator({ field, contactId })
    const typingUsers = useWatchTyping(field, contactId)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onType()
      onChange?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onStopTyping()
      onBlur?.(e)
    }

    return (
      <div className="relative">
        <Input
          ref={ref}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            showTypingIndicators && typingUsers.length > 0 && "pr-24",
            className
          )}
          {...props}
        />
        
        {showTypingIndicators && typingUsers.length > 0 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <AnimatePresence mode="popLayout">
              {typingUsers.slice(0, 3).map((user, index) => user ? (
                <motion.div
                  key={user.userId}
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 10 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <Avatar className="h-6 w-6 border-2 border-white dark:border-gray-800">
                    <AvatarImage src={user.userAvatar} />
                    <AvatarFallback className="text-xs">
                      {user.userName?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <TypingIndicatorDot />
                </motion.div>
              ) : null)}
            </AnimatePresence>
            
            {typingUsers.length > 3 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500 ml-1"
              >
                +{typingUsers.length - 3}
              </motion.span>
            )}
          </div>
        )}
      </div>
    )
  }
)

CollaborativeInput.displayName = 'CollaborativeInput'

function TypingIndicatorDot() {
  return (
    <motion.div
      className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-0.5"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
    >
      <motion.div
        className="h-1.5 w-1.5 bg-white rounded-full"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.div>
  )
}