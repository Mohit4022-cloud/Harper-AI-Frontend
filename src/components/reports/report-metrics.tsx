import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Mail, Calendar, Target, DollarSign, TrendingUp } from 'lucide-react'
import { fetchReportMetrics } from '@/lib/data/reports'

export async function ReportMetrics({ period = 'week' }: { period?: string }) {
  const metrics = await fetchReportMetrics(period)

  const metricsDisplay = [
    {
      title: 'Total Calls',
      value: metrics.totalCalls.toString(),
      icon: Phone,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Emails Sent',
      value: metrics.totalEmails.toString(),
      icon: Mail,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Meetings Booked',
      value: metrics.meetingsBooked.toString(),
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Deals Won',
      value: metrics.dealsWon.toString(),
      icon: Target,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
    {
      title: 'Revenue',
      value: `$${(metrics.revenue / 1000).toFixed(0)}k`,
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    },
    {
      title: 'Conversion Rate',
      value: `${metrics.conversionRate}%`,
      icon: TrendingUp,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metricsDisplay.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className={`p-3 rounded-full ${metric.bgColor} mb-3`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metric.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{metric.title}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}