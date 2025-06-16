'use client'

export function ContactsPreview() {
  const contacts = [
    {
      id: '1',
      name: 'Sarah Wilson',
      company: 'Tech Corp',
      score: 92,
      status: 'hot',
    },
    {
      id: '2',
      name: 'Mike Chen',
      company: 'StartupXYZ',
      score: 78,
      status: 'warm',
    },
    {
      id: '3',
      name: 'Emily Davis',
      company: 'Enterprise Inc',
      score: 65,
      status: 'warm',
    },
    {
      id: '4',
      name: 'Tom Anderson',
      company: 'Small Biz LLC',
      score: 45,
      status: 'cold',
    },
  ]

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6">
        <h3 className="text-lg font-semibold">Top Contacts</h3>
        <p className="text-sm text-muted-foreground">Highest scoring leads</p>
      </div>
      <div className="border-t">
        <div className="divide-y">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
              <div className="space-y-1">
                <p className="text-sm font-medium">{contact.name}</p>
                <p className="text-xs text-muted-foreground">{contact.company}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 rounded-full bg-muted">
                    <div 
                      className={`h-2 rounded-full ${
                        contact.status === 'hot' ? 'bg-red-500' :
                        contact.status === 'warm' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${contact.score}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{contact.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}