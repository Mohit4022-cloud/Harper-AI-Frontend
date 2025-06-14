'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { mockUsers } from '@/lib/mockData'
import { generateTokens } from '@/lib/jwt'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Shield, Zap } from 'lucide-react'

export default function DevLoginPage() {
  const router = useRouter()
  const { user, setUser, setToken } = useAuthStore()

  // Auto-login as admin in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 DEV MODE: Auto-login available')
    }
  }, [])

  const loginAs = (selectedUser: any) => {
    try {
      // Generate tokens for the selected user
      const { token, refreshToken } = generateTokens(selectedUser)
      
      // Update auth store
      setUser(selectedUser)
      setToken(token, refreshToken)
      
      console.log(`✅ DEV LOGIN: Logged in as ${selectedUser.name} (${selectedUser.email})`)
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('❌ DEV LOGIN ERROR:', error)
    }
  }

  // Allow in development OR if special bypass parameter is present
  const isDevMode = process.env.NODE_ENV === 'development'
  const hasRenderBypass = typeof window !== 'undefined' && 
    window.location.search.includes('render_bypass=true')
  
  if (!isDevMode && !hasRenderBypass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary/10 p-4">
        <Card className="shadow-xl border-0 max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
            <p className="text-gray-600 mb-6">
              Development bypass requires special access. Use the regular login instead.
            </p>
            <Button asChild className="gradient-purple-pink hover:opacity-90">
              <a href="/login">Go to Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 gradient-purple-pink rounded-2xl flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Development Bypass</h1>
          <p className="text-gray-600 mt-2">
            Quick login for testing {isDevMode ? '(dev mode)' : '(render access)'}
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-center text-xl">Choose Test User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockUsers.map((testUser) => (
              <Button
                key={testUser.id}
                variant="outline"
                className="w-full justify-start p-4 h-auto hover:bg-gray-50"
                onClick={() => loginAs(testUser)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{testUser.name}</p>
                    <p className="text-sm text-gray-600">{testUser.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{testUser.role.replace('_', ' ')}</p>
                  </div>
                </div>
              </Button>
            ))}
            
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => router.push('/login')}
              >
                ← Back to Regular Login
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Testing Mode:</strong> {isDevMode 
              ? 'Development environment detected' 
              : 'Special access mode enabled'}
          </p>
        </div>
      </div>
    </div>
  )
}