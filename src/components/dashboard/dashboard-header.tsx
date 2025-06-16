'use client'

import { Button } from '@/components/ui/button'
import { Calendar, Phone } from 'lucide-react'

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's your performance overview.</p>
      </div>
      <div className="flex items-center space-x-3">
        <Button variant="outline" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Today
        </Button>
        <Button className="gradient-purple-pink hover:opacity-90">
          <Phone className="h-4 w-4 mr-2" />
          Start Calling
        </Button>
      </div>
    </div>
  )
}