/**
 * Individual Contact API Route Handler
 * 
 * Handles operations on specific contacts
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { LeadStatus } from '@prisma/client';

const updateContactSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  twitter: z.string().optional(),
  companyId: z.string().nullable().optional(),
  leadStatus: z.nativeEnum(LeadStatus).optional(),
  leadScore: z.number().int().min(0).max(100).optional(),
  leadSource: z.string().optional(),
  assignedToId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  lastContactedAt: z.string().datetime().optional(),
});

/**
 * GET /api/contacts/v2/[id]
 * 
 * Get a single contact with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const includeActivities = searchParams.get('includeActivities') === 'true';
    const includeEmails = searchParams.get('includeEmails') === 'true';
    const includeCalls = searchParams.get('includeCalls') === 'true';
    const includeNotes = searchParams.get('includeNotes') === 'true';
    const includeTasks = searchParams.get('includeTasks') === 'true';
    const includeDeals = searchParams.get('includeDeals') === 'true';

    // Fetch contact
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId: payload.organizationId,
      },
      include: {
        company: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        leadScoreHistory: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        activities: includeActivities ? {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        } : false,
        emails: includeEmails ? {
          take: 10,
          orderBy: { email: { sentAt: 'desc' } },
          include: {
            email: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        } : false,
        calls: includeCalls ? {
          take: 10,
          orderBy: { startedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        } : false,
        notes: includeNotes ? {
          take: 10,
          orderBy: { createdAt: 'desc' },
        } : false,
        tasks: includeTasks ? {
          take: 10,
          orderBy: { dueDate: 'asc' },
          where: {
            status: { not: 'COMPLETED' },
          },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        } : false,
        deals: includeDeals ? {
          include: {
            deal: {
              include: {
                owner: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
                company: true,
              },
            },
          },
        } : false,
        _count: {
          select: {
            activities: true,
            emails: true,
            calls: true,
            tasks: true,
            notes: true,
            deals: true,
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Calculate engagement metrics
    const engagement = {
      lastActivity: await prisma.activity.findFirst({
        where: { contactId: id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, type: true },
      }),
      totalTouchpoints: contact._count.activities + contact._count.emails + contact._count.calls,
      responseRate: contact._count.emails > 0 
        ? await calculateResponseRate(id) 
        : 0,
    };

    return NextResponse.json({
      ...contact,
      engagement,
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
 * PUT /api/contacts/v2/[id]
 * 
 * Update a contact
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const validationResult = updateContactSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if contact exists
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId: payload.organizationId,
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Track lead score changes
    if (data.leadScore !== undefined && data.leadScore !== existingContact.leadScore) {
      await prisma.leadScoreHistory.create({
        data: {
          contactId: id,
          score: data.leadScore,
          previousScore: existingContact.leadScore,
          reason: 'Manual update',
          factors: {
            updatedBy: payload.userId,
            timestamp: new Date(),
          },
        },
      });
    }

    // Update contact
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        ...data,
        lastContactedAt: data.lastContactedAt ? new Date(data.lastContactedAt) : undefined,
      },
      include: {
        company: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Track activity
    const changes = Object.keys(data).filter(key => 
      data[key as keyof typeof data] !== existingContact[key as keyof typeof existingContact]
    );
    
    if (changes.length > 0) {
      await prisma.activity.create({
        data: {
          type: 'NOTE_ADDED',
          subject: 'Contact updated',
          description: `Updated fields: ${changes.join(', ')}`,
          contactId: id,
          userId: payload.userId,
          metadata: { changes: data },
        },
      });
    }

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
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
 * DELETE /api/contacts/v2/[id]
 * 
 * Delete a contact (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if contact exists
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId: payload.organizationId,
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Soft delete by moving to a different status
    await prisma.contact.update({
      where: { id },
      data: {
        leadStatus: 'LOST',
        customFields: {
          ...(contact.customFields as any || {}),
          deletedAt: new Date().toISOString(),
          deletedBy: payload.userId,
        },
      },
    });

    // Track activity
    await prisma.activity.create({
      data: {
        type: 'NOTE_ADDED',
        subject: 'Contact deleted',
        description: `${contact.firstName} ${contact.lastName} was deleted`,
        contactId: id,
        userId: payload.userId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate response rate
async function calculateResponseRate(contactId: string): Promise<number> {
  const emailStats = await prisma.emailRecipient.aggregate({
    where: { contactId },
    _count: {
      _all: true,
      replied: true,
    },
  });

  if (emailStats._count._all === 0) return 0;
  return Math.round((emailStats._count.replied / emailStats._count._all) * 100);
}