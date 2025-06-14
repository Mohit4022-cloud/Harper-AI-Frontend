import { NextRequest, NextResponse } from 'next/server'
import { UpdateContactSchema, Contact } from '@/types/contact'
import { z } from 'zod'

declare global {
  var contactsDb: Contact[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contact = global.contactsDb.find(c => c.id === id)
    
    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: contact,
    })
  } catch (error) {
    console.error('GET /api/contacts/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const validatedData = UpdateContactSchema.parse({ ...body, id })
    
    const index = global.contactsDb.findIndex(c => c.id === id)
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      )
    }
    
    // Check email uniqueness if email is being updated
    if (validatedData.email && validatedData.email !== global.contactsDb[index].email) {
      const existing = global.contactsDb.find(c => c.email === validatedData.email && c.id !== id)
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Contact with this email already exists' },
          { status: 409 }
        )
      }
    }
    
    const updatedContact: Contact = {
      ...global.contactsDb[index],
      ...validatedData,
      updatedAt: new Date().toISOString(),
    }
    
    global.contactsDb[index] = updatedContact
    
    return NextResponse.json({
      success: true,
      data: updatedContact,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid contact data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('PUT /api/contacts/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const index = global.contactsDb.findIndex(c => c.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      )
    }
    
    const deleted = global.contactsDb.splice(index, 1)[0]
    
    return NextResponse.json({
      success: true,
      data: deleted,
    })
  } catch (error) {
    console.error('DELETE /api/contacts/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}