'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Filter, Calendar, RefreshCw } from 'lucide-react';
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

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    // Simulate loading data - in production, this would be an API call
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

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting report...');
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
          
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
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