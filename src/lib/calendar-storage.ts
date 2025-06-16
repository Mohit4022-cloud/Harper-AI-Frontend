import { faker } from '@faker-js/faker'
import { addHours, addDays } from 'date-fns'
import { CalendarEvent } from '@/types/calendar'

// Declare global type for calendar events
declare global {
  // eslint-disable-next-line no-var
  var calendarEvents: CalendarEvent[] | undefined
}

/**
 * Generate event title based on type
 */
function generateEventTitle(type: string): string {
  switch (type) {
    case 'call':
      return `Sales Call with ${faker.person.firstName()}`
    case 'meeting':
      return `Meeting: ${faker.company.catchPhrase()}`
    case 'follow_up':
      return `Follow-up: ${faker.commerce.product()}`
    case 'reminder':
      return `Reminder: ${faker.lorem.words(3)}`
    default:
      return faker.lorem.sentence()
  }
}

/**
 * Generate mock calendar events
 */
function generateMockEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const today = new Date()
  
  // Generate events for the next 30 days
  for (let i = 0; i < 30; i++) {
    const date = addDays(today, i)
    const numEvents = faker.number.int({ min: 0, max: 3 })
    
    for (let j = 0; j < numEvents; j++) {
      const hour = faker.number.int({ min: 9, max: 17 })
      const startTime = new Date(date.setHours(hour, 0, 0, 0))
      const eventType = faker.helpers.arrayElement(['call', 'meeting', 'follow_up', 'reminder'])
      
      const event: CalendarEvent = {
        id: `event_${i}_${j}_${Date.now()}`,
        title: generateEventTitle(eventType),
        description: faker.lorem.sentence(),
        type: eventType as CalendarEvent['type'],
        startTime: startTime.toISOString(),
        endTime: addHours(startTime, eventType === 'meeting' ? 1 : 0.5).toISOString(),
        contactId: faker.string.uuid(),
        contactName: faker.person.fullName(),
        contactPhone: faker.phone.number({ style: 'international' }),
        location: eventType === 'meeting' ? faker.location.streetAddress() : undefined,
        isCompleted: i < 0, // Past events are completed
        notes: faker.datatype.boolean() ? faker.lorem.paragraph() : undefined,
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.recent().toISOString(),
      }
      
      events.push(event)
    }
  }
  
  return events
}

/**
 * Get or initialize calendar events storage
 */
export function getCalendarEvents(): CalendarEvent[] {
  if (!global.calendarEvents) {
    global.calendarEvents = generateMockEvents()
  }
  return global.calendarEvents
}

/**
 * Set calendar events
 */
export function setCalendarEvents(events: CalendarEvent[]): void {
  global.calendarEvents = events
}

/**
 * Add a calendar event
 */
export function addCalendarEvent(event: CalendarEvent): void {
  const events = getCalendarEvents()
  events.push(event)
}

/**
 * Update a calendar event by ID
 */
export function updateCalendarEvent(id: string, updatedEvent: CalendarEvent): boolean {
  const events = getCalendarEvents()
  const index = events.findIndex(e => e.id === id)
  
  if (index === -1) {
    return false
  }
  
  events[index] = updatedEvent
  return true
}

/**
 * Delete a calendar event by ID
 */
export function deleteCalendarEvent(id: string): CalendarEvent | null {
  const events = getCalendarEvents()
  const index = events.findIndex(e => e.id === id)
  
  if (index === -1) {
    return null
  }
  
  return events.splice(index, 1)[0]
}

/**
 * Find a calendar event by ID
 */
export function findCalendarEvent(id: string): CalendarEvent | undefined {
  const events = getCalendarEvents()
  return events.find(e => e.id === id)
}

/**
 * Check for time conflicts with existing events
 */
export function checkTimeConflicts(
  event: CalendarEvent,
  excludeId?: string
): CalendarEvent[] {
  const events = getCalendarEvents()
  
  return events.filter((existingEvent) => {
    if (existingEvent.id === excludeId) return false
    
    const existingStart = new Date(existingEvent.startTime)
    const existingEnd = new Date(existingEvent.endTime)
    const newStart = new Date(event.startTime)
    const newEnd = new Date(event.endTime)
    
    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    )
  })
}