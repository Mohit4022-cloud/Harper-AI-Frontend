'use client'

import React, { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Mic, User } from 'lucide-react'
import { useCallQueueStore } from '@/stores/callQueueStore'
import { cn } from '@/lib/utils'

interface TranscriptLine {
  speaker: 'AI' | 'Prospect'
  text: string
  timestamp: Date
}

export function LiveTranscript() {
  const { currentTranscript, activeCall } = useCallQueueStore()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [parsedTranscript, setParsedTranscript] = React.useState<TranscriptLine[]>([])

  // Parse transcript lines into structured format
  useEffect(() => {
    const parsed = currentTranscript.map((line) => {
      const speaker: 'AI' | 'Prospect' = line.startsWith('AI:') ? 'AI' : 'Prospect'
      const text = line.replace(/^(AI:|Prospect:)\s*/, '')
      return {
        speaker,
        text,
        timestamp: new Date(),
      }
    })
    setParsedTranscript(parsed)
  }, [currentTranscript])

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [parsedTranscript])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live Transcript</CardTitle>
          {activeCall && (
            <Badge variant="default" className="animate-pulse">
              <Mic className="h-3 w-3 mr-1" />
              Recording
            </Badge>
          )}
        </div>
        {activeCall && (
          <div className="text-sm text-muted-foreground mt-1">
            Call with {activeCall.contactName} • {activeCall.contactCompany}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px] px-4" ref={scrollAreaRef}>
          {parsedTranscript.length === 0 && !activeCall && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">No active call</p>
            </div>
          )}
          
          {parsedTranscript.length === 0 && activeCall && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Mic className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Waiting for transcript...</p>
              </div>
            </div>
          )}

          <div className="space-y-3 pb-4">
            {parsedTranscript.map((line, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  line.speaker === 'AI' ? 'flex-row' : 'flex-row-reverse'
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    line.speaker === 'AI'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {line.speaker === 'AI' ? (
                    <span className="text-xs font-bold">AI</span>
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "flex-1 space-y-1",
                    line.speaker === 'Prospect' && 'text-right'
                  )}
                >
                  <div
                    className={cn(
                      "inline-block px-3 py-2 rounded-lg text-sm",
                      line.speaker === 'AI'
                        ? 'bg-primary/10 text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {line.text}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(line.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}