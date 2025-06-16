import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { MetricsGrid } from '@/components/dashboard/metrics-grid'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks'
import { TeamLeaderboard } from '@/components/dashboard/team-leaderboard'
import {
  MetricsGridSkeleton,
  RecentActivitySkeleton,
  UpcomingTasksSkeleton,
  TeamLeaderboardSkeleton,
} from '@/components/dashboard/loading-skeletons'

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header - Client Component for interactivity */}
      <DashboardHeader />

      {/* Metrics Grid - Server Component with Suspense */}
      <Suspense fallback={<MetricsGridSkeleton />}>
        <MetricsGrid />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity - Server Component with Suspense */}
        <Suspense fallback={<RecentActivitySkeleton />}>
          <RecentActivity />
        </Suspense>

        {/* Upcoming Tasks - Server Component with Suspense */}
        <Suspense fallback={<UpcomingTasksSkeleton />}>
          <UpcomingTasks />
        </Suspense>
      </div>

      {/* Performance Chart - Static for now */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Chart component will be implemented here with Recharts</p>
          </div>
        </CardContent>
      </Card>

      {/* Team Leaderboard - Server Component with Suspense */}
      <Suspense fallback={<TeamLeaderboardSkeleton />}>
        <TeamLeaderboard />
      </Suspense>
    </div>
  )
}