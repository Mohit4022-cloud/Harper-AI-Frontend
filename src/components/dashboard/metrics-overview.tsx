'use client'

export function MetricsOverview() {
  const metrics = [
    {
      name: 'Total Calls',
      value: '2,543',
      change: '+12.5%',
      trend: 'up',
    },
    {
      name: 'Contacts Reached',
      value: '1,893',
      change: '+8.2%',
      trend: 'up',
    },
    {
      name: 'Conversion Rate',
      value: '23.4%',
      change: '-2.1%',
      trend: 'down',
    },
    {
      name: 'Avg Call Duration',
      value: '4:32',
      change: '+0.8%',
      trend: 'up',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.name} className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
            <span className={`text-sm font-medium ${
              metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {metric.change}
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold">{metric.value}</p>
        </div>
      ))}
    </div>
  )
}