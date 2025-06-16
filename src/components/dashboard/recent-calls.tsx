'use client'

export function RecentCalls() {
  const calls = [
    {
      id: '1',
      contact: 'John Doe',
      duration: '5:23',
      time: '10 minutes ago',
      status: 'completed',
    },
    {
      id: '2',
      contact: 'Jane Smith',
      duration: '3:45',
      time: '1 hour ago',
      status: 'completed',
    },
    {
      id: '3',
      contact: 'Bob Johnson',
      duration: '0:00',
      time: '2 hours ago',
      status: 'missed',
    },
    {
      id: '4',
      contact: 'Alice Brown',
      duration: '7:12',
      time: '3 hours ago',
      status: 'completed',
    },
  ]

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6">
        <h3 className="text-lg font-semibold">Recent Calls</h3>
        <p className="text-sm text-muted-foreground">Your latest call activity</p>
      </div>
      <div className="border-t">
        <div className="divide-y">
          {calls.map((call) => (
            <div key={call.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
              <div className="space-y-1">
                <p className="text-sm font-medium">{call.contact}</p>
                <p className="text-xs text-muted-foreground">{call.time}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm">{call.duration}</span>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  call.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {call.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}