'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false
              }
              return failureCount < 3
            },
            refetchOnWindowFocus: false,
            refetchOnMount: true,
          },
          mutations: {
            onError: (error: any) => {
              const message = error?.response?.data?.message || error?.message || 'An error occurred'
              console.error('Mutation error:', message)
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}