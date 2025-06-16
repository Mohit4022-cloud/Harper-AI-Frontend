'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Phone, 
  Mail, 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  Zap,
  Activity,
  DollarSign,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { useAppStore } from '@/store'

interface Metric {
  id: string
  title: string
  value: number
  change: number
  prefix?: string
  suffix?: string
  icon: React.ElementType
  color: string
  trend: 'up' | 'down' | 'neutral'
}

// Animated number component
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const spring = useSpring(0, { damping: 30, stiffness: 200 })
  const display = useTransform(spring, (current) => 
    `${prefix}${Math.floor(current).toLocaleString()}${suffix}`
  )

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span>{display}</motion.span>
}

// Live activity feed
function ActivityFeed() {
  const activities = useAppStore(state => state.notifications)
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {activities.slice(0, 10).map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "p-3 rounded-lg border",
                  activity.type === 'success' && "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
                  activity.type === 'error' && "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
                  activity.type === 'warning' && "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
                  activity.type === 'info' && "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                )}
              >
                <p className="font-medium text-sm">{activity.title}</p>
                {activity.message && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activity.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          {activities.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Performance gauge
function PerformanceGauge({ value, label }: { value: number; label: string }) {
  const radius = 60
  const strokeWidth = 8
  const normalizedRadius = radius - strokeWidth * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  const getColor = (val: number) => {
    if (val >= 80) return '#10b981' // green
    if (val >= 60) return '#f59e0b' // yellow
    if (val >= 40) return '#f97316' // orange
    return '#ef4444' // red
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <motion.circle
          stroke={getColor(value)}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber value={value} suffix="%" />
        <span className="text-xs text-gray-500 mt-1">{label}</span>
      </div>
    </div>
  )
}

// Real-time chart
function RealtimeChart() {
  const [data, setData] = useState<number[]>(Array(20).fill(0))
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Simulate real-time data
    intervalRef.current = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1), Math.floor(Math.random() * 100)]
        return newData
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const max = Math.max(...data, 1)
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - (value / max) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox="0 0 100 100" className="w-full h-32" preserveAspectRatio="none">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9333ea" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#9333ea" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polyline
        fill="none"
        stroke="#9333ea"
        strokeWidth="2"
        points={points}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.polygon
        fill="url(#gradient)"
        points={`0,100 ${points} 100,100`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
    </svg>
  )
}

export function AnimatedDashboard() {
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: queryKeys.analytics.dashboard(),
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        metrics: [
          { id: 'calls', title: 'Total Calls', value: 1247, change: 12.5, icon: Phone, color: 'text-green-600', trend: 'up' as const },
          { id: 'emails', title: 'Emails Sent', value: 3892, change: -5.2, icon: Mail, color: 'text-blue-600', trend: 'down' as const },
          { id: 'conversion', title: 'Conversion Rate', value: 23.8, change: 3.1, suffix: '%', icon: TrendingUp, color: 'text-purple-600', trend: 'up' as const },
          { id: 'contacts', title: 'New Contacts', value: 489, change: 18.7, icon: Users, color: 'text-orange-600', trend: 'up' as const },
          { id: 'avgCall', title: 'Avg Call Time', value: 4.2, change: -8.3, suffix: 'm', icon: Clock, color: 'text-pink-600', trend: 'down' as const },
          { id: 'pipeline', title: 'Pipeline Value', value: 847500, change: 24.9, prefix: '$', icon: DollarSign, color: 'text-emerald-600', trend: 'up' as const },
        ],
        performance: {
          callSuccess: 78,
          emailOpen: 45,
          responseRate: 62,
          leadScore: 85,
        },
        weeklyTrend: [45, 52, 38, 65, 72, 58, 81],
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        ))}
      </div>
    )
  }

  const metrics = dashboardData?.metrics || []
  const performance = dashboardData?.performance || {
    callSuccess: 0,
    emailOpen: 0,
    responseRate: 0,
    leadScore: 0
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold">
                      <AnimatedNumber 
                        value={metric.value} 
                        prefix={metric.prefix} 
                        suffix={metric.suffix} 
                      />
                    </p>
                    <div className="flex items-center gap-1">
                      <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: metric.trend === 'up' ? -45 : 45 }}
                        className={cn(
                          "text-sm font-medium",
                          metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {metric.trend === 'up' ? '↑' : '↓'}
                      </motion.div>
                      <span className={cn(
                        "text-sm",
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      )}>
                        {Math.abs(metric.change)}%
                      </span>
                    </div>
                  </div>
                  <div className={cn("p-3 rounded-full bg-gray-100 dark:bg-gray-800", metric.color)}>
                    <metric.icon className="h-6 w-6" />
                  </div>
                </div>
                
                {/* Background decoration */}
                <motion.div
                  className="absolute -right-8 -bottom-8 opacity-5"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <metric.icon className="h-32 w-32" />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Performance and Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Gauges */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <PerformanceGauge value={performance?.callSuccess || 0} label="Call Success" />
              <PerformanceGauge value={performance?.emailOpen || 0} label="Email Open" />
              <PerformanceGauge value={performance?.responseRate || 0} label="Response Rate" />
              <PerformanceGauge value={performance?.leadScore || 0} label="Lead Score" />
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <ActivityFeed />
      </div>

      {/* Real-time Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Activity
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RealtimeChart />
        </CardContent>
      </Card>
    </div>
  )
}