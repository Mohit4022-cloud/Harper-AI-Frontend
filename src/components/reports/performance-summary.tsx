import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { fetchPerformanceData } from '@/lib/data/reports'
import { cn } from '@/lib/utils'

export async function PerformanceSummary({ period = 'week' }: { period?: string }) {
  const performance = await fetchPerformanceData(period)

  const getTrendIcon = () => {
    switch (performance.trend) {
      case 'up':
        return <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'down':
        return <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400" />
      default:
        return <Minus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const getCategoryColor = () => {
    switch (performance.category) {
      case 'excellent':
        return 'text-green-600 dark:text-green-400'
      case 'good':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-yellow-600 dark:text-yellow-400'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                {performance.score}
              </span>
              <span className="text-lg text-gray-600 dark:text-gray-400">/ 100</span>
            </div>
            <p className={cn('text-sm font-medium mt-1 capitalize', getCategoryColor())}>
              {performance.category.replace('-', ' ')}
            </p>
          </div>
          <div className="flex flex-col items-center">
            {getTrendIcon()}
            <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              vs last {period}
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={cn(
                'h-3 rounded-full transition-all duration-500',
                performance.score >= 80 ? 'bg-green-600 dark:bg-green-400' :
                performance.score >= 60 ? 'bg-blue-600 dark:bg-blue-400' :
                'bg-yellow-600 dark:bg-yellow-400'
              )}
              style={{ width: `${performance.score}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}