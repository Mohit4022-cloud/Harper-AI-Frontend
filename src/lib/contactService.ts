/**
 * Contact Service - Business logic for contact management
 * 
 * This service provides CRUD operations for contacts with features like:
 * - Pagination
 * - Filtering by status, tags, assigned user
 * - Sorting by various fields
 * - Lead scoring updates
 * - Activity tracking
 */

import { Contact, ContactStatus } from '@/types';

// In-memory database for demo purposes
// In production, this would connect to a real database
let contactsDatabase: Contact[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@acmecorp.com',
    phone: '+1-555-0123',
    company: 'Acme Corp',
    title: 'VP of Sales',
    industry: 'Technology',
    leadScore: 85,
    status: 'qualified',
    source: 'Website',
    assignedTo: '2',
    tags: ['hot-lead', 'enterprise'],
    notes: [],
    activities: [],
    customFields: {},
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@techstart.com',
    phone: '+1-555-0456',
    company: 'TechStart Inc',
    title: 'CTO',
    industry: 'SaaS',
    leadScore: 92,
    status: 'new',
    source: 'LinkedIn',
    assignedTo: '2',
    tags: ['decision-maker', 'saas'],
    notes: [],
    activities: [],
    customFields: {},
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Davis',
    email: 'mike.davis@growthco.com',
    phone: '+1-555-0789',
    company: 'Growth Co',
    title: 'Head of Marketing',
    industry: 'Marketing',
    leadScore: 78,
    status: 'contacted',
    source: 'Referral',
    assignedTo: '2',
    tags: ['warm-lead', 'marketing'],
    notes: [],
    activities: [],
    customFields: {},
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-22'),
  },
];

/**
 * Query parameters for filtering and pagination
 */
export interface ContactQueryParams {
  page?: number;
  limit?: number;
  status?: ContactStatus;
  assignedTo?: string;
  tags?: string[];
  source?: string;
  minLeadScore?: number;
  maxLeadScore?: number;
  searchQuery?: string;
  sortBy?: 'firstName' | 'lastName' | 'leadScore' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * DTO for creating a new contact
 */
export interface CreateContactDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  title?: string;
  industry?: string;
  status?: ContactStatus;
  source: string;
  assignedTo?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

/**
 * DTO for updating a contact
 */
export interface UpdateContactDto extends Partial<CreateContactDto> {
  leadScore?: number;
}

/**
 * Get all contacts with pagination and filtering
 */
export async function getAllContacts(params: ContactQueryParams = {}) {
  const {
    page = 1,
    limit = 10,
    status,
    assignedTo,
    tags,
    source,
    minLeadScore,
    maxLeadScore,
    searchQuery,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  // Filter contacts
  let filteredContacts = [...contactsDatabase];

  if (status) {
    filteredContacts = filteredContacts.filter(c => c.status === status);
  }

  if (assignedTo) {
    filteredContacts = filteredContacts.filter(c => c.assignedTo === assignedTo);
  }

  if (tags && tags.length > 0) {
    filteredContacts = filteredContacts.filter(c => 
      tags.some(tag => c.tags.includes(tag))
    );
  }

  if (source) {
    filteredContacts = filteredContacts.filter(c => c.source === source);
  }

  if (minLeadScore !== undefined) {
    filteredContacts = filteredContacts.filter(c => c.leadScore >= minLeadScore);
  }

  if (maxLeadScore !== undefined) {
    filteredContacts = filteredContacts.filter(c => c.leadScore <= maxLeadScore);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredContacts = filteredContacts.filter(c => 
      c.firstName.toLowerCase().includes(query) ||
      c.lastName.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.company.toLowerCase().includes(query) ||
      (c.title && c.title.toLowerCase().includes(query))
    );
  }

  // Sort contacts
  const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
  filteredContacts.sort((a, b) => {
    switch (sortBy) {
      case 'firstName':
        return a.firstName.localeCompare(b.firstName) * sortMultiplier;
      case 'lastName':
        return a.lastName.localeCompare(b.lastName) * sortMultiplier;
      case 'leadScore':
        return (a.leadScore - b.leadScore) * sortMultiplier;
      case 'createdAt':
        return (a.createdAt.getTime() - b.createdAt.getTime()) * sortMultiplier;
      case 'updatedAt':
        return (a.updatedAt.getTime() - b.updatedAt.getTime()) * sortMultiplier;
      default:
        return 0;
    }
  });

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  return {
    data: paginatedContacts,
    pagination: {
      page,
      limit,
      total: filteredContacts.length,
      totalPages: Math.ceil(filteredContacts.length / limit),
      hasMore: endIndex < filteredContacts.length,
    },
  };
}

/**
 * Get a single contact by ID
 */
export async function getContactById(id: string): Promise<Contact | null> {
  const contact = contactsDatabase.find(c => c.id === id);
  return contact || null;
}

/**
 * Create a new contact
 */
export async function createContact(data: CreateContactDto): Promise<Contact> {
  const newContact: Contact = {
    id: `contact-${Date.now()}`,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    company: data.company,
    title: data.title,
    industry: data.industry,
    leadScore: 50, // Default lead score
    status: data.status || 'new',
    source: data.source,
    assignedTo: data.assignedTo,
    tags: data.tags || [],
    notes: [],
    activities: [],
    customFields: data.customFields || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  contactsDatabase.push(newContact);
  return newContact;
}

/**
 * Update an existing contact
 */
export async function updateContact(id: string, data: UpdateContactDto): Promise<Contact> {
  const contactIndex = contactsDatabase.findIndex(c => c.id === id);
  
  if (contactIndex === -1) {
    throw new Error(`Contact with id '${id}' not found`);
  }

  const updatedContact = {
    ...contactsDatabase[contactIndex],
    ...data,
    updatedAt: new Date(),
  };

  contactsDatabase[contactIndex] = updatedContact;
  return updatedContact;
}

/**
 * Delete a contact
 */
export async function deleteContact(id: string): Promise<void> {
  const contactIndex = contactsDatabase.findIndex(c => c.id === id);
  
  if (contactIndex === -1) {
    throw new Error(`Contact with id '${id}' not found`);
  }

  contactsDatabase.splice(contactIndex, 1);
}

/**
 * Update lead score for a contact
 */
export async function updateLeadScore(id: string, score: number): Promise<Contact> {
  if (score < 0 || score > 100) {
    throw new Error('Lead score must be between 0 and 100');
  }

  return updateContact(id, { leadScore: score });
}

/**
 * Add a tag to a contact
 */
export async function addTag(id: string, tag: string): Promise<Contact> {
  const contact = await getContactById(id);
  if (!contact) {
    throw new Error(`Contact with id '${id}' not found`);
  }

  if (!contact.tags.includes(tag)) {
    const updatedTags = [...contact.tags, tag];
    return updateContact(id, { tags: updatedTags });
  }

  return contact;
}

/**
 * Remove a tag from a contact
 */
export async function removeTag(id: string, tag: string): Promise<Contact> {
  const contact = await getContactById(id);
  if (!contact) {
    throw new Error(`Contact with id '${id}' not found`);
  }

  const updatedTags = contact.tags.filter(t => t !== tag);
  return updateContact(id, { tags: updatedTags });
}

/**
 * Get contacts by assigned user
 */
export async function getContactsByAssignee(userId: string): Promise<Contact[]> {
  return contactsDatabase.filter(c => c.assignedTo === userId);
}

/**
 * Get contact statistics
 */
export async function getContactStats() {
  const totalContacts = contactsDatabase.length;
  const statusCounts = contactsDatabase.reduce((acc, contact) => {
    acc[contact.status] = (acc[contact.status] || 0) + 1;
    return acc;
  }, {} as Record<ContactStatus, number>);

  const averageLeadScore = contactsDatabase.reduce((sum, c) => sum + c.leadScore, 0) / totalContacts || 0;

  const sourceCounts = contactsDatabase.reduce((acc, contact) => {
    acc[contact.source] = (acc[contact.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: totalContacts,
    byStatus: statusCounts,
    averageLeadScore: Math.round(averageLeadScore),
    bySources: sourceCounts,
  };
}

/**
 * Reset contacts database (for testing)
 */
export function resetContactsDatabase(contacts?: Contact[]) {
  if (contacts) {
    contactsDatabase = [...contacts];
  } else {
    // Reset to default contacts
    contactsDatabase = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@acmecorp.com',
        phone: '+1-555-0123',
        company: 'Acme Corp',
        title: 'VP of Sales',
        industry: 'Technology',
        leadScore: 85,
        status: 'qualified',
        source: 'Website',
        assignedTo: '2',
        tags: ['hot-lead', 'enterprise'],
        notes: [],
        activities: [],
        customFields: {},
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
      },
      {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@techstart.com',
        phone: '+1-555-0456',
        company: 'TechStart Inc',
        title: 'CTO',
        industry: 'SaaS',
        leadScore: 92,
        status: 'new',
        source: 'LinkedIn',
        assignedTo: '2',
        tags: ['decision-maker', 'saas'],
        notes: [],
        activities: [],
        customFields: {},
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18'),
      },
    ];
  }
}

/**
 * Get contacts database (for testing)
 */
export function getContactsDatabase(): Contact[] {
  return [...contactsDatabase];
}