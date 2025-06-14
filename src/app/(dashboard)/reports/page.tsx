'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Download, 
  Filter, 
  Calendar, 
  RefreshCw, 
  FileText, 
  BarChart3,
  TrendingUp,
  Brain,
  Loader2,
} from 'lucide-react'
import { useReportsStore } from '@/stores/reportsStore'
import { MetricsGrid } from '@/components/reports/MetricsGrid'
import { PerformanceScore } from '@/components/reports/PerformanceScore'
import { AIInsights } from '@/components/reports/AIInsights'
import { ActivityChart } from '@/components/reports/ActivityChart'
import { useToast } from '@/components/ui/use-toast'
import { ReportPeriod } from '@/types/reports'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function ReportsPage() {
  const { toast } = useToast()
  const {
    currentReport,
    performanceScore,
    selectedPeriod,
    loading,
    error,
    fetchReport,
    setSelectedPeriod,
    refreshReport,
  } = useReportsStore()

  const [activeTab, setActiveTab] = useState('overview')
  const [isExporting, setIsExporting] = useState(false)

  // Fetch report on mount and period change
  useEffect(() => {
    fetchReport()
  }, [fetchReport, selectedPeriod])

  // Show error if any
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      })
    }
  }, [error, toast])

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true)
    
    try {
      // Simulate export
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      toast({
        title: 'Report exported',
        description: `Your report has been exported as ${format.toUpperCase()}.`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: 'Failed to export report. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const periodOptions: { value: ReportPeriod; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">
            {currentReport
              ? `${format(new Date(currentReport.startDate), 'MMM d')} - ${format(new Date(currentReport.endDate), 'MMM d, yyyy')}`
              : 'Track performance and gain insights'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as ReportPeriod)}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={refreshReport}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
          
          <Button
            onClick={() => handleExport('pdf')}
            disabled={isExporting || !currentReport}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && !currentReport && (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Report Content */}
      {currentReport && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Metrics Grid */}
            <MetricsGrid metrics={currentReport.metrics} />
            
            {/* Activity Chart */}
            <ActivityChart chartData={currentReport.chartData} />
            
            {/* Additional Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Sarah Johnson', 'Mike Chen', 'Emily Davis', 'John Smith'].map((name, index) => (
                      <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{Math.floor(Math.random() * 50 + 50)} calls</p>
                          <p className="text-sm text-gray-500">{Math.floor(Math.random() * 20 + 10)} meetings</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { activity: 'Cold Calls', percentage: 45, color: 'bg-blue-500' },
                      { activity: 'Follow-ups', percentage: 30, color: 'bg-purple-500' },
                      { activity: 'Email Outreach', percentage: 20, color: 'bg-green-500' },
                      { activity: 'Social Selling', percentage: 5, color: 'bg-yellow-500' },
                    ].map((item) => (
                      <div key={item.activity}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.activity}</span>
                          <span className="text-sm text-gray-500">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={cn('h-2 rounded-full', item.color)}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6 mt-6">
            {performanceScore && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ActivityChart chartData={currentReport.chartData} />
                </div>
                <PerformanceScore score={performanceScore} />
              </div>
            )}
            
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{currentReport.metrics.avgResponseTime}h</div>
                  <p className="text-sm text-gray-500 mt-1">Average time to respond</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Follow-up Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{currentReport.metrics.followUpRate}%</div>
                  <p className="text-sm text-gray-500 mt-1">Leads followed up</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lead Velocity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{currentReport.metrics.leadVelocity}</div>
                  <p className="text-sm text-gray-500 mt-1">New leads per day</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AIInsights insights={currentReport.insights} />
              </div>
              <div className="space-y-6">
                {performanceScore && <PerformanceScore score={performanceScore} />}
                
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Best Day</span>
                      <span className="font-medium">Tuesday</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Best Time</span>
                      <span className="font-medium">10-11 AM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Deal Size</span>
                      <span className="font-medium">${currentReport.metrics.avgDealSize.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tasks Done</span>
                      <span className="font-medium">{currentReport.metrics.tasksCompleted}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}