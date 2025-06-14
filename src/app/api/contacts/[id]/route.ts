/**
 * Single Contact API Route Handler
 * 
 * Handles operations on individual contact records:
 * - GET /api/contacts/[id] - Get a specific contact by ID
 * - PUT /api/contacts/[id] - Update a specific contact
 * - DELETE /api/contacts/[id] - Delete a specific contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getContactById,
  updateContact,
  deleteContact,
  addTag,
  removeTag,
  updateLeadScore,
  type UpdateContactDto
} from '@/lib/contactService';

/**
 * Route segment config for dynamic params
 */
export const dynamic = 'force-dynamic';

/**
 * Zod schema for validating update contact requests
 */
const updateContactSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  industry: z.string().optional(),
  leadScore: z.number().int().min(0).max(100).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']).optional(),
  source: z.string().optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
}).strict(); // Reject unknown fields

/**
 * GET /api/contacts/[id]
 * 
 * Retrieves a single contact by ID
 * 
 * @param request - Next.js request object
 * @param props - Route props containing params Promise
 * @returns The contact object or 404 if not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID format (basic check)
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        { status: 400 }
      );
    }

    // Fetch the contact
    const contact = await getContactById(id);

    if (!contact) {
      return NextResponse.json(
        { error: `Contact with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(contact, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60' // Cache for 1 minute
      }
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/contacts/[id]
 * 
 * Updates an existing contact record
 * 
 * Request body (all fields optional):
 * - firstName?: string
 * - lastName?: string
 * - email?: string
 * - phone?: string
 * - company?: string
 * - title?: string
 * - industry?: string
 * - leadScore?: number (0-100)
 * - status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'
 * - source?: string
 * - assignedTo?: string
 * - tags?: string[]
 * - customFields?: Record<string, any>
 * 
 * @param request - Next.js request object
 * @param props - Route props containing params Promise
 * @returns The updated contact object or error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = updateContactSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    // Check if there are any fields to update
    if (Object.keys(validationResult.data).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    // Update the contact
    try {
      const updatedContact = await updateContact(id, validationResult.data as UpdateContactDto);
      
      return NextResponse.json(updatedContact, {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          { error: `Contact with id '${id}' not found` },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating contact:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contacts/[id]
 * 
 * Deletes a contact record
 * 
 * @param request - Next.js request object
 * @param props - Route props containing params Promise
 * @returns 204 No Content on success or error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        { status: 400 }
      );
    }

    // Delete the contact
    try {
      await deleteContact(id);
      
      // Return 204 No Content on successful deletion
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          { error: `Contact with id '${id}' not found` },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contacts/[id]
 * 
 * Partially update a contact (special operations)
 * Supports:
 * - Add/remove tags
 * - Update lead score
 * 
 * Request body:
 * - action: 'addTag' | 'removeTag' | 'updateLeadScore'
 * - value: string (for tags) or number (for lead score)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, value } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let updatedContact;

    switch (action) {
      case 'addTag':
        if (typeof value !== 'string') {
          return NextResponse.json(
            { error: 'Tag value must be a string' },
            { status: 400 }
          );
        }
        updatedContact = await addTag(id, value);
        break;

      case 'removeTag':
        if (typeof value !== 'string') {
          return NextResponse.json(
            { error: 'Tag value must be a string' },
            { status: 400 }
          );
        }
        updatedContact = await removeTag(id, value);
        break;

      case 'updateLeadScore':
        if (typeof value !== 'number' || value < 0 || value > 100) {
          return NextResponse.json(
            { error: 'Lead score must be a number between 0 and 100' },
            { status: 400 }
          );
        }
        updatedContact = await updateLeadScore(id, value);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(updatedContact, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error patching contact:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Method not allowed handler for unsupported HTTP methods
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST /api/contacts to create a new contact.' },
    { status: 405, headers: { 'Allow': 'GET, PUT, DELETE, PATCH' } }
  );
}