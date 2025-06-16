import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CalendarEvent, CalendarEventSchema, CalendarView } from '@/types/calendar'
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'

interface CalendarState {
  events: CalendarEvent[]
  selectedDate: Date
  view: CalendarView
  loading: boolean
  error: string | null
  
  // Actions
  fetchEvents: () => Promise<void>
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  setSelectedDate: (date: Date) => void
  setView: (view: CalendarView) => void
  getEventsForDate: (date: Date) => CalendarEvent[]
  getEventsForDateRange: (startDate: Date, endDate: Date) => CalendarEvent[]
  getUpcomingEvents: (limit?: number) => CalendarEvent[]
}

/**
 * Calendar store for managing events and schedules
 */
export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: [],
      selectedDate: new Date(),
      view: 'month',
      loading: false,
      error: null,

      /**
       * Fetch events from API
       */
      fetchEvents: async () => {
        set({ loading: true, error: null })
        
        try {
          const response = await fetch('/api/calendar/events')
          
          if (!response.ok) {
            throw new Error('Failed to fetch events')
          }
          
          const data = await response.json()
          
          if (data.success) {
            set({ events: data.data, loading: false })
          } else {
            throw new Error(data.error || 'Failed to fetch events')
          }
        } catch (error) {
          console.error('Error fetching events:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch events',
            loading: false 
          })
        }
      },

      /**
       * Add new event
       */
      addEvent: async (eventData) => {
        set({ loading: true, error: null })
        
        try {
          const newEvent = {
            ...eventData,
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          
          // Validate event data
          const validatedEvent = CalendarEventSchema.parse(newEvent)
          
          const response = await fetch('/api/calendar/events', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(validatedEvent),
          })
          
          if (!response.ok) {
            throw new Error('Failed to add event')
          }
          
          const data = await response.json()
          
          if (data.success) {
            set((state) => ({
              events: [...state.events, validatedEvent],
              loading: false,
            }))
          } else {
            throw new Error(data.error || 'Failed to add event')
          }
        } catch (error) {
          console.error('Error adding event:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add event',
            loading: false 
          })
          throw error
        }
      },

      /**
       * Update event
       */
      updateEvent: async (id, updates) => {
        set({ loading: true, error: null })
        
        try {
          const currentEvent = get().events.find((e) => e.id === id)
          if (!currentEvent) {
            throw new Error('Event not found')
          }
          
          const updatedEvent = {
            ...currentEvent,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
          
          // Validate updated event
          const validatedEvent = CalendarEventSchema.parse(updatedEvent)
          
          const response = await fetch(`/api/calendar/events/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(validatedEvent),
          })
          
          if (!response.ok) {
            throw new Error('Failed to update event')
          }
          
          const data = await response.json()
          
          if (data.success) {
            set((state) => ({
              events: state.events.map((e) => (e.id === id ? validatedEvent : e)),
              loading: false,
            }))
          } else {
            throw new Error(data.error || 'Failed to update event')
          }
        } catch (error) {
          console.error('Error updating event:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update event',
            loading: false 
          })
          throw error
        }
      },

      /**
       * Delete event
       */
      deleteEvent: async (id) => {
        set({ loading: true, error: null })
        
        try {
          const response = await fetch(`/api/calendar/events/${id}`, {
            method: 'DELETE',
          })
          
          if (!response.ok) {
            throw new Error('Failed to delete event')
          }
          
          const data = await response.json()
          
          if (data.success) {
            set((state) => ({
              events: state.events.filter((e) => e.id !== id),
              loading: false,
            }))
          } else {
            throw new Error(data.error || 'Failed to delete event')
          }
        } catch (error) {
          console.error('Error deleting event:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete event',
            loading: false 
          })
          throw error
        }
      },

      /**
       * Set selected date
       */
      setSelectedDate: (date) => {
        set({ selectedDate: date })
      },

      /**
       * Set calendar view
       */
      setView: (view) => {
        set({ view })
      },

      /**
       * Get events for a specific date
       */
      getEventsForDate: (date) => {
        const { events } = get()
        return events.filter((event) => {
          const eventStart = parseISO(event.startTime)
          return (
            eventStart.getFullYear() === date.getFullYear() &&
            eventStart.getMonth() === date.getMonth() &&
            eventStart.getDate() === date.getDate()
          )
        })
      },

      /**
       * Get events for a date range
       */
      getEventsForDateRange: (startDate, endDate) => {
        const { events } = get()
        return events.filter((event) => {
          const eventStart = parseISO(event.startTime)
          return isWithinInterval(eventStart, { start: startDate, end: endDate })
        })
      },

      /**
       * Get upcoming events
       */
      getUpcomingEvents: (limit = 5) => {
        const { events } = get()
        const now = new Date()
        
        return events
          .filter((event) => {
            const eventStart = parseISO(event.startTime)
            return eventStart >= now && !event.isCompleted
          })
          .sort((a, b) => {
            const aStart = parseISO(a.startTime)
            const bStart = parseISO(b.startTime)
            return aStart.getTime() - bStart.getTime()
          })
          .slice(0, limit)
      },
    }),
    {
      name: 'calendar-events',
      // Only persist events, not UI state
      partialize: (state) => ({ events: state.events }),
    }
  )
)