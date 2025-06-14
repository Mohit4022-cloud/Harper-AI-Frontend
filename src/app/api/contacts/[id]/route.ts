import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ContactSchema } from '@/stores/contactsStore'

// In-memory database reference (shared with /api/contacts/route.ts)
declare global {
  var contacts: any[]
}

if (!global.contacts) {
  global.contacts = []
}

/**
 * GET /api/contacts/[id]
 * Get a single contact by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contact = global.contacts.find((c) => c.id === id)

    if (!contact) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contact not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: contact,
    })
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch contact',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/contacts/[id]
 * Update a contact
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const contactIndex = global.contacts.findIndex((c) => c.id === id)

    if (contactIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contact not found',
        },
        { status: 404 }
      )
    }

    // Validate update data
    const updateData = {
      ...global.contacts[contactIndex],
      ...body,
      id: id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    }

    const validatedData = ContactSchema.parse(updateData)

    // Check for duplicate email if email is being changed
    if (
      body.email &&
      body.email !== global.contacts[contactIndex].email
    ) {
      const duplicateEmail = global.contacts.find(
        (c) => c.email === body.email && c.id !== id
      )
      if (duplicateEmail) {
        return NextResponse.json(
          {
            success: false,
            error: 'A contact with this email already exists',
          },
          { status: 409 }
        )
      }
    }

    // Update contact
    global.contacts[contactIndex] = validatedData

    return NextResponse.json({
      success: true,
      data: validatedData,
      message: 'Contact updated successfully',
    })
  } catch (error) {
    console.error('Error updating contact:', error)

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
        error: 'Failed to update contact',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/contacts/[id]
 * Delete a contact
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contactIndex = global.contacts.findIndex((c) => c.id === id)

    if (contactIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contact not found',
        },
        { status: 404 }
      )
    }

    // Remove contact
    const deletedContact = global.contacts.splice(contactIndex, 1)[0]

    return NextResponse.json({
      success: true,
      data: deletedContact,
      message: 'Contact deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete contact',
      },
      { status: 500 }
    )
  }
}