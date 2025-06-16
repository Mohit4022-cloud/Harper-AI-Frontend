// Dashboard data fetching functions
// These functions simulate API calls and can be replaced with actual API endpoints

export type Metric = {
  title: string
  value: string
  change: string
  icon: string
  color: string
  bgColor: string
}

export type Activity = {
  id: number
  type: 'call' | 'email' | 'meeting'
  contact: string
  company: string
  time: string
  status: 'completed' | 'sent' | 'scheduled' | 'missed'
}

export type Task = {
  id: number
  task: string
  time: string
  priority: 'high' | 'medium' | 'low'
}

export type TeamMember = {
  name: string
  calls: number
  deals: number
  revenue: string
}

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function fetchDashboardMetrics(): Promise<Metric[]> {
  // Simulate API call with delay
  await delay(1000)
  
  return [
    {
      title: 'Calls Today',
      value: '24',
      change: '+12%',
      icon: 'Phone',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Emails Sent',
      value: '156',
      change: '+8%',
      icon: 'Mail',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'New Leads',
      value: '18',
      change: '+23%',
      icon: 'Users',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Deals Won',
      value: '5',
      change: '+15%',
      icon: 'Target',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
  ]
}

export async function fetchRecentActivities(): Promise<Activity[]> {
  // Simulate API call with delay
  await delay(1500)
  
  return [
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
}

export async function fetchUpcomingTasks(): Promise<Task[]> {
  // Simulate API call with delay
  await delay(800)
  
  return [
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
}

export async function fetchTeamLeaderboard(): Promise<TeamMember[]> {
  // Simulate API call with delay
  await delay(1200)
  
  return [
    { name: 'Sarah Johnson', calls: 45, deals: 8, revenue: '$24,500' },
    { name: 'Mike Davis', calls: 38, deals: 6, revenue: '$18,200' },
    { name: 'Lisa Chen', calls: 35, deals: 5, revenue: '$15,800' },
    { name: 'You', calls: 24, deals: 5, revenue: '$12,400' },
  ]
}