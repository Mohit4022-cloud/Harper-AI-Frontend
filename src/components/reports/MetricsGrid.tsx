'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Phone, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Mail,
  Target,
  Clock,
} from 'lucide-react'
import { ReportMetrics } from '@/types/reports'
import { cn } from '@/lib/utils'

interface MetricsGridProps {
  metrics: ReportMetrics
  previousMetrics?: ReportMetrics
}

export function MetricsGrid({ metrics, previousMetrics }: MetricsGridProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getChangeIndicator = (current: number, previous?: number) => {
    if (!previous) return null
    
    const change = ((current - previous) / previous) * 100
    const isPositive = change > 0
    const isNeutral = Math.abs(change) < 1
    
    return {
      value: Math.abs(change).toFixed(1),
      icon: isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown,
      color: isNeutral ? 'text-gray-500 dark:text-gray-400' : isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    }
  }

  const metricCards = [
    {
      title: 'Total Calls',
      value: metrics.totalCalls.toString(),
      icon: Phone,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      change: getChangeIndicator(metrics.totalCalls, previousMetrics?.totalCalls),
      subtext: `${metrics.connectRate}% connect rate`,
    },
    {
      title: 'Meetings Scheduled',
      value: metrics.meetingsScheduled.toString(),
      icon: Calendar,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      change: getChangeIndicator(metrics.meetingsScheduled, previousMetrics?.meetingsScheduled),
      subtext: `${metrics.meetingConversionRate}% conversion`,
    },
    {
      title: 'New Contacts',
      value: metrics.newContacts.toString(),
      icon: Users,
      iconColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      change: getChangeIndicator(metrics.newContacts, previousMetrics?.newContacts),
      subtext: `${metrics.totalContacts} total`,
    },
    {
      title: 'Revenue',
      value: formatCurrency(metrics.revenue),
      icon: DollarSign,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: getChangeIndicator(metrics.revenue, previousMetrics?.revenue),
      subtext: `${metrics.dealsWon} deals closed`,
    },
  ]

  const secondaryMetrics = [
    {
      label: 'Avg Call Duration',
      value: formatDuration(metrics.avgCallDuration),
      icon: Clock,
    },
    {
      label: 'Win Rate',
      value: `${metrics.winRate}%`,
      icon: Target,
    },
    {
      label: 'Emails Sent',
      value: metrics.emailsSent.toString(),
      icon: Mail,
    },
    {
      label: 'Email Reply Rate',
      value: `${metrics.emailReplyRate}%`,
      icon: TrendingUp,
    },
  ]

  return (
    <>
      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    {metric.change && (
                      <div className={cn('flex items-center gap-1', metric.change.color)}>
                        <metric.change.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{metric.change.value}%</span>
                      </div>
                    )}
                  </div>
                  {metric.subtext && (
                    <p className="text-sm text-gray-500 mt-1">{metric.subtext}</p>
                  )}
                </div>
                <div className={cn('p-3 rounded-lg', metric.bgColor)}>
                  <metric.icon className={cn('h-6 w-6', metric.iconColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {secondaryMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">{metric.label}</p>
                  <p className="text-lg font-semibold mt-1">{metric.value}</p>
                </div>
                <metric.icon className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}