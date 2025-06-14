/**
 * Single Call API Route Handler
 * 
 * Handles operations on individual call records:
 * - GET /api/calls/[id] - Get a specific call by ID
 * - PUT /api/calls/[id] - Update a specific call
 * - DELETE /api/calls/[id] - Delete a specific call
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getCallById,
  updateCall,
  deleteCall,
  type UpdateCallDto
} from '@/lib/callService';

/**
 * Route segment config for dynamic params
 */
export const dynamic = 'force-dynamic';

/**
 * Zod schema for validating update call requests
 */
const updateCallSchema = z.object({
  contactName: z.string().min(1).optional(),
  contactId: z.string().optional(),
  phoneNumber: z.string().optional(),
  date: z.string().datetime('Invalid date format').optional(),
  duration: z.number().int().min(0).optional(),
  summary: z.string().min(1).optional(),
  outcome: z.enum(['connected', 'voicemail', 'no_answer', 'busy', 'failed']).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  recording: z.object({
    url: z.string().url(),
    duration: z.number().int().positive()
  }).optional(),
  transcript: z.string().optional(),
  tags: z.array(z.string()).optional()
}).strict(); // Reject unknown fields

/**
 * GET /api/calls/[id]
 * 
 * Retrieves a single call by ID
 * 
 * @param request - Next.js request object
 * @param props - Route props containing params Promise
 * @returns The call object or 404 if not found
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
        { error: 'Invalid call ID format' },
        { status: 400 }
      );
    }

    // Fetch the call
    const call = await getCallById(id);

    if (!call) {
      return NextResponse.json(
        { error: `Call with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(call, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60' // Cache for 1 minute
      }
    });
  } catch (error) {
    console.error('Error fetching call:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/calls/[id]
 * 
 * Updates an existing call record
 * 
 * Request body (all fields optional):
 * - contactName?: string
 * - contactId?: string
 * - phoneNumber?: string
 * - date?: string (ISO 8601)
 * - duration?: number (seconds)
 * - summary?: string
 * - outcome?: 'connected' | 'voicemail' | 'no_answer' | 'busy' | 'failed'
 * - sentiment?: 'positive' | 'neutral' | 'negative'
 * - recording?: { url: string, duration: number }
 * - transcript?: string
 * - tags?: string[]
 * 
 * @param request - Next.js request object
 * @param props - Route props containing params Promise
 * @returns The updated call object or error
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
        { error: 'Invalid call ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = updateCallSchema.safeParse(body);
    
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

    // Update the call
    try {
      const updatedCall = await updateCall(id, validationResult.data as UpdateCallDto);
      
      return NextResponse.json(updatedCall, {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          { error: `Call with id '${id}' not found` },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating call:', error);
    
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
 * DELETE /api/calls/[id]
 * 
 * Deletes a call record
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
        { error: 'Invalid call ID format' },
        { status: 400 }
      );
    }

    // Delete the call
    try {
      await deleteCall(id);
      
      // Return 204 No Content on successful deletion
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          { error: `Call with id '${id}' not found` },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting call:', error);
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
    { error: 'Method not allowed. Use POST /api/calls to create a new call.' },
    { status: 405, headers: { 'Allow': 'GET, PUT, DELETE' } }
  );
}