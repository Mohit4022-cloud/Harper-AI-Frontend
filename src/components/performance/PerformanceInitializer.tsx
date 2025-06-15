'use client'

import { usePerformanceInit } from '@/hooks/use-performance-init'

export function PerformanceInitializer() {
  usePerformanceInit()
  return null
}