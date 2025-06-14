/**
 * Contact Export API
 * 
 * Export contacts to CSV or JSON format
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { Prisma } from '@prisma/client';
import { Parser } from 'json2csv';

/**
 * POST /api/contacts/v2/export
 * 
 * Export contacts based on filters
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
    const {
      format = 'csv',
      filters = {},
      fields = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'title',
        'company.name',
        'leadStatus',
        'leadScore',
        'assignedTo.name',
        'createdAt',
        'lastContactedAt',
      ],
      limit = 10000,
    } = body;

    // Build where clause (similar to search)
    const where: Prisma.ContactWhereInput = {
      organizationId: payload.organizationId,
    };

    // Apply filters
    if (filters.contactIds && filters.contactIds.length > 0) {
      where.id = { in: filters.contactIds };
    }

    if (filters.leadStatus && filters.leadStatus.length > 0) {
      where.leadStatus = { in: filters.leadStatus };
    }

    if (filters.assignedTo && filters.assignedTo.length > 0) {
      where.assignedToId = { in: filters.assignedTo };
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    // Fetch contacts
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        company: {
          select: {
            name: true,
            domain: true,
            industry: true,
          },
        },
        assignedTo: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      take: Math.min(limit, 50000), // Max 50k records
      orderBy: { createdAt: 'desc' },
    });

    // Format data
    const formattedContacts = contacts.map(contact => ({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      title: contact.title || '',
      department: contact.department || '',
      linkedin: contact.linkedin || '',
      companyName: contact.company?.name || '',
      companyDomain: contact.company?.domain || '',
      companyIndustry: contact.company?.industry || '',
      leadStatus: contact.leadStatus,
      leadScore: contact.leadScore,
      leadSource: contact.leadSource || '',
      assignedToName: contact.assignedTo?.name || '',
      assignedToEmail: contact.assignedTo?.email || '',
      tags: contact.tags.join(', '),
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
      lastContactedAt: contact.lastContactedAt?.toISOString() || '',
    }));

    if (format === 'csv') {
      // Convert to CSV
      const parser = new Parser({
        fields: [
          { label: 'ID', value: 'id' },
          { label: 'First Name', value: 'firstName' },
          { label: 'Last Name', value: 'lastName' },
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Title', value: 'title' },
          { label: 'Department', value: 'department' },
          { label: 'LinkedIn', value: 'linkedin' },
          { label: 'Company', value: 'companyName' },
          { label: 'Company Domain', value: 'companyDomain' },
          { label: 'Industry', value: 'companyIndustry' },
          { label: 'Lead Status', value: 'leadStatus' },
          { label: 'Lead Score', value: 'leadScore' },
          { label: 'Lead Source', value: 'leadSource' },
          { label: 'Assigned To', value: 'assignedToName' },
          { label: 'Assigned To Email', value: 'assignedToEmail' },
          { label: 'Tags', value: 'tags' },
          { label: 'Created At', value: 'createdAt' },
          { label: 'Updated At', value: 'updatedAt' },
          { label: 'Last Contacted', value: 'lastContactedAt' },
        ],
      });

      const csv = parser.parse(formattedContacts);
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="contacts_export_${new Date().toISOString()}.csv"`,
        },
      });
    } else if (format === 'json') {
      // Return as JSON
      return NextResponse.json({
        exportDate: new Date().toISOString(),
        organization: payload.organizationId,
        totalRecords: formattedContacts.length,
        contacts: formattedContacts,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use csv or json' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting contacts:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}