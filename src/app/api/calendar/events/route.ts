import { NextRequest, NextResponse } from 'next/server'
import { CalendarEventSchema } from '@/types/calendar'
import { z } from 'zod'
import { 
  getCalendarEvents, 
  addCalendarEvent, 
  checkTimeConflicts 
} from '@/lib/calendar-storage'

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
    
    let filteredEvents = [...getCalendarEvents()]
    
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
    const conflicts = checkTimeConflicts(validatedData, validatedData.id)
    
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
    addCalendarEvent(validatedData)
    
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