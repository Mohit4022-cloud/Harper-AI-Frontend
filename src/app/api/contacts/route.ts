import { NextRequest, NextResponse } from 'next/server'
import { ContactSchema, CreateContactSchema, Contact } from '@/types/contact'
import { z } from 'zod'

// In-memory database
declare global {
  var contactsDb: Contact[]
}

if (!global.contactsDb) {
  global.contactsDb = []
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const tags = searchParams.get('tags')
    
    let filtered = [...global.contactsDb]
    
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.company?.toLowerCase().includes(searchLower) ||
        c.phone.includes(search)
      )
    }
    
    if (status) {
      filtered = filtered.filter(c => c.status === status)
    }
    
    if (tags) {
      const tagArray = tags.split(',')
      filtered = filtered.filter(c => 
        tagArray.some(tag => c.tags?.includes(tag))
      )
    }
    
    // Sort by most recent first
    filtered.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    
    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
    })
  } catch (error) {
    console.error('GET /api/contacts error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateContactSchema.parse(body)
    
    // Check for duplicate email
    const existing = global.contactsDb.find(c => c.email === validatedData.email)
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Contact with this email already exists' },
        { status: 409 }
      )
    }
    
    const newContact: Contact = {
      ...validatedData,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: validatedData.status || 'prospect',
      tags: validatedData.tags || [],
      leadScore: validatedData.leadScore ?? 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    global.contactsDb.push(newContact)
    
    return NextResponse.json({
      success: true,
      data: newContact,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid contact data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('POST /api/contacts error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}