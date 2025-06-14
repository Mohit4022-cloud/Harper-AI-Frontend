'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Phone,
  Mail,
  Users,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  DollarSign,
  Award,
  Activity,
} from 'lucide-react'

const metrics = [
  {
    title: 'Calls Today',
    value: '24',
    change: '+12%',
    icon: Phone,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Emails Sent',
    value: '156',
    change: '+8%',
    icon: Mail,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'New Leads',
    value: '18',
    change: '+23%',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: 'Deals Won',
    value: '5',
    change: '+15%',
    icon: Target,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
]

const recentActivities = [
  {
    id: 1,
    type: 'call',
    contact: 'John Smith',
    company: 'Acme Corp',
    time: '2 minutes ago',
    status: 'completed',
  },
  {
    id: 2,
    type: 'email',
    contact: 'Sarah Johnson',
    company: 'TechStart Inc',
    time: '15 minutes ago',
    status: 'sent',
  },
  {
    id: 3,
    type: 'meeting',
    contact: 'Mike Davis',
    company: 'Growth Co',
    time: '1 hour ago',
    status: 'scheduled',
  },
  {
    id: 4,
    type: 'call',
    contact: 'Lisa Chen',
    company: 'Innovation Labs',
    time: '2 hours ago',
    status: 'missed',
  },
]

const upcomingTasks = [
  {
    id: 1,
    task: 'Follow up with John Smith',
    time: '10:30 AM',
    priority: 'high',
  },
  {
    id: 2,
    task: 'Demo call with TechStart',
    time: '2:00 PM',
    priority: 'high',
  },
  {
    id: 3,
    task: 'Send proposal to Growth Co',
    time: '4:30 PM',
    priority: 'medium',
  },
  {
    id: 4,
    task: 'Weekly team meeting',
    time: '5:00 PM',
    priority: 'low',
  },
]

export default function DashboardPage() {
  // Debug logging for production issues
  if (typeof window !== 'undefined') {
    console.log('🏠 Dashboard loaded successfully')
    
    // Check for potential null data issues
    const hasInvalidActivity = recentActivities.some(activity => !activity || !activity.type)
    const hasInvalidTask = upcomingTasks.some(task => !task || !task.id)
    
    if (hasInvalidActivity) console.warn('⚠️ Found invalid activity data')
    if (hasInvalidTask) console.warn('⚠️ Found invalid task data')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your performance overview.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today
          </Button>
          <Button className="gradient-purple-pink hover:opacity-90">
            <Phone className="h-4 w-4 mr-2" />
            Start Calling
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                  <p className="text-sm text-green-600 mt-1">{metric.change} from yesterday</p>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-white">
                      {activity?.type === 'call' && <Phone className="h-4 w-4 text-blue-600" />}
                      {activity?.type === 'email' && <Mail className="h-4 w-4 text-green-600" />}
                      {activity?.type === 'meeting' && <Calendar className="h-4 w-4 text-purple-600" />}
                      {!activity?.type && <Activity className="h-4 w-4 text-gray-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity?.contact || 'Unknown Contact'}</p>
                      <p className="text-sm text-gray-600">{activity?.company || 'Unknown Company'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{activity?.time || 'Unknown time'}</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activity?.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : activity?.status === 'sent'
                          ? 'bg-blue-100 text-blue-800'
                          : activity?.status === 'scheduled'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {activity?.status || 'unknown'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task?.id || Math.random()} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{task?.task || 'Unknown task'}</p>
                    <p className="text-xs text-gray-500 mt-1">{task?.time || 'No time set'}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      task?.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : task?.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {task?.priority || 'low'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Chart component will be implemented here with Recharts</p>
          </div>
        </CardContent>
      </Card>

      {/* Team Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Team Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Sarah Johnson', calls: 45, deals: 8, revenue: '$24,500' },
              { name: 'Mike Davis', calls: 38, deals: 6, revenue: '$18,200' },
              { name: 'Lisa Chen', calls: 35, deals: 5, revenue: '$15,800' },
              { name: 'You', calls: 24, deals: 5, revenue: '$12,400' },
            ].map((member, index) => (
              <div key={member.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.calls} calls made</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{member.revenue}</p>
                  <p className="text-sm text-gray-600">{member.deals} deals won</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}