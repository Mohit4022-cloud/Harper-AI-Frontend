'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar, List, Grid3X3, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { CalendarView } from '@/types/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CalendarHeaderProps {
  currentDate: Date
  view: CalendarView
  onNavigate: (direction: 'prev' | 'next' | 'today') => void
  onViewChange: (view: CalendarView) => void
}

export function CalendarHeader({
  currentDate,
  view,
  onNavigate,
  onViewChange,
}: CalendarHeaderProps) {
  const getTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy')
      case 'week':
        return `Week of ${format(currentDate, 'MMM d, yyyy')}`
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy')
      case 'list':
        return 'Upcoming Events'
      default:
        return format(currentDate, 'MMMM yyyy')
    }
  }

  const viewOptions = [
    { value: 'month', label: 'Month', icon: Grid3X3 },
    { value: 'week', label: 'Week', icon: Calendar },
    { value: 'day', label: 'Day', icon: Clock },
    { value: 'list', label: 'List', icon: List },
  ]

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('prev')}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('today')}
            className="px-3"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('next')}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-xl font-semibold">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-2">
        <Select value={view} onValueChange={(value) => onViewChange(value as CalendarView)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {viewOptions.map((option) => {
              const Icon = option.icon
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}