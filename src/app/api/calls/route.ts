/**
 * Calls API Route Handler
 * 
 * Handles operations on the calls collection:
 * - GET /api/calls - List all calls with filtering and pagination
 * - POST /api/calls - Create a new call
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  getAllCalls, 
  createCall, 
  type CallQueryParams,
  type CreateCallDto 
} from '@/lib/callService';

/**
 * Zod schema for validating create call requests
 */
const createCallSchema = z.object({
  contactName: z.string().min(1, 'Contact name is required'),
  contactId: z.string().optional(),
  phoneNumber: z.string().optional(),
  date: z.string().datetime('Invalid date format'),
  duration: z.number().int().min(0).optional(),
  summary: z.string().min(1, 'Summary is required'),
  outcome: z.enum(['connected', 'voicemail', 'no_answer', 'busy', 'failed']).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  recording: z.object({
    url: z.string().url(),
    duration: z.number().int().positive()
  }).optional(),
  transcript: z.string().optional(),
  tags: z.array(z.string()).optional()
});

/**
 * GET /api/calls
 * 
 * Retrieves a paginated list of calls with optional filtering
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - outcome: Filter by call outcome
 * - contactId: Filter by contact ID
 * - dateFrom: Filter calls after this date (ISO 8601)
 * - dateTo: Filter calls before this date (ISO 8601)
 * - sortBy: Sort field (date, duration, contactName)
 * - sortOrder: Sort direction (asc, desc)
 * 
 * @returns Paginated list of calls
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse and validate query parameters
    const params: CallQueryParams = {
      page: Math.max(1, parseInt(searchParams.get('page') || '1')),
      limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10'))),
      outcome: searchParams.get('outcome') || undefined,
      contactId: searchParams.get('contactId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: (searchParams.get('sortBy') as CallQueryParams['sortBy']) || 'date',
      sortOrder: (searchParams.get('sortOrder') as CallQueryParams['sortOrder']) || 'desc'
    };

    // Validate date formats if provided
    if (params.dateFrom && isNaN(Date.parse(params.dateFrom))) {
      return NextResponse.json(
        { error: 'Invalid dateFrom format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }

    if (params.dateTo && isNaN(Date.parse(params.dateTo))) {
      return NextResponse.json(
        { error: 'Invalid dateTo format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }

    // Validate sort parameters
    const validSortFields = ['date', 'duration', 'contactName'];
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

    // Fetch calls from service
    const result = await getAllCalls(params);

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
    console.error('Error fetching calls:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calls
 * 
 * Creates a new call record
 * 
 * Request body:
 * - contactName: string (required)
 * - contactId?: string
 * - phoneNumber?: string
 * - date: string (ISO 8601, required)
 * - duration?: number (seconds)
 * - summary: string (required)
 * - outcome?: 'connected' | 'voicemail' | 'no_answer' | 'busy' | 'failed'
 * - sentiment?: 'positive' | 'neutral' | 'negative'
 * - recording?: { url: string, duration: number }
 * - transcript?: string
 * - tags?: string[]
 * 
 * @returns The created call object
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = createCallSchema.safeParse(body);
    
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

    // Create the call
    const newCall = await createCall(validationResult.data as CreateCallDto);

    return NextResponse.json(newCall, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Location': `/api/calls/${newCall.id}`
      }
    });
  } catch (error) {
    console.error('Error creating call:', error);
    
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
    { error: 'Method not allowed. Use PUT /api/calls/[id] to update a specific call.' },
    { status: 405, headers: { 'Allow': 'GET, POST' } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use DELETE /api/calls/[id] to delete a specific call.' },
    { status: 405, headers: { 'Allow': 'GET, POST' } }
  );
}