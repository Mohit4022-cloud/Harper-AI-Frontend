'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePerformanceMonitoring } from '@/lib/performance'
import { cn } from '@/lib/utils'
import {
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  Globe,
  BarChart3,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface PerformanceDashboardProps {
  isOpen: boolean
  onClose: () => void
}

export function PerformanceDashboard({ isOpen, onClose }: PerformanceDashboardProps) {
  const { metrics } = usePerformanceMonitoring()
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  
  const webVitals = metrics.filter(m => 
    ['CLS', 'FID', 'FCP', 'LCP', 'TTFB', 'INP'].includes(m.name)
  )
  
  const customMetrics = metrics.filter(m => 
    !['CLS', 'FID', 'FCP', 'LCP', 'TTFB', 'INP'].includes(m.name)
  )
  
  const getMetricIcon = (name: string) => {
    switch (name) {
      case 'CLS': return Activity
      case 'FID': return Zap
      case 'FCP': return Clock
      case 'LCP': return Globe
      case 'TTFB': return HardDrive
      case 'INP': return Cpu
      case 'memory-usage': return HardDrive
      case 'virtual-scroll-fps': return Activity
      case 'api-call': return Globe
      case 'react-render': return Zap
      default: return BarChart3
    }
  }
  
  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'good': return 'text-green-500 bg-green-50'
      case 'needs-improvement': return 'text-yellow-500 bg-yellow-50'
      case 'poor': return 'text-red-500 bg-red-50'
      default: return 'text-gray-500 bg-gray-50'
    }
  }
  
  const formatValue = (name: string, value: number) => {
    switch (name) {
      case 'CLS': return value.toFixed(3)
      case 'FID':
      case 'FCP':
      case 'LCP':
      case 'TTFB':
      case 'INP': return `${Math.round(value)}ms`
      case 'memory-usage': return `${value.toFixed(1)}MB`
      case 'virtual-scroll-fps': return `${Math.round(value)}fps`
      case 'api-call':
      case 'react-render': return `${Math.round(value)}ms`
      default: return value.toFixed(2)
    }
  }
  
  const getMetricDescription = (name: string) => {
    switch (name) {
      case 'CLS': return 'Cumulative Layout Shift'
      case 'FID': return 'First Input Delay'
      case 'FCP': return 'First Contentful Paint'
      case 'LCP': return 'Largest Contentful Paint'
      case 'TTFB': return 'Time to First Byte'
      case 'INP': return 'Interaction to Next Paint'
      case 'memory-usage': return 'JavaScript Heap Usage'
      case 'virtual-scroll-fps': return 'Virtual Table Frame Rate'
      case 'api-call': return 'API Response Time'
      case 'react-render': return 'Component Render Time'
      default: return name
    }
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold">Performance Dashboard</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time performance metrics and monitoring
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Web Vitals */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Core Web Vitals
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {webVitals.map((metric) => (
                    <MetricCard
                      key={metric.name}
                      metric={metric}
                      icon={getMetricIcon(metric.name)}
                      description={getMetricDescription(metric.name)}
                      formatValue={formatValue}
                      getRatingColor={getRatingColor}
                      isSelected={selectedMetric === metric.name}
                      onClick={() => setSelectedMetric(
                        selectedMetric === metric.name ? null : metric.name
                      )}
                    />
                  ))}
                </div>
              </div>
              
              {/* Custom Metrics */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Application Metrics
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {customMetrics.map((metric) => (
                    <MetricCard
                      key={metric.id}
                      metric={metric}
                      icon={getMetricIcon(metric.name)}
                      description={getMetricDescription(metric.name)}
                      formatValue={formatValue}
                      getRatingColor={getRatingColor}
                      isSelected={selectedMetric === metric.id}
                      onClick={() => setSelectedMetric(
                        selectedMetric === metric.id ? null : metric.id
                      )}
                    />
                  ))}
                </div>
              </div>
              
              {/* Selected Metric Details */}
              {selectedMetric && (
                <MetricDetails
                  metric={metrics.find(m => m.name === selectedMetric || m.id === selectedMetric)!}
                  formatValue={formatValue}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MetricCard({
  metric,
  icon: Icon,
  description,
  formatValue,
  getRatingColor,
  isSelected,
  onClick,
}: {
  metric: any
  icon: any
  description: string
  formatValue: (name: string, value: number) => string
  getRatingColor: (rating?: string) => string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.name}
            </CardTitle>
            <div className={cn(
              "p-2 rounded-lg",
              getRatingColor(metric.rating)
            )}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {formatValue(metric.name, metric.value)}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
            {metric.rating && (
              <Badge
                variant={
                  metric.rating === 'good' ? 'success' :
                  metric.rating === 'needs-improvement' ? 'warning' :
                  'destructive'
                }
                className="text-xs"
              >
                {metric.rating}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function MetricDetails({
  metric,
  formatValue,
}: {
  metric: any
  formatValue: (name: string, value: number) => string
}) {
  const getThresholds = (name: string) => {
    switch (name) {
      case 'CLS':
        return { good: 0.1, poor: 0.25 }
      case 'FID':
        return { good: 100, poor: 300 }
      case 'FCP':
        return { good: 1800, poor: 3000 }
      case 'LCP':
        return { good: 2500, poor: 4000 }
      case 'TTFB':
        return { good: 800, poor: 1800 }
      case 'INP':
        return { good: 200, poor: 500 }
      case 'memory-usage':
        return { good: 50, poor: 100 }
      case 'virtual-scroll-fps':
        return { good: 55, poor: 30 }
      default:
        return { good: 1000, poor: 3000 }
    }
  }
  
  const thresholds = getThresholds(metric.name)
  const percentage = metric.name === 'CLS' 
    ? (metric.value / thresholds.poor) * 100
    : metric.name === 'virtual-scroll-fps'
    ? (metric.value / 60) * 100
    : ((thresholds.poor - metric.value) / thresholds.poor) * 100
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="mt-8 p-6 bg-muted/20 rounded-lg"
    >
      <h4 className="text-lg font-semibold mb-4">Metric Details</h4>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Current Value</p>
          <p className="text-3xl font-bold">
            {formatValue(metric.name, metric.value)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground mb-2">Performance Score</p>
          <Progress value={Math.max(0, Math.min(100, percentage))} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Good: {formatValue(metric.name, thresholds.good)}</span>
            <span>Poor: {formatValue(metric.name, thresholds.poor)}</span>
          </div>
        </div>
      </div>
      
      {metric.id && metric.id.includes('/api/') && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">API Endpoint</p>
          <code className="text-xs bg-muted px-2 py-1 rounded">{metric.id}</code>
        </div>
      )}
      
      <div className="mt-4 flex items-center gap-2">
        {metric.rating === 'good' && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Performance is optimal</span>
          </div>
        )}
        {metric.rating === 'needs-improvement' && (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Consider optimization</span>
          </div>
        )}
        {metric.rating === 'poor' && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Immediate optimization needed</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}