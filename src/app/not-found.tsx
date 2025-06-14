'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, Search, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">404 - Page Not Found</h1>
            <p className="text-gray-600 mb-6">
              Sorry, the page you're looking for doesn't exist or is still being built.
            </p>

            <div className="space-y-3">
              <Button asChild className="w-full gradient-purple-pink hover:opacity-90">
                <Link href="/dashboard" className="flex items-center justify-center gap-2">
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleGoBack}
              >
                ← Go Back
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                🚧 Many features are still under construction. Check back soon!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}