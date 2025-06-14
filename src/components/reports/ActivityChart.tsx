'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartDataPoint } from '@/types/reports'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format } from 'date-fns'

interface ActivityChartProps {
  chartData: {
    calls: ChartDataPoint[]
    meetings: ChartDataPoint[]
    revenue: ChartDataPoint[]
    contacts: ChartDataPoint[]
  }
}

export function ActivityChart({ chartData }: ActivityChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<'calls' | 'meetings' | 'revenue' | 'contacts'>('calls')
  
  const getChartConfig = () => {
    switch (selectedMetric) {
      case 'calls':
        return {
          data: chartData.calls,
          color: '#3b82f6',
          label: 'Calls',
          format: (value: number) => value.toString(),
          type: 'bar' as const,
        }
      case 'meetings':
        return {
          data: chartData.meetings,
          color: '#8b5cf6',
          label: 'Meetings',
          format: (value: number) => value.toString(),
          type: 'bar' as const,
        }
      case 'revenue':
        return {
          data: chartData.revenue,
          color: '#10b981',
          label: 'Revenue',
          format: (value: number) => `$${(value / 1000).toFixed(0)}k`,
          type: 'line' as const,
        }
      case 'contacts':
        return {
          data: chartData.contacts,
          color: '#f59e0b',
          label: 'Contacts',
          format: (value: number) => value.toString(),
          type: 'line' as const,
        }
    }
  }

  const config = getChartConfig()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            {config.label}: <span className="font-bold">{config.format(payload[0].value)}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Trends</CardTitle>
          <Tabs value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as any)}>
            <TabsList>
              <TabsTrigger value="calls">Calls</TabsTrigger>
              <TabsTrigger value="meetings">Meetings</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {config.type === 'bar' ? (
              <BarChart data={config.data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={config.format}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill={config.color}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart data={config.data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={config.format}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={config.color}
                  strokeWidth={2}
                  dot={{ fill: config.color, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}