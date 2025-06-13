import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { mockContacts } from '@/lib/mockData'
import { Contact } from '@/types'

// GET /api/contacts - Fetch all contacts
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authorization token required' },
        { status: 401 }
      )
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    // Filter contacts based on search and status
    let filteredContacts = mockContacts

    if (search) {
      filteredContacts = filteredContacts.filter(contact =>
        contact.firstName.toLowerCase().includes(search.toLowerCase()) ||
        contact.lastName.toLowerCase().includes(search.toLowerCase()) ||
        contact.email.toLowerCase().includes(search.toLowerCase()) ||
        contact.company.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status) {
      filteredContacts = filteredContacts.filter(contact => contact.status === status)
    }

    // Paginate results
    const total = filteredContacts.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const paginatedContacts = filteredContacts.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedContacts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Contacts API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/contacts - Create new contact
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authorization token required' },
        { status: 401 }
      )
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const contactData = await request.json()

    // Validate required fields
    if (!contactData.firstName || !contactData.lastName || !contactData.email) {
      return NextResponse.json(
        { success: false, message: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingContact = mockContacts.find(c => c.email === contactData.email)
    if (existingContact) {
      return NextResponse.json(
        { success: false, message: 'Contact with this email already exists' },
        { status: 409 }
      )
    }

    // Create new contact
    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      email: contactData.email,
      phone: contactData.phone || '',
      company: contactData.company || '',
      title: contactData.title || '',
      industry: contactData.industry || '',
      leadScore: contactData.leadScore || 50,
      status: contactData.status || 'new',
      source: contactData.source || 'Manual',
      assignedTo: payload.userId,
      tags: contactData.tags || [],
      notes: [],
      activities: [],
      customFields: contactData.customFields || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // In a real app, this would be saved to the database
    mockContacts.push(newContact)

    return NextResponse.json({
      success: true,
      data: newContact,
    }, { status: 201 })
  } catch (error) {
    console.error('Create contact error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}