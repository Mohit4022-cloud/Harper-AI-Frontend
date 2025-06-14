'use client'

import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns'
import { CalendarEvent, EVENT_TYPE_COLORS } from '@/types/calendar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Phone, Video, Users, Bell, MapPin, Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ListViewProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function ListView({ events, onEventClick }: ListViewProps) {
  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = format(parseISO(event.startTime), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(event)
    return groups
  }, {} as Record<string, CalendarEvent[]>)

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isThisWeek(date)) return format(date, 'EEEE')
    return format(date, 'MMMM d, yyyy')
  }

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'call':
        return Phone
      case 'meeting':
        return Video
      case 'follow_up':
        return Users
      case 'reminder':
        return Bell
      default:
        return Calendar
    }
  }

  const sortedDates = Object.keys(groupedEvents).sort()

  if (sortedDates.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No upcoming events</h3>
          <p className="text-gray-500">Your calendar is clear!</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-6 p-4">
        {sortedDates.map((dateStr) => {
          const dateEvents = groupedEvents[dateStr]
          const date = new Date(dateStr)

          return (
            <div key={dateStr}>
              <div className="sticky top-0 bg-white z-10 pb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {getDateLabel(dateStr)}
                </h3>
                <p className="text-sm text-gray-500">{format(date, 'EEEE, MMMM d')}</p>
              </div>

              <div className="space-y-3">
                {dateEvents.map((event) => {
                  const Icon = getEventIcon(event.type)
                  const startTime = parseISO(event.startTime)
                  const endTime = parseISO(event.endTime)

                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="w-full text-left group"
                    >
                      <div
                        className={cn(
                          'p-4 rounded-lg border-2 transition-all',
                          'hover:shadow-md hover:border-gray-300',
                          event.isCompleted && 'opacity-60'
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div
                              className={cn(
                                'w-12 h-12 rounded-full flex items-center justify-center',
                                EVENT_TYPE_COLORS[event.type]
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {event.title}
                              </h4>
                              <Badge
                                variant="secondary"
                                className={cn('ml-2', EVENT_TYPE_COLORS[event.type])}
                              >
                                {event.type.replace('_', ' ')}
                              </Badge>
                            </div>

                            {event.description && (
                              <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                              </div>

                              {event.contactName && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {event.contactName}
                                </div>
                              )}

                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </div>
                              )}
                            </div>

                            {event.isCompleted && (
                              <Badge variant="outline" className="mt-2">
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}