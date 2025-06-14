/**
 * Contact Search API
 * 
 * Advanced search with full-text search capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { Prisma } from '@prisma/client';

/**
 * GET /api/contacts/v2/search
 * 
 * Full-text search across contacts
 */
export async function GET(request: NextRequest) {
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
    const query = searchParams.get('q') || '';
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'));

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Perform search using PostgreSQL full-text search
    const searchQuery = query.split(' ').join(' & ');
    
    const contacts = await prisma.$queryRaw<any[]>`
      SELECT 
        c.id,
        c."firstName",
        c."lastName",
        c.email,
        c.phone,
        c.title,
        c."leadStatus",
        c."leadScore",
        c."companyId",
        comp.name as "companyName",
        ts_rank(
          to_tsvector('english', 
            COALESCE(c."firstName", '') || ' ' || 
            COALESCE(c."lastName", '') || ' ' || 
            COALESCE(c.email, '') || ' ' || 
            COALESCE(c.phone, '') || ' ' || 
            COALESCE(c.title, '') || ' ' ||
            COALESCE(comp.name, '')
          ),
          to_tsquery('english', ${searchQuery})
        ) as rank
      FROM "Contact" c
      LEFT JOIN "Company" comp ON c."companyId" = comp.id
      WHERE 
        c."organizationId" = ${payload.organizationId}
        AND to_tsvector('english', 
          COALESCE(c."firstName", '') || ' ' || 
          COALESCE(c."lastName", '') || ' ' || 
          COALESCE(c.email, '') || ' ' || 
          COALESCE(c.phone, '') || ' ' || 
          COALESCE(c.title, '') || ' ' ||
          COALESCE(comp.name, '')
        ) @@ to_tsquery('english', ${searchQuery})
      ORDER BY rank DESC
      LIMIT ${limit}
    `;

    // Get assignees for the results
    const contactIds = contacts.map(c => c.id);
    const assignees = await prisma.contact.findMany({
      where: { id: { in: contactIds } },
      select: {
        id: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    const assigneeMap = new Map(assignees.map(a => [a.id, a.assignedTo]));

    // Format results
    const results = contacts.map(contact => ({
      ...contact,
      assignedTo: assigneeMap.get(contact.id),
    }));

    return NextResponse.json({
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error searching contacts:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts/v2/search
 * 
 * Advanced search with complex filters
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

    const body = await request.json();
    const { filters = {}, sort = { field: 'createdAt', order: 'desc' }, pagination = { page: 1, limit: 25 } } = body;

    // Build complex where clause
    const where: Prisma.ContactWhereInput = {
      organizationId: payload.organizationId,
    };

    // Add all filter conditions
    if (filters.query) {
      where.OR = [
        { firstName: { contains: filters.query, mode: 'insensitive' } },
        { lastName: { contains: filters.query, mode: 'insensitive' } },
        { email: { contains: filters.query, mode: 'insensitive' } },
        { phone: { contains: filters.query, mode: 'insensitive' } },
        { title: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    if (filters.leadStatus && filters.leadStatus.length > 0) {
      where.leadStatus = { in: filters.leadStatus };
    }

    if (filters.leadScoreRange) {
      where.leadScore = {
        gte: filters.leadScoreRange.min,
        lte: filters.leadScoreRange.max,
      };
    }

    if (filters.assignedTo && filters.assignedTo.length > 0) {
      where.assignedToId = { in: filters.assignedTo };
    }

    if (filters.companies && filters.companies.length > 0) {
      where.companyId = { in: filters.companies };
    }

    if (filters.tags && filters.tags.length > 0) {
      if (filters.tagOperator === 'all') {
        where.tags = { hasEvery: filters.tags };
      } else {
        where.tags = { hasSome: filters.tags };
      }
    }

    if (filters.createdDateRange) {
      where.createdAt = {
        gte: new Date(filters.createdDateRange.start),
        lte: new Date(filters.createdDateRange.end),
      };
    }

    if (filters.lastContactedDateRange) {
      where.lastContactedAt = {
        gte: new Date(filters.lastContactedDateRange.start),
        lte: new Date(filters.lastContactedDateRange.end),
      };
    }

    // Custom field filters
    if (filters.customFields) {
      for (const [key, value] of Object.entries(filters.customFields)) {
        where.customFields = {
          path: [key],
          equals: value as any,
        };
      }
    }

    // Count total
    const total = await prisma.contact.count({ where });

    // Fetch contacts
    const contacts = await prisma.contact.findMany({
      where,
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
        _count: {
          select: {
            activities: true,
            emails: true,
            calls: true,
          },
        },
      },
      orderBy: {
        [sort.field]: sort.order,
      },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return NextResponse.json({
      data: contacts,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
      appliedFilters: filters,
    });
  } catch (error) {
    console.error('Error in advanced search:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}