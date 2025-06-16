'use client'

import { useEffect } from 'react'
import { usePerformanceInit } from '@/hooks/use-performance-init'

export function PerformanceInitializer() {
  const { init } = usePerformanceInit()

  useEffect(() => {
    init()
  }, [init])

  return null
}