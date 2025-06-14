'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building, UserPlus, Settings, Award } from 'lucide-react'

export default function TeamPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600 mt-1">Manage team members and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Team Settings
          </Button>
          <Button className="gradient-purple-pink hover:opacity-90">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Under Construction */}
      <Card>
        <CardContent className="p-12 text-center">
          <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🚧 Under Construction</h2>
          <p className="text-gray-600 mb-6">
            The team management system is being built. Coming soon with features like:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto text-left">
            <div className="text-sm text-gray-600">
              • Team members
            </div>
            <div className="text-sm text-gray-600">
              • Role permissions
            </div>
            <div className="text-sm text-gray-600">
              • Performance tracking
            </div>
            <div className="text-sm text-gray-600">
              • Team goals
            </div>
            <div className="text-sm text-gray-600">
              • Activity monitoring
            </div>
            <div className="text-sm text-gray-600">
              • Coaching tools
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