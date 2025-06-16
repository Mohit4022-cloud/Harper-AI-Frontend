import { NextRequest, NextResponse } from 'next/server'
import { UpdateContactSchema, Contact } from '@/types/contact'
import { z } from 'zod'
import { getContactsDb, findContactById, findContactByEmail, updateContact, deleteContact } from '@/lib/contacts-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contact = findContactById(id)
    
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
    
    const currentContact = findContactById(id)
    if (!currentContact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      )
    }
    
    // Check email uniqueness if email is being updated
    if (validatedData.email && validatedData.email !== currentContact.email) {
      const existing = getContactsDb().find(c => c.email === validatedData.email && c.id !== id)
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Contact with this email already exists' },
          { status: 409 }
        )
      }
    }
    
    const updatedContact: Contact = {
      ...currentContact,
      ...validatedData,
      updatedAt: new Date().toISOString(),
    }
    
    updateContact(id, updatedContact)
    
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
    const deleted = deleteContact(id)
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      )
    }
    
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