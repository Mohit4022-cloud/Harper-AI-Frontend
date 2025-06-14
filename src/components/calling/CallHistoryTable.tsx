'use client'

import React from 'react'
import { format } from 'date-fns'
import { Phone, PhoneOff, Clock, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useCallQueueStore, CallRecord } from '@/stores/callQueueStore'
import { cn } from '@/lib/utils'

export function CallHistoryTable() {
  const { callHistory, clearHistory } = useCallQueueStore()
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: CallRecord['status']) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'failed':
        return 'destructive'
      case 'connected':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Call History</CardTitle>
          {callHistory.length > 0 && (
            <Button
              onClick={clearHistory}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Clear History
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px]">
          {callHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground p-8">
              <div className="text-center">
                <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No call history yet</p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {callHistory.map((call) => (
                <div
                  key={call.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                    expandedId === call.id && "bg-muted/50"
                  )}
                  onClick={() => toggleExpanded(call.id)}
                >
                  <div className="space-y-2">
                    {/* Main Info Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{call.contactName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {call.contactCompany}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {call.phone}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(call.status)}>
                          {call.status === 'completed' ? (
                            <Phone className="h-3 w-3 mr-1" />
                          ) : (
                            <PhoneOff className="h-3 w-3 mr-1" />
                          )}
                          {call.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Time Info Row */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>{format(call.startTime, 'MMM d, h:mm a')}</span>
                        {call.duration !== undefined && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(call.duration)}
                          </span>
                        )}
                      </div>
                      {call.transcript && call.transcript.length > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Transcript
                        </span>
                      )}
                    </div>

                    {/* Expanded Transcript */}
                    {expandedId === call.id && call.transcript && call.transcript.length > 0 && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Call Transcript:
                        </p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {call.transcript.map((line, idx) => (
                            <p key={idx} className="text-xs">
                              <span className="font-medium">
                                {line.startsWith('AI:') ? 'AI' : 'Prospect'}:
                              </span>{' '}
                              {line.replace(/^(AI:|Prospect:)\s*/, '')}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}