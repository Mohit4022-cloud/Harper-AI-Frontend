'use client'

import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedListProps<T> {
  items: T[]
  keyExtractor: (item: T, index: number) => string
  renderItem: (item: T, index: number) => ReactNode
  className?: string
  staggerDelay?: number
  animateReorder?: boolean
}

export function AnimatedList<T>({
  items,
  keyExtractor,
  renderItem,
  className,
  staggerDelay = 0.1,
  animateReorder = true,
}: AnimatedListProps<T>) {
  const content = (
    <AnimatePresence mode="popLayout">
      {items.map((item, index) => (
        <motion.div
          key={keyExtractor(item, index)}
          initial={{ opacity: 0, x: -20 }}
          animate={{ 
            opacity: 1, 
            x: 0,
            transition: {
              delay: index * staggerDelay,
            }
          }}
          exit={{ opacity: 0, x: 20 }}
          layout={animateReorder}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
    </AnimatePresence>
  )

  if (animateReorder) {
    return (
      <LayoutGroup>
        <div className={className}>
          {content}
        </div>
      </LayoutGroup>
    )
  }

  return (
    <div className={className}>
      {content}
    </div>
  )
}