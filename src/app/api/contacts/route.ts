/**
 * Contacts API Route Handler
 * 
 * Handles operations on the contacts collection:
 * - GET /api/contacts - List all contacts with filtering and pagination
 * - POST /api/contacts - Create a new contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  getAllContacts, 
  createContact, 
  getContactStats,
  type ContactQueryParams,
  type CreateContactDto 
} from '@/lib/contactService';

/**
 * Zod schema for validating create contact requests
 */
const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  company: z.string().min(1, 'Company is required'),
  title: z.string().optional(),
  industry: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']).optional(),
  source: z.string().min(1, 'Source is required'),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
});

/**
 * GET /api/contacts
 * 
 * Retrieves a paginated list of contacts with optional filtering
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - status: Filter by contact status
 * - assignedTo: Filter by assigned user ID
 * - tags: Filter by tags (comma-separated)
 * - source: Filter by lead source
 * - minLeadScore: Minimum lead score
 * - maxLeadScore: Maximum lead score
 * - searchQuery: Search in name, email, company, title
 * - sortBy: Sort field (firstName, lastName, leadScore, createdAt, updatedAt)
 * - sortOrder: Sort direction (asc, desc)
 * 
 * @returns Paginated list of contacts
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Special endpoint for statistics
    if (searchParams.get('stats') === 'true') {
      const stats = await getContactStats();
      return NextResponse.json(stats, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
    
    // Parse and validate query parameters
    const params: ContactQueryParams = {
      page: Math.max(1, parseInt(searchParams.get('page') || '1')),
      limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10'))),
      status: searchParams.get('status') as ContactQueryParams['status'] || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      source: searchParams.get('source') || undefined,
      minLeadScore: searchParams.get('minLeadScore') ? parseInt(searchParams.get('minLeadScore')!) : undefined,
      maxLeadScore: searchParams.get('maxLeadScore') ? parseInt(searchParams.get('maxLeadScore')!) : undefined,
      searchQuery: searchParams.get('searchQuery') || searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as ContactQueryParams['sortBy']) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as ContactQueryParams['sortOrder']) || 'desc'
    };

    // Validate lead score parameters
    if (params.minLeadScore !== undefined && (params.minLeadScore < 0 || params.minLeadScore > 100)) {
      return NextResponse.json(
        { error: 'minLeadScore must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (params.maxLeadScore !== undefined && (params.maxLeadScore < 0 || params.maxLeadScore > 100)) {
      return NextResponse.json(
        { error: 'maxLeadScore must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (params.minLeadScore !== undefined && params.maxLeadScore !== undefined && params.minLeadScore > params.maxLeadScore) {
      return NextResponse.json(
        { error: 'minLeadScore cannot be greater than maxLeadScore' },
        { status: 400 }
      );
    }

    // Validate sort parameters
    const validSortFields = ['firstName', 'lastName', 'leadScore', 'createdAt', 'updatedAt'];
    if (params.sortBy && !validSortFields.includes(params.sortBy)) {
      return NextResponse.json(
        { error: `Invalid sortBy field. Valid options: ${validSortFields.join(', ')}` },
        { status: 400 }
      );
    }

    const validSortOrders = ['asc', 'desc'];
    if (params.sortOrder && !validSortOrders.includes(params.sortOrder)) {
      return NextResponse.json(
        { error: `Invalid sortOrder. Valid options: ${validSortOrders.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch contacts from service
    const result = await getAllContacts(params);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Total-Count': result.pagination.total.toString(),
        'X-Page': result.pagination.page.toString(),
        'X-Limit': result.pagination.limit.toString()
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts
 * 
 * Creates a new contact record
 * 
 * Request body:
 * - firstName: string (required)
 * - lastName: string (required)
 * - email: string (required, must be valid email)
 * - phone?: string
 * - company: string (required)
 * - title?: string
 * - industry?: string
 * - status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'
 * - source: string (required)
 * - assignedTo?: string (user ID)
 * - tags?: string[]
 * - customFields?: Record<string, any>
 * 
 * @returns The created contact object
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = createContactSchema.safeParse(body);
    
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

    // Create the contact
    const newContact = await createContact(validationResult.data as CreateContactDto);

    return NextResponse.json(newContact, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Location': `/api/contacts/${newContact.id}`
      }
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    
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
 * Method not allowed handler for unsupported HTTP methods
 */
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use PUT /api/contacts/[id] to update a specific contact.' },
    { status: 405, headers: { 'Allow': 'GET, POST' } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use DELETE /api/contacts/[id] to delete a specific contact.' },
    { status: 405, headers: { 'Allow': 'GET, POST' } }
  );
}