'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/slices/authStore'

export default function HomePage() {
  const router = useRouter()
  const { token, user } = useAuthStore()

  useEffect(() => {
    if (token && user) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [token, user, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary/10">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 gradient-purple-pink rounded-2xl flex items-center justify-center mb-4">
          <span className="text-2xl font-bold text-white">H</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading Harper AI...</p>
      </div>
    </div>
  )
}