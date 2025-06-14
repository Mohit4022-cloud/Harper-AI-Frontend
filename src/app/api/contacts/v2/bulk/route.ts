/**
 * Bulk Contact Operations API
 * 
 * Handles bulk updates, deletes, and operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { LeadStatus } from '@prisma/client';

const bulkUpdateSchema = z.object({
  contactIds: z.array(z.string()).min(1).max(500),
  updates: z.object({
    leadStatus: z.nativeEnum(LeadStatus).optional(),
    assignedToId: z.string().optional(),
    tags: z.object({
      add: z.array(z.string()).optional(),
      remove: z.array(z.string()).optional(),
      set: z.array(z.string()).optional(),
    }).optional(),
    customFields: z.record(z.any()).optional(),
  }),
});

const bulkDeleteSchema = z.object({
  contactIds: z.array(z.string()).min(1).max(500),
  permanent: z.boolean().optional(),
});

const bulkActionSchema = z.object({
  contactIds: z.array(z.string()).min(1).max(500),
  action: z.enum(['addToSegment', 'removeFromSegment', 'addToCampaign', 'scoreLeads']),
  params: z.record(z.any()).optional(),
});

/**
 * POST /api/contacts/v2/bulk
 * 
 * Perform bulk operations on contacts
 */
export async function POST(request: NextRequest) {
  try {
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

    const searchParams = request.nextUrl.searchParams;
    const operation = searchParams.get('operation');

    if (!operation) {
      return NextResponse.json(
        { error: 'Operation parameter is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    switch (operation) {
      case 'update':
        return handleBulkUpdate(body, payload);
      case 'delete':
        return handleBulkDelete(body, payload);
      case 'action':
        return handleBulkAction(body, payload);
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleBulkUpdate(body: any, payload: any) {
  const validationResult = bulkUpdateSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.errors },
      { status: 400 }
    );
  }

  const { contactIds, updates } = validationResult.data;

  // Verify contacts belong to organization
  const contacts = await prisma.contact.findMany({
    where: {
      id: { in: contactIds },
      organizationId: payload.organizationId,
    },
    select: { id: true, tags: true },
  });

  if (contacts.length === 0) {
    return NextResponse.json(
      { error: 'No valid contacts found' },
      { status: 404 }
    );
  }

  const validIds = contacts.map(c => c.id);
  const results = {
    updated: 0,
    failed: 0,
    errors: [] as any[],
  };

  // Handle tag updates separately if needed
  if (updates.tags) {
    for (const contact of contacts) {
      let newTags = [...contact.tags];
      
      if (updates.tags.set) {
        newTags = updates.tags.set;
      } else {
        if (updates.tags.add) {
          newTags = [...new Set([...newTags, ...updates.tags.add])];
        }
        if (updates.tags.remove) {
          newTags = newTags.filter(tag => !updates.tags!.remove!.includes(tag));
        }
      }

      try {
        await prisma.contact.update({
          where: { id: contact.id },
          data: { tags: newTags },
        });
        results.updated++;
      } catch (error) {
        results.failed++;
        results.errors.push({ id: contact.id, error: 'Failed to update tags' });
      }
    }
  }

  // Update other fields
  const updateData: any = {};
  if (updates.leadStatus) updateData.leadStatus = updates.leadStatus;
  if (updates.assignedToId) updateData.assignedToId = updates.assignedToId;
  if (updates.customFields) updateData.customFields = updates.customFields;

  if (Object.keys(updateData).length > 0) {
    const updateResult = await prisma.contact.updateMany({
      where: { id: { in: validIds } },
      data: updateData,
    });
    results.updated = Math.max(results.updated, updateResult.count);
  }

  // Track activity
  await prisma.activity.create({
    data: {
      type: 'NOTE_ADDED',
      subject: 'Bulk update',
      description: `Updated ${results.updated} contacts`,
      userId: payload.userId,
      metadata: {
        contactIds: validIds,
        updates,
      },
    },
  });

  return NextResponse.json({
    message: 'Bulk update completed',
    results,
  });
}

async function handleBulkDelete(body: any, payload: any) {
  const validationResult = bulkDeleteSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.errors },
      { status: 400 }
    );
  }

  const { contactIds, permanent = false } = validationResult.data;

  // Verify contacts belong to organization
  const contactCount = await prisma.contact.count({
    where: {
      id: { in: contactIds },
      organizationId: payload.organizationId,
    },
  });

  if (contactCount === 0) {
    return NextResponse.json(
      { error: 'No valid contacts found' },
      { status: 404 }
    );
  }

  if (permanent) {
    // Hard delete - remove all related data first
    await prisma.$transaction([
      prisma.activity.deleteMany({ where: { contactId: { in: contactIds } } }),
      prisma.emailRecipient.deleteMany({ where: { contactId: { in: contactIds } } }),
      prisma.call.deleteMany({ where: { contactId: { in: contactIds } } }),
      prisma.task.deleteMany({ where: { contactId: { in: contactIds } } }),
      prisma.note.deleteMany({ where: { contactId: { in: contactIds } } }),
      prisma.dealContact.deleteMany({ where: { contactId: { in: contactIds } } }),
      prisma.segmentContact.deleteMany({ where: { contactId: { in: contactIds } } }),
      prisma.leadScoreHistory.deleteMany({ where: { contactId: { in: contactIds } } }),
      prisma.contact.deleteMany({ where: { id: { in: contactIds } } }),
    ]);
  } else {
    // Soft delete
    await prisma.contact.updateMany({
      where: { id: { in: contactIds } },
      data: {
        leadStatus: 'LOST',
        customFields: {
          deletedAt: new Date().toISOString(),
          deletedBy: payload.userId,
        },
      },
    });
  }

  // Track activity
  await prisma.activity.create({
    data: {
      type: 'NOTE_ADDED',
      subject: 'Bulk delete',
      description: `${permanent ? 'Permanently deleted' : 'Soft deleted'} ${contactCount} contacts`,
      userId: payload.userId,
      metadata: {
        contactIds,
        permanent,
      },
    },
  });

  return NextResponse.json({
    message: `Successfully ${permanent ? 'deleted' : 'archived'} ${contactCount} contacts`,
  });
}

async function handleBulkAction(body: any, payload: any) {
  const validationResult = bulkActionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.errors },
      { status: 400 }
    );
  }

  const { contactIds, action, params = {} } = validationResult.data;

  // Verify contacts belong to organization
  const contacts = await prisma.contact.findMany({
    where: {
      id: { in: contactIds },
      organizationId: payload.organizationId,
    },
    select: { id: true, leadScore: true },
  });

  if (contacts.length === 0) {
    return NextResponse.json(
      { error: 'No valid contacts found' },
      { status: 404 }
    );
  }

  switch (action) {
    case 'addToSegment': {
      if (!params.segmentId) {
        return NextResponse.json(
          { error: 'segmentId is required' },
          { status: 400 }
        );
      }

      // Verify segment exists
      const segment = await prisma.segment.findFirst({
        where: {
          id: params.segmentId,
          organizationId: payload.organizationId,
        },
      });

      if (!segment) {
        return NextResponse.json(
          { error: 'Segment not found' },
          { status: 404 }
        );
      }

      // Add contacts to segment
      const segmentContacts = contacts.map(contact => ({
        segmentId: params.segmentId,
        contactId: contact.id,
      }));

      await prisma.segmentContact.createMany({
        data: segmentContacts,
        skipDuplicates: true,
      });

      return NextResponse.json({
        message: `Added ${contacts.length} contacts to segment`,
      });
    }

    case 'scoreLeads': {
      // Simple lead scoring based on completeness and engagement
      const scoringResults = await Promise.all(
        contacts.map(async (contact) => {
          const fullContact = await prisma.contact.findUnique({
            where: { id: contact.id },
            include: {
              _count: {
                select: {
                  activities: true,
                  emails: true,
                  calls: true,
                },
              },
            },
          });

          if (!fullContact) return null;

          // Calculate score based on various factors
          let score = 0;
          
          // Profile completeness (max 40 points)
          if (fullContact.email) score += 10;
          if (fullContact.phone) score += 10;
          if (fullContact.title) score += 10;
          if (fullContact.companyId) score += 10;
          
          // Engagement (max 40 points)
          score += Math.min(fullContact._count.activities * 2, 15);
          score += Math.min(fullContact._count.emails * 3, 15);
          score += Math.min(fullContact._count.calls * 5, 10);
          
          // Status bonus (max 20 points)
          if (fullContact.leadStatus === 'QUALIFIED') score += 20;
          else if (fullContact.leadStatus === 'CONTACTED') score += 10;
          
          score = Math.min(score, 100);

          // Update score if different
          if (score !== contact.leadScore) {
            await prisma.contact.update({
              where: { id: contact.id },
              data: { leadScore: score },
            });

            await prisma.leadScoreHistory.create({
              data: {
                contactId: contact.id,
                score,
                previousScore: contact.leadScore,
                reason: 'Bulk scoring',
                factors: {
                  profileCompleteness: Math.min(40, score),
                  engagement: Math.min(40, Math.max(0, score - 40)),
                  statusBonus: Math.max(0, score - 80),
                },
              },
            });
          }

          return { id: contact.id, score };
        })
      );

      return NextResponse.json({
        message: 'Lead scoring completed',
        results: scoringResults.filter(Boolean),
      });
    }

    default:
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
  }
}