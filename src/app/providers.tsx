'use client'

import { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { queryClient } from '@/lib/query-client'
import { WebSocketProvider } from '@/providers/WebSocketProvider'
import { MotionConfig } from 'framer-motion'
import { PerformanceInitializer } from '@/components/performance-initializer'
import { ServiceWorkerInitializer } from '@/components/service-worker-initializer'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WebSocketProvider>
            <PerformanceInitializer />
            <ServiceWorkerInitializer />
            <MotionConfig
              reducedMotion="user"
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
            >
              {children}
            </MotionConfig>
          </WebSocketProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  )
}