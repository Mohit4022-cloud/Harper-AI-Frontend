'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  CalendarPlus, 
  Clock, 
  Video, 
  Phone,
  Users,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useCalendarStore } from '@/stores/calendarStore'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'
import { MonthView } from '@/components/calendar/MonthView'
import { ListView } from '@/components/calendar/ListView'
import { EventDialog } from '@/components/calendar/EventDialog'
import { CalendarEvent, CalendarView, EVENT_TYPE_COLORS } from '@/types/calendar'
import { useToast } from '@/components/ui/use-toast'
import { 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  addDays, 
  subDays,
  startOfMonth,
  endOfMonth,
  format,
} from 'date-fns'
import { cn } from '@/lib/utils'

export default function CalendarPage() {
  const { toast } = useToast()
  const {
    events,
    selectedDate,
    view,
    loading,
    error,
    fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    setSelectedDate,
    setView,
    getEventsForDateRange,
    getUpcomingEvents,
  } = useCalendarStore()

  const [showEventDialog, setShowEventDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [dialogDefaultDate, setDialogDefaultDate] = useState<Date | undefined>()

  // Fetch events on mount
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Show error if any
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      })
    }
  }, [error, toast])

  // Navigation handlers
  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    switch (direction) {
      case 'prev':
        if (view === 'month') {
          setSelectedDate(subMonths(selectedDate, 1))
        } else if (view === 'week') {
          setSelectedDate(subWeeks(selectedDate, 1))
        } else if (view === 'day') {
          setSelectedDate(subDays(selectedDate, 1))
        }
        break
      case 'next':
        if (view === 'month') {
          setSelectedDate(addMonths(selectedDate, 1))
        } else if (view === 'week') {
          setSelectedDate(addWeeks(selectedDate, 1))
        } else if (view === 'day') {
          setSelectedDate(addDays(selectedDate, 1))
        }
        break
      case 'today':
        setSelectedDate(new Date())
        break
    }
  }

  // Event handlers
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setView('day')
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventDialog(true)
  }

  const handleAddEvent = (date?: Date) => {
    setSelectedEvent(null)
    setDialogDefaultDate(date || selectedDate)
    setShowEventDialog(true)
  }

  const handleSaveEvent = async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedEvent) {
      await updateEvent(selectedEvent.id, eventData)
    } else {
      await addEvent(eventData)
    }
  }

  // Get events for current view
  const currentEvents = view === 'list' 
    ? events.filter(e => new Date(e.startTime) >= new Date())
    : getEventsForDateRange(
        startOfMonth(selectedDate),
        endOfMonth(selectedDate)
      )

  // Get upcoming events
  const upcomingEvents = getUpcomingEvents(5)

  // Stats calculation
  const stats = {
    todayEvents: events.filter(e => {
      const eventDate = new Date(e.startTime)
      const today = new Date()
      return (
        eventDate.getDate() === today.getDate() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getFullYear() === today.getFullYear()
      )
    }).length,
    weekEvents: events.filter(e => {
      const eventDate = new Date(e.startTime)
      const now = new Date()
      const weekFromNow = addDays(now, 7)
      return eventDate >= now && eventDate <= weekFromNow
    }).length,
    calls: events.filter(e => e.type === 'call' && !e.isCompleted).length,
    meetings: events.filter(e => e.type === 'meeting' && !e.isCompleted).length,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1">
            {stats.todayEvents > 0
              ? `${stats.todayEvents} events today`
              : 'Schedule meetings and manage appointments'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchEvents()}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
          <Button 
            className="gradient-purple-pink hover:opacity-90"
            onClick={() => handleAddEvent()}
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold">{stats.todayEvents}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold">{stats.weekEvents}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Calls</p>
                <p className="text-2xl font-bold">{stats.calls}</p>
              </div>
              <Phone className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Meetings</p>
                <p className="text-2xl font-bold">{stats.meetings}</p>
              </div>
              <Video className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calendar View */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <CalendarHeader
              currentDate={selectedDate}
              view={view}
              onNavigate={handleNavigate}
              onViewChange={setView}
            />

            {/* Loading State */}
            {loading && events.length === 0 && (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}

            {/* Calendar Views */}
            {!loading && (
              <>
                {view === 'month' && (
                  <MonthView
                    currentDate={selectedDate}
                    events={currentEvents}
                    onDateClick={handleDateClick}
                    onEventClick={handleEventClick}
                    onAddEvent={handleAddEvent}
                  />
                )}
                {view === 'list' && (
                  <ListView
                    events={currentEvents}
                    onEventClick={handleEventClick}
                  />
                )}
                {(view === 'week' || view === 'day') && (
                  <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {view === 'week' ? 'Week' : 'Day'} view coming soon
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar - Upcoming Events */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Upcoming Events</span>
                <Badge variant="secondary">{upcomingEvents.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No upcoming events
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => {
                    const eventDate = new Date(event.startTime)
                    return (
                      <button
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-sm truncate pr-2">
                            {event.title}
                          </h4>
                          <Badge
                            variant="secondary"
                            className={cn('text-xs', EVENT_TYPE_COLORS[event.type])}
                          >
                            {event.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {format(eventDate, 'MMM d, h:mm a')}
                        </div>
                        {event.contactName && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Users className="h-3 w-3" />
                            {event.contactName}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => {
                  setView('list')
                }}
              >
                View All Events
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => {
                  const tomorrow = addDays(new Date(), 1)
                  handleAddEvent(tomorrow)
                }}
              >
                Schedule for Tomorrow
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                disabled
              >
                Sync with Google Calendar
                <Badge variant="secondary" className="ml-2">Soon</Badge>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Dialog */}
      <EventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        onSave={handleSaveEvent}
        event={selectedEvent}
        defaultDate={dialogDefaultDate}
      />
    </div>
  )
}