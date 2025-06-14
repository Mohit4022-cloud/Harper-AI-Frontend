import { z } from 'zod'

/**
 * Calendar Event Types
 */
export const CalendarEventType = z.enum(['call', 'meeting', 'follow_up', 'reminder'])

/**
 * Calendar Event Schema
 */
export const CalendarEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: CalendarEventType,
  startTime: z.string(), // ISO string
  endTime: z.string(), // ISO string
  contactId: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  location: z.string().optional(),
  isCompleted: z.boolean().default(false),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CalendarEvent = z.infer<typeof CalendarEventSchema>
export type CalendarEventType = z.infer<typeof CalendarEventType>

/**
 * Calendar View Types
 */
export type CalendarView = 'month' | 'week' | 'day' | 'list'

/**
 * Default event durations (in minutes)
 */
export const DEFAULT_EVENT_DURATIONS = {
  call: 30,
  meeting: 60,
  follow_up: 15,
  reminder: 0,
}

/**
 * Event type colors
 */
export const EVENT_TYPE_COLORS = {
  call: 'bg-blue-100 text-blue-800 border-blue-300',
  meeting: 'bg-purple-100 text-purple-800 border-purple-300',
  follow_up: 'bg-green-100 text-green-800 border-green-300',
  reminder: 'bg-yellow-100 text-yellow-800 border-yellow-300',
}