'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  TrendingUp, 
  AlertCircle, 
  Lightbulb, 
  Trophy, 
  ChevronUp, 
  ChevronDown,
  Info,
} from 'lucide-react'
import { AIInsight } from '@/types/reports'
import { cn } from '@/lib/utils'

interface AIInsightsProps {
  insights: AIInsight[]
}

export function AIInsights({ insights }: AIInsightsProps) {
  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'trend':
        return TrendingUp
      case 'alert':
        return AlertCircle
      case 'recommendation':
        return Lightbulb
      case 'achievement':
        return Trophy
      default:
        return Info
    }
  }

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'trend':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'alert':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'recommendation':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'achievement':
        return 'bg-green-50 text-green-700 border-green-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const sortedInsights = [...insights].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Insights</CardTitle>
          <Badge variant="secondary">{insights.length} insights</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {sortedInsights.map((insight) => {
              const Icon = getInsightIcon(insight.type)
              const hasPositiveChange = insight.change && insight.change > 0
              
              return (
                <div
                  key={insight.id}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all hover:shadow-md',
                    getInsightColor(insight.type)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge 
                          variant="secondary" 
                          className={cn('text-xs', getPriorityColor(insight.priority))}
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm opacity-90">{insight.description}</p>
                      
                      {insight.change !== undefined && (
                        <div className="flex items-center gap-1 mt-2">
                          {hasPositiveChange ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium">
                            {hasPositiveChange ? '+' : ''}{insight.change}%{' '}
                            {insight.metric && `in ${insight.metric.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}