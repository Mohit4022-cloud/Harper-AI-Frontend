import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { PerformanceProvider } from '@/components/providers/PerformanceProvider'
import { PageTransitionProvider } from '@/components/providers/PageTransitionProvider'
import { CommandPalette } from '@/components/CommandPalette'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Harper AI - Modern SDR Platform',
  description: 'Advanced Sales Development Representative platform with AI-powered calling and email automation',
  keywords: 'SDR, sales, CRM, calling, email automation, AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('🏁 Layout loaded at', new Date().toISOString());
  
  // Warn about localhost usage in production
  if (typeof window !== 'undefined' && window.location.href.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.warn('🛑 WARNING: localhost URL used in production. Fix your env config.');
  }
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <PerformanceProvider>
            <PageTransitionProvider>
              {children}
              <Toaster />
              <CommandPalette />
            </PageTransitionProvider>
          </PerformanceProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}