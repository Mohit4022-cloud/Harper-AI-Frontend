import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ConnectionStatus } from '@/components/ui/connection-status'
import { Toaster } from '@/components/ui/toaster'
import { PerformanceInitializer } from '@/components/performance/PerformanceInitializer'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'HarperAI - Enterprise Contact Management',
  description: 'Real-time AI-powered contact management platform',
  keywords: ['CRM', 'AI', 'Contact Management', 'Real-time', 'Enterprise'],
  authors: [{ name: 'HarperAI Team' }],
  openGraph: {
    title: 'HarperAI',
    description: 'Enterprise-grade contact management with AI',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <PerformanceInitializer />
          <div className="min-h-screen bg-background">
            {/* Global connection status indicator */}
            <div className="fixed top-4 right-4 z-50">
              <ConnectionStatus />
            </div>
            
            {/* Main content */}
            {children}
            
            {/* Global toaster for notifications */}
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  )
}