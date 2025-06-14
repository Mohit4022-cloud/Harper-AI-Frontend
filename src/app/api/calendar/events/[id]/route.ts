import { NextRequest, NextResponse } from 'next/server'
import { CalendarEventSchema } from '@/types/calendar'
import { z } from 'zod'

// In-memory database reference (shared with /api/calendar/events/route.ts)
declare global {
  var calendarEvents: any[]
}

if (!global.calendarEvents) {
  global.calendarEvents = []
}

/**
 * GET /api/calendar/events/[id]
 * Get a single calendar event by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const event = global.calendarEvents.find((e) => e.id === id)
    
    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event not found',
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: event,
    })
  } catch (error) {
    console.error('Error fetching calendar event:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch calendar event',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/calendar/events/[id]
 * Update a calendar event
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const eventIndex = global.calendarEvents.findIndex((e) => e.id === id)
    
    if (eventIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event not found',
        },
        { status: 404 }
      )
    }
    
    // Validate update data
    const updateData = {
      ...global.calendarEvents[eventIndex],
      ...body,
      id: id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    }
    
    const validatedData = CalendarEventSchema.parse(updateData)
    
    // Check for time conflicts (excluding current event)
    const conflicts = global.calendarEvents.filter((event, index) => {
      if (index === eventIndex) return false
      
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
    
    // Update event
    global.calendarEvents[eventIndex] = validatedData
    
    return NextResponse.json({
      success: true,
      data: validatedData,
      message: 'Event updated successfully',
    })
  } catch (error) {
    console.error('Error updating calendar event:', error)
    
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
        error: 'Failed to update calendar event',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/calendar/events/[id]
 * Delete a calendar event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventIndex = global.calendarEvents.findIndex((e) => e.id === id)
    
    if (eventIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event not found',
        },
        { status: 404 }
      )
    }
    
    // Remove event
    const deletedEvent = global.calendarEvents.splice(eventIndex, 1)[0]
    
    return NextResponse.json({
      success: true,
      data: deletedEvent,
      message: 'Event deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete calendar event',
      },
      { status: 500 }
    )
  }
}