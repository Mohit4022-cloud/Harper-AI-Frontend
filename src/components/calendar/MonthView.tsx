'use client'

import { useState } from 'react'
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'
import { CalendarEvent, EVENT_TYPE_COLORS } from '@/types/calendar'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus } from 'lucide-react'

interface MonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onDateClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
  onAddEvent: (date: Date) => void
}

export function MonthView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
  onAddEvent,
}: MonthViewProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime)
      return isSameDay(eventDate, date)
    })
  }

  return (
    <div className="flex-1">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-gray-50 dark:bg-gray-800 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
        {days.map((day, dayIdx) => {
          const dayEvents = getEventsForDate(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isHovered = hoveredDate && isSameDay(day, hoveredDate)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[120px] bg-white dark:bg-gray-900 p-2 transition-colors',
                !isCurrentMonth && 'bg-gray-50 dark:bg-gray-800',
                isToday(day) && 'bg-blue-50 dark:bg-blue-900/20',
                isHovered && 'bg-gray-100 dark:bg-gray-800'
              )}
              onMouseEnter={() => setHoveredDate(day)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <div className="flex items-start justify-between mb-1">
                <button
                  onClick={() => onDateClick(day)}
                  className={cn(
                    'text-sm font-medium rounded-full w-7 h-7 flex items-center justify-center transition-colors',
                    isToday(day) && 'bg-blue-600 text-white',
                    !isToday(day) && isCurrentMonth && 'text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800',
                    !isCurrentMonth && 'text-gray-400 dark:text-gray-600'
                  )}
                >
                  {format(day, 'd')}
                </button>
                {isHovered && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => onAddEvent(day)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={cn(
                      'w-full text-left px-1 py-0.5 rounded text-xs truncate border',
                      EVENT_TYPE_COLORS[event.type],
                      'hover:opacity-80 transition-opacity'
                    )}
                  >
                    {format(new Date(event.startTime), 'HH:mm')} {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <button
                    onClick={() => onDateClick(day)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    +{dayEvents.length - 3} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}