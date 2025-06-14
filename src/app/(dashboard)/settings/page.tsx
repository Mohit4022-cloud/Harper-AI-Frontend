'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, User, Bell, Shield, Palette } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>
      </div>

      {/* Under Construction */}
      <Card>
        <CardContent className="p-12 text-center">
          <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🚧 Under Construction</h2>
          <p className="text-gray-600 mb-6">
            The settings panel is being built. Coming soon with features like:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto text-left">
            <div className="text-sm text-gray-600">
              • Profile settings
            </div>
            <div className="text-sm text-gray-600">
              • Notifications
            </div>
            <div className="text-sm text-gray-600">
              • Security settings
            </div>
            <div className="text-sm text-gray-600">
              • Theme preferences
            </div>
            <div className="text-sm text-gray-600">
              • Integration settings
            </div>
            <div className="text-sm text-gray-600">
              • API configuration
            </div>
          </div>
          <Button variant="outline" className="mt-6" onClick={() => window.history.back()}>
            ← Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}