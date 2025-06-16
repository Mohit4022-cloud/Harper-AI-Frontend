import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function ReportMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mb-3" />
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function PerformanceSummarySkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}