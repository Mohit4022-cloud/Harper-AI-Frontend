'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { MetricsOverview } from '@/components/dashboard/metrics-overview'
import { RecentCalls } from '@/components/dashboard/recent-calls'
import { ContactsPreview } from '@/components/dashboard/contacts-preview'
import { PerformanceWidget } from '@/components/performance/performance-widget'
import { usePerformanceInit } from '@/hooks/use-performance-init'

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  usePerformanceInit()

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your sales performance.
          </p>
        </div>

        <MetricsOverview />
        
        <div className="grid gap-8 md:grid-cols-2">
          <RecentCalls />
          <ContactsPreview />
        </div>

        <PerformanceWidget />
      </div>
    </DashboardLayout>
  )
}