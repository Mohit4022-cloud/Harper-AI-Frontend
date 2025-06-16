import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { fetchContactStats } from '@/lib/data/contacts'

export async function ContactStats() {
  const stats = await fetchContactStats()

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Contacts</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-green-600 dark:bg-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Prospects</p>
              <p className="text-2xl font-bold">{stats.prospects}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customers</p>
              <p className="text-2xl font-bold">{stats.customers}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-purple-600 dark:bg-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}