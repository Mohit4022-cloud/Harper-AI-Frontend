'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Activity, Users, Target, Zap } from 'lucide-react'
import { PerformanceScore as IPerformanceScore } from '@/types/reports'
import { cn } from '@/lib/utils'

interface PerformanceScoreProps {
  score: IPerformanceScore
}

export function PerformanceScore({ score }: PerformanceScoreProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600'
    if (value >= 60) return 'text-yellow-600'
    if (value >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-600'
    if (value >= 60) return 'bg-yellow-600'
    if (value >= 40) return 'bg-orange-600'
    return 'bg-red-600'
  }

  const getTrendIcon = () => {
    switch (score.trend) {
      case 'up':
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'down':
        return <TrendingDown className="h-5 w-5 text-red-600" />
      default:
        return <Minus className="h-5 w-5 text-gray-500" />
    }
  }

  const categories = [
    {
      name: 'Activity',
      score: score.categories.activity,
      icon: Activity,
      description: 'Calls, emails, and tasks completed',
    },
    {
      name: 'Engagement',
      score: score.categories.engagement,
      icon: Users,
      description: 'Connect rates and response rates',
    },
    {
      name: 'Conversion',
      score: score.categories.conversion,
      icon: Target,
      description: 'Meeting bookings and win rates',
    },
    {
      name: 'Efficiency',
      score: score.categories.efficiency,
      icon: Zap,
      description: 'Response times and follow-up rates',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <div className="text-5xl font-bold">
              <span className={getScoreColor(score.overall)}>{score.overall}</span>
              <span className="text-2xl text-gray-400">/100</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            {getTrendIcon()}
            <span className={cn(
              'text-sm font-medium',
              score.trend === 'up' ? 'text-green-600' : 
              score.trend === 'down' ? 'text-red-600' : 'text-gray-500'
            )}>
              {Math.abs(score.changePercent).toFixed(1)}%{' '}
              {score.trend === 'up' ? 'increase' : score.trend === 'down' ? 'decrease' : 'stable'}
            </span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Performance Breakdown</h4>
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <span className={cn('text-sm font-bold', getScoreColor(category.score))}>
                    {category.score}
                  </span>
                </div>
                <Progress 
                  value={category.score} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500">{category.description}</p>
              </div>
            )
          })}
        </div>

        {/* Score Interpretation */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Performance Level:</span>
            <Badge 
              variant={
                score.overall >= 80 ? 'default' :
                score.overall >= 60 ? 'secondary' :
                'destructive'
              }
              className={cn(
                score.overall >= 80 ? 'bg-green-100 text-green-800' :
                score.overall >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              )}
            >
              {score.overall >= 80 ? 'Excellent' :
               score.overall >= 60 ? 'Good' :
               score.overall >= 40 ? 'Needs Improvement' :
               'Poor'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}