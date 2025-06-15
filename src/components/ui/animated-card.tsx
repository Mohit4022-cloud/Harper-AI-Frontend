'use client'

import { motion, MotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface AnimatedCardProps extends MotionProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
  clickable?: boolean
}

export function AnimatedCard({
  children,
  className,
  hoverable = true,
  clickable = false,
  ...motionProps
}: AnimatedCardProps) {
  return (
    <motion.div
      className={cn(
        'bg-background rounded-lg border border-border p-6',
        hoverable && 'transition-shadow hover:shadow-lg',
        clickable && 'cursor-pointer',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={hoverable ? { scale: 1.02 } : undefined}
      whileTap={clickable ? { scale: 0.98 } : undefined}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}