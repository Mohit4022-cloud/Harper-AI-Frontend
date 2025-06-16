import { Card, CardContent } from '@/components/ui/card'
import { Phone, Mail, Users, Target } from 'lucide-react'
import { fetchDashboardMetrics } from '@/lib/data/dashboard'

const iconMap = {
  Phone,
  Mail,
  Users,
  Target,
}

export async function MetricsGrid() {
  const metrics = await fetchDashboardMetrics()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => {
        const Icon = iconMap[metric.icon as keyof typeof iconMap]
        return (
          <Card key={metric.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{metric.value}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">{metric.change} from yesterday</p>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}