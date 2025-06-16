import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Phone, Mail, Calendar } from 'lucide-react'
import { fetchRecentActivities } from '@/lib/data/dashboard'

export async function RecentActivity() {
  const activities = await fetchRecentActivities()

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-white dark:bg-gray-700">
                  {activity.type === 'call' && <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                  {activity.type === 'email' && <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />}
                  {activity.type === 'meeting' && <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{activity.contact}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{activity.company}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    activity.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : activity.status === 'sent'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      : activity.status === 'scheduled'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}
                >
                  {activity.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}