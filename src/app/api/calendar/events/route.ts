import { NextRequest, NextResponse } from 'next/server'
import { CalendarEventSchema } from '@/types/calendar'
import { z } from 'zod'
import { faker } from '@faker-js/faker'
import { addHours, addDays, startOfDay, endOfDay } from 'date-fns'

// In-memory storage for calendar events (replace with real DB in production)
declare global {
  var calendarEvents: any[]
}

if (!global.calendarEvents) {
  // Generate mock events
  global.calendarEvents = generateMockEvents()
}

/**
 * Generate mock calendar events
 */
function generateMockEvents() {
  const events = []
  const today = new Date()
  
  // Generate events for the next 30 days
  for (let i = 0; i < 30; i++) {
    const date = addDays(today, i)
    const numEvents = faker.number.int({ min: 0, max: 3 })
    
    for (let j = 0; j < numEvents; j++) {
      const hour = faker.number.int({ min: 9, max: 17 })
      const startTime = new Date(date.setHours(hour, 0, 0, 0))
      const eventType = faker.helpers.arrayElement(['call', 'meeting', 'follow_up', 'reminder'])
      
      const event = {
        id: `event_${i}_${j}_${Date.now()}`,
        title: generateEventTitle(eventType),
        description: faker.lorem.sentence(),
        type: eventType,
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
 * GET /api/calendar/events
 * Fetch calendar events with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')
    const contactId = searchParams.get('contactId')
    
    let filteredEvents = [...global.calendarEvents]
    
    // Apply date range filter
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      filteredEvents = filteredEvents.filter((event) => {
        const eventDate = new Date(event.startTime)
        return eventDate >= start && eventDate <= end
      })
    }
    
    // Apply type filter
    if (type) {
      filteredEvents = filteredEvents.filter((event) => event.type === type)
    }
    
    // Apply contact filter
    if (contactId) {
      filteredEvents = filteredEvents.filter((event) => event.contactId === contactId)
    }
    
    // Sort by start time
    filteredEvents.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    
    return NextResponse.json({
      success: true,
      data: filteredEvents,
      total: filteredEvents.length,
    })
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch calendar events',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/calendar/events
 * Create a new calendar event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = CalendarEventSchema.parse({
      ...body,
      id: body.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: body.updatedAt || new Date().toISOString(),
    })
    
    // Check for time conflicts
    const conflicts = global.calendarEvents.filter((event) => {
      if (event.id === validatedData.id) return false
      
      const existingStart = new Date(event.startTime)
      const existingEnd = new Date(event.endTime)
      const newStart = new Date(validatedData.startTime)
      const newEnd = new Date(validatedData.endTime)
      
      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      )
    })
    
    if (conflicts.length > 0 && validatedData.type !== 'reminder') {
      return NextResponse.json(
        {
          success: false,
          error: 'Time conflict with existing events',
          conflicts: conflicts.map(e => ({ title: e.title, startTime: e.startTime })),
        },
        { status: 409 }
      )
    }
    
    // Add to in-memory database
    global.calendarEvents.push(validatedData)
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    return NextResponse.json({
      success: true,
      data: validatedData,
      message: 'Event created successfully',
    })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid event data',
          details: error.errors,
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create calendar event',
      },
      { status: 500 }
    )
  }
}