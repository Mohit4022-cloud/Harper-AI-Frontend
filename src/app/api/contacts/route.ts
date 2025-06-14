import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ContactSchema } from '@/stores/contactsStore'

// In-memory database (replace with real DB in production)
declare global {
  var contacts: any[]
}

if (!global.contacts) {
  global.contacts = []
}

/**
 * GET /api/contacts
 * Fetch all contacts with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const tags = searchParams.get('tags')
    const status = searchParams.get('status')

    let filteredContacts = [...global.contacts]

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filteredContacts = filteredContacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchLower) ||
          contact.email.toLowerCase().includes(searchLower) ||
          contact.company.toLowerCase().includes(searchLower) ||
          contact.title.toLowerCase().includes(searchLower)
      )
    }

    // Apply tag filter
    if (tags) {
      const tagArray = tags.split(',')
      filteredContacts = filteredContacts.filter((contact) =>
        tagArray.every((tag) => contact.tags?.includes(tag))
      )
    }

    // Apply status filter
    if (status) {
      filteredContacts = filteredContacts.filter(
        (contact) => contact.status === status
      )
    }

    // Sort by most recent first
    filteredContacts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      success: true,
      data: filteredContacts,
      total: filteredContacts.length,
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch contacts',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/contacts
 * Create a new contact
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = ContactSchema.parse({
      ...body,
      id: body.id || `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: body.updatedAt || new Date().toISOString(),
      status: body.status || 'prospect',
      leadScore: body.leadScore ?? 50,
      tags: body.tags || [],
    })

    // Check for duplicate email
    const existingContact = global.contacts.find(
      (contact) => contact.email === validatedData.email
    )
    if (existingContact) {
      return NextResponse.json(
        {
          success: false,
          error: 'A contact with this email already exists',
        },
        { status: 409 }
      )
    }

    // Add to in-memory database
    global.contacts.push(validatedData)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    return NextResponse.json({
      success: true,
      data: validatedData,
      message: 'Contact created successfully',
    })
  } catch (error) {
    console.error('Error creating contact:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid contact data',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create contact',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/contacts
 * Bulk delete contacts
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: ids array required',
        },
        { status: 400 }
      )
    }

    // Remove contacts
    const deletedCount = global.contacts.length
    global.contacts = global.contacts.filter((contact) => !ids.includes(contact.id))
    const actualDeleted = deletedCount - global.contacts.length

    return NextResponse.json({
      success: true,
      deletedCount: actualDeleted,
      message: `Deleted ${actualDeleted} contact(s)`,
    })
  } catch (error) {
    console.error('Error deleting contacts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete contacts',
      },
      { status: 500 }
    )
  }
}