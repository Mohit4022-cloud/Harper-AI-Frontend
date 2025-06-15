'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRealtimeMetrics } from '@/hooks/use-realtime-metrics'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  Phone, 
  Users, 
  Clock,
  Target,
  Activity,
  BarChart3,
  Zap,
  Heart,
} from 'lucide-react'

export function RealtimeMetrics() {
  const { metrics, previousMetrics, isLoading } = useRealtimeMetrics()
  
  if (isLoading) {
    return <MetricsSkeleton />
  }
  
  const cards = [
    {
      title: 'Active Calls',
      value: metrics.activeCalls,
      previous: previousMetrics.activeCalls,
      icon: Phone,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      description: 'Calls in progress',
      format: (val: number) => val.toString(),
    },
    {
      title: 'Contacts Reached',
      value: metrics.contactsReached,
      previous: previousMetrics.contactsReached,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      description: 'Today',
      format: (val: number) => val.toLocaleString(),
    },
    {
      title: 'Avg Call Duration',
      value: metrics.averageCallDuration,
      previous: previousMetrics.averageCallDuration,
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      description: 'Minutes',
      format: (val: number) => `${Math.round(val / 60)}m`,
    },
    {
      title: 'Conversion Rate',
      value: metrics.conversionRate,
      previous: previousMetrics.conversionRate,
      icon: Target,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      description: 'Success rate',
      format: (val: number) => `${(val * 100).toFixed(1)}%`,
    },
    {
      title: 'Sentiment Score',
      value: metrics.sentimentAverage,
      previous: previousMetrics.sentimentAverage,
      icon: Heart,
      color: 'text-pink-500',
      bgColor: 'bg-pink-50',
      description: 'Average mood',
      format: (val: number) => `${(val * 100).toFixed(0)}%`,
    },
    {
      title: 'Active Users',
      value: metrics.activeUsers,
      previous: previousMetrics.activeUsers,
      icon: Activity,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      description: 'Online now',
      format: (val: number) => val.toString(),
    },
  ]
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            delay: index * 0.1,
            ease: "easeOut"
          }}
        >
          <MetricCard {...card} />
        </motion.div>
      ))}
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  previous, 
  icon: Icon, 
  color, 
  bgColor, 
  description,
  format 
}: {
  title: string
  value: number
  previous: number
  icon: any
  color: string
  bgColor: string
  description: string
  format: (val: number) => string
}) {
  const change = previous > 0 ? ((value - previous) / previous) * 100 : 0
  const isPositive = change > 0
  const isNeutral = Math.abs(change) < 0.1
  
  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Gradient Background */}
      <div className={cn("absolute inset-0 opacity-5", bgColor)} />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Main Value */}
        <AnimatePresence mode="wait">
          <motion.div
            key={value}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="text-2xl font-bold tracking-tight"
          >
            {format(value)}
          </motion.div>
        </AnimatePresence>
        
        {/* Change Indicator */}
        <div className="flex items-center justify-between">
          <MetricChange
            change={change}
            isPositive={isPositive}
            isNeutral={isNeutral}
          />
          <span className="text-xs text-muted-foreground">
            {description}
          </span>
        </div>
        
        {/* Trend Visualization */}
        <TrendLine 
          current={value} 
          previous={previous} 
          color={color}
        />
      </CardContent>
    </Card>
  )
}

function MetricChange({ 
  change, 
  isPositive, 
  isNeutral 
}: { 
  change: number
  isPositive: boolean
  isNeutral: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        isNeutral ? "text-muted-foreground" :
        isPositive ? "text-green-600" : "text-red-600"
      )}
    >
      {!isNeutral && (
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: isPositive ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <TrendingUp className="h-3 w-3" />
        </motion.div>
      )}
      <span>
        {isNeutral ? "—" : `${isPositive ? "+" : ""}${change.toFixed(1)}%`}
      </span>
      <span className="text-muted-foreground">vs last hour</span>
    </motion.div>
  )
}

function TrendLine({ 
  current, 
  previous, 
  color 
}: { 
  current: number
  previous: number
  color: string
}) {
  const max = Math.max(current, previous)
  const currentPercent = max > 0 ? (current / max) * 100 : 50
  const previousPercent = max > 0 ? (previous / max) * 100 : 50
  
  return (
    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        className={cn("absolute top-0 left-0 h-full rounded-full", color.replace('text-', 'bg-'))}
        initial={{ width: `${previousPercent}%` }}
        animate={{ width: `${currentPercent}%` }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-0 right-0 w-1 h-full bg-background rounded-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      />
    </div>
  )
}

function MetricsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="space-y-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            <div className="flex items-center justify-between">
              <div className="h-4 w-12 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-2 w-full bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Additional real-time charts component
export function RealtimeCharts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <CallVolumeChart />
      <SentimentTrendChart />
    </div>
  )
}

function CallVolumeChart() {
  // Implementation for real-time call volume chart
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Call Volume
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Chart implementation */}
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Real-time call volume chart
        </div>
      </CardContent>
    </Card>
  )
}

function SentimentTrendChart() {
  // Implementation for sentiment trend chart
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Sentiment Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Chart implementation */}
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Real-time sentiment trend chart
        </div>
      </CardContent>
    </Card>
  )
}