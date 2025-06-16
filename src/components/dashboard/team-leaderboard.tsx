import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Award } from 'lucide-react'
import { fetchTeamLeaderboard } from '@/lib/data/dashboard'

export async function TeamLeaderboard() {
  const teamMembers = await fetchTeamLeaderboard()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Team Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamMembers.map((member, index) => (
            <div key={member.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{member.calls} calls made</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-gray-100">{member.revenue}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{member.deals} deals won</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}