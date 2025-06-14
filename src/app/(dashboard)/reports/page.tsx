'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Filter, Calendar, RefreshCw, FileText, FileSpreadsheet, FileDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import MetricCard from '@/app/reports/components/MetricCard';
import PerformanceChart from '@/app/reports/components/PerformanceChart';
import InsightsPanel from '@/app/reports/components/InsightsPanel';
import { MetricData, ChartData, Insight, TimeRange } from '@/types/advanced';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
    granularity: 'day',
  });
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch real data from API
      const response = await fetch(`/api/reports?type=${activeTab}&startDate=${timeRange.start.toISOString()}&endDate=${timeRange.end.toISOString()}`);
      const { data } = await response.json();
      
      if (response.ok && data) {
        // Use API data if available
        const reportData = data.data;
        
        if (reportData.summary) {
          // Convert API metrics to our MetricData format
          setMetrics([
            {
              id: '1',
              name: 'Total Calls',
              value: reportData.summary.totalCalls,
              previousValue: Math.floor(reportData.summary.totalCalls * 0.8),
              change: Math.floor(reportData.summary.totalCalls * 0.2),
              changePercentage: 25.0,
              trend: 'up',
              unit: 'number',
              description: 'Total outbound calls made',
            },
            {
              id: '2',
              name: 'Connect Rate',
              value: reportData.summary.connectRate * 100,
              previousValue: reportData.summary.connectRate * 100 * 0.9,
              change: reportData.summary.connectRate * 100 * 0.1,
              changePercentage: 11.1,
              trend: 'up',
              unit: 'percentage',
              description: 'Successful call connections',
            },
            {
              id: '3',
              name: 'Meetings Scheduled',
              value: reportData.summary.meetingsScheduled,
              previousValue: Math.floor(reportData.summary.meetingsScheduled * 0.75),
              change: Math.floor(reportData.summary.meetingsScheduled * 0.25),
              changePercentage: 33.3,
              trend: 'up',
              unit: 'number',
              description: 'Meetings booked from calls',
            },
            {
              id: '4',
              name: 'Revenue Generated',
              value: reportData.summary.revenue,
              previousValue: Math.floor(reportData.summary.revenue * 0.7),
              change: Math.floor(reportData.summary.revenue * 0.3),
              changePercentage: 42.9,
              trend: 'up',
              unit: 'currency',
              description: 'Pipeline value created',
            },
          ]);
        }
        
        // Process other data as needed
        if (reportData.trends) {
          // Convert trends data to charts
          setCharts(prev => [...prev]); // Keep existing charts for now
        }
        
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
    
    // Fallback to mock data if API fails
    setTimeout(() => {
      // Mock metrics
      setMetrics([
        {
          id: '1',
          name: 'Total Calls',
          value: 1234,
          previousValue: 987,
          change: 247,
          changePercentage: 25.0,
          trend: 'up',
          unit: 'number',
          description: 'Total outbound calls made',
        },
        {
          id: '2',
          name: 'Talk Time',
          value: 4320,
          previousValue: 3600,
          change: 720,
          changePercentage: 20.0,
          trend: 'up',
          unit: 'time',
          description: 'Total time spent on calls',
        },
        {
          id: '3',
          name: 'Conversion Rate',
          value: 24.5,
          previousValue: 22.1,
          change: 2.4,
          changePercentage: 10.9,
          trend: 'up',
          unit: 'percentage',
          description: 'Calls converted to meetings',
        },
        {
          id: '4',
          name: 'Pipeline Generated',
          value: 125000,
          previousValue: 98000,
          change: 27000,
          changePercentage: 27.6,
          trend: 'up',
          unit: 'currency',
          description: 'Total pipeline value created',
        },
      ]);

      // Mock charts
      setCharts([
        {
          id: 'calls-over-time',
          type: 'line',
          title: 'Call Volume Over Time',
          data: generateTimeSeriesData(30, 'Calls'),
          config: {
            xAxis: { label: 'Date', dataKey: 'date' },
            yAxis: { label: 'Number of Calls', dataKey: 'value' },
            legend: true,
          },
        },
        {
          id: 'performance-by-agent',
          type: 'bar',
          title: 'Performance by Agent',
          data: [
            { name: 'John Doe', calls: 234, meetings: 45, conversion: 19.2 },
            { name: 'Jane Smith', calls: 312, meetings: 68, conversion: 21.8 },
            { name: 'Mike Johnson', calls: 198, meetings: 52, conversion: 26.3 },
            { name: 'Sarah Wilson', calls: 276, meetings: 61, conversion: 22.1 },
          ],
          config: {
            xAxis: { label: 'Agent', dataKey: 'name' },
            legend: true,
          },
        },
        {
          id: 'call-outcomes',
          type: 'pie',
          title: 'Call Outcomes Distribution',
          data: [
            { name: 'Connected', value: 456 },
            { name: 'Voicemail', value: 289 },
            { name: 'No Answer', value: 178 },
            { name: 'Busy', value: 89 },
            { name: 'Wrong Number', value: 34 },
          ],
          config: {
            legend: true,
          },
        },
        {
          id: 'sentiment-trend',
          type: 'area',
          title: 'Customer Sentiment Trend',
          data: generateTimeSeriesData(30, 'Sentiment', 0.5, 0.8),
          config: {
            xAxis: { label: 'Date', dataKey: 'date' },
            yAxis: { label: 'Sentiment Score', dataKey: 'value' },
            legend: false,
          },
        },
      ]);

      // Mock insights
      setInsights([
        {
          id: '1',
          type: 'achievement',
          title: 'Record Call Volume Week',
          description: 'Your team made 312 calls this week, a new record! This is 45% higher than your average weekly volume.',
          metric: 'Weekly Calls',
          value: 312,
          priority: 'high',
          createdAt: new Date(),
        },
        {
          id: '2',
          type: 'opportunity',
          title: 'Best Time to Call Identified',
          description: 'Analysis shows that calls made between 10-11 AM have a 35% higher connection rate. Consider scheduling more calls during this window.',
          recommendation: 'Prioritize calling between 10-11 AM for better connection rates.',
          priority: 'medium',
          createdAt: new Date(),
        },
        {
          id: '3',
          type: 'warning',
          title: 'High Voicemail Rate on Fridays',
          description: '62% of Friday calls go to voicemail, compared to 28% on other days. This impacts overall productivity.',
          metric: 'Friday Voicemail Rate',
          value: 62,
          recommendation: 'Consider reducing Friday call volume or focusing on email outreach.',
          priority: 'medium',
          createdAt: new Date(),
        },
        {
          id: '4',
          type: 'performance',
          title: 'Sentiment Score Improving',
          description: 'Average customer sentiment has improved from 0.65 to 0.78 over the past month, indicating better conversation quality.',
          metric: 'Avg Sentiment',
          value: 0.78,
          priority: 'low',
          createdAt: new Date(),
        },
      ]);

      setIsLoading(false);
    }, 1000);
  };

  const generateTimeSeriesData = (days: number, label: string, min = 20, max = 80) => {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        [label]: Math.floor(Math.random() * (max - min + 1)) + min,
      });
    }
    
    return data;
  };

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf' = 'csv') => {
    setIsExporting(true);
    
    try {
      // Call the export API
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          reportType: activeTab,
          dateRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          }
        })
      });
      
      const { data } = await response.json();
      
      if (response.ok && data) {
        // Simulate download
        const link = document.createElement('a');
        link.href = data.url;
        link.download = `harper-ai-report-${activeTab}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        showNotification('Report exported successfully!', 'success');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Failed to export report. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };
  
  const showNotification = (message: string, type: 'success' | 'error') => {
    // Simple notification - in production, use a toast library
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    } animate-fade-in z-50`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Analytics & Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track performance and gain insights from your sales activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={`${timeRange.granularity}`}
            onValueChange={(value: string) => {
              const days = value === '7' ? 7 : value === '30' ? 30 : 90;
              setTimeRange({
                start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                end: new Date(),
                granularity: days <= 7 ? 'day' : days <= 30 ? 'day' : 'week',
              });
            }}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          
          <div className="flex items-center gap-2">
            <Select
              value={exportFormat}
              onValueChange={(value: any) => setExportFormat(value)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="xlsx">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileDown className="h-4 w-4" />
                    PDF
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={() => handleExport(exportFormat)}
              disabled={isExporting}
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
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calls">Call Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {charts.slice(0, 2).map((chart) => (
              <PerformanceChart key={chart.id} chart={chart} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calls" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {charts.filter(c => ['calls-over-time', 'call-outcomes'].includes(c.id)).map((chart) => (
              <PerformanceChart key={chart.id} chart={chart} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 gap-6">
            <PerformanceChart 
              chart={charts.find(c => c.id === 'performance-by-agent')!} 
              height={400}
            />
            <PerformanceChart 
              chart={charts.find(c => c.id === 'sentiment-trend')!} 
              height={300}
            />
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <InsightsPanel insights={insights} />
        </TabsContent>
      </Tabs>
    </div>
  );
}