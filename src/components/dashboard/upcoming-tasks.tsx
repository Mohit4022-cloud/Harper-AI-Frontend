import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { fetchUpcomingTasks } from '@/lib/data/dashboard'

export async function UpcomingTasks() {
  const tasks = await fetchUpcomingTasks()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Today's Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{task.task}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{task.time}</p>
              </div>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  task.priority === 'high'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    : task.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}
              >
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}