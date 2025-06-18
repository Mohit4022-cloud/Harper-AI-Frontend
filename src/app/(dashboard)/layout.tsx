'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/slices/authStore'
import { Sidebar } from '@/components/layouts/Sidebar'
import { WebSocketProvider } from '@/components/providers/WebSocketProvider'
import { PresenceIndicator } from '@/components/realtime/PresenceIndicator'
import { SessionMonitor } from '@/components/SessionMonitor'
import { HarperAIGeminiIntegration } from '@/lib/gemini/integration'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, token } = useAuthStore()

  useEffect(() => {
    if (!token || !user) {
      console.log('🔒 No auth token/user, redirecting to login')
      router.push('/login')
    } else {
      console.log('✅ Dashboard auth check passed:', { hasToken: !!token, hasUser: !!user })
      
      // Initialize window.harperAI for email generation
      if (typeof window !== 'undefined') {
        (window as any).harperAI = new HarperAIGeminiIntegration();
        console.log('🤖 Harper AI integration initialized');
      }
    }
  }, [token, user, router])

  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <WebSocketProvider>
      <SessionMonitor />
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <PresenceIndicator />
      </div>
    </WebSocketProvider>
  )
}