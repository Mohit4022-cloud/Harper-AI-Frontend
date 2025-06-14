/**
 * Call Service - Business logic for managing calls
 * 
 * This service handles all call-related operations using in-memory storage.
 * In production, this would integrate with a database.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Call entity interface
 */
export interface Call {
  id: string;
  contactName: string;
  contactId?: string;
  phoneNumber?: string;
  date: string;
  duration?: number;
  summary: string;
  outcome?: 'connected' | 'voicemail' | 'no_answer' | 'busy' | 'failed';
  sentiment?: 'positive' | 'neutral' | 'negative';
  recording?: {
    url: string;
    duration: number;
  };
  transcript?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Data Transfer Object for creating a new call
 */
export interface CreateCallDto {
  contactName: string;
  contactId?: string;
  phoneNumber?: string;
  date: string;
  duration?: number;
  summary: string;
  outcome?: 'connected' | 'voicemail' | 'no_answer' | 'busy' | 'failed';
  sentiment?: 'positive' | 'neutral' | 'negative';
  recording?: {
    url: string;
    duration: number;
  };
  transcript?: string;
  tags?: string[];
}

/**
 * Data Transfer Object for updating an existing call
 */
export interface UpdateCallDto extends Partial<CreateCallDto> {}

/**
 * Query parameters for filtering calls
 */
export interface CallQueryParams {
  page?: number;
  limit?: number;
  outcome?: string;
  contactId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'duration' | 'contactName';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// In-memory storage for calls (replace with database in production)
let calls: Call[] = [
  {
    id: '1',
    contactName: 'John Doe',
    contactId: 'contact-1',
    phoneNumber: '+1-555-0123',
    date: new Date('2024-01-15T10:30:00Z').toISOString(),
    duration: 300,
    summary: 'Initial discovery call to discuss product features and pricing',
    outcome: 'connected',
    sentiment: 'positive',
    recording: {
      url: 'https://api.harperai.com/recordings/call-1.mp3',
      duration: 300
    },
    transcript: 'Customer expressed interest in enterprise features...',
    tags: ['discovery', 'enterprise', 'interested'],
    createdAt: new Date('2024-01-15T10:30:00Z').toISOString(),
    updatedAt: new Date('2024-01-15T10:35:00Z').toISOString()
  },
  {
    id: '2',
    contactName: 'Jane Smith',
    contactId: 'contact-2',
    phoneNumber: '+1-555-0124',
    date: new Date('2024-01-15T14:00:00Z').toISOString(),
    duration: 180,
    summary: 'Follow-up call to address technical questions',
    outcome: 'connected',
    sentiment: 'neutral',
    recording: {
      url: 'https://api.harperai.com/recordings/call-2.mp3',
      duration: 180
    },
    transcript: 'Discussed integration requirements and timeline...',
    tags: ['follow-up', 'technical'],
    createdAt: new Date('2024-01-15T14:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-15T14:03:00Z').toISOString()
  },
  {
    id: '3',
    contactName: 'Bob Johnson',
    contactId: 'contact-3',
    phoneNumber: '+1-555-0125',
    date: new Date('2024-01-16T09:00:00Z').toISOString(),
    duration: 0,
    summary: 'Attempted call - left voicemail',
    outcome: 'voicemail',
    sentiment: 'neutral',
    tags: ['voicemail', 'follow-up-needed'],
    createdAt: new Date('2024-01-16T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-16T09:00:00Z').toISOString()
  }
];

/**
 * Retrieves all calls with optional filtering and pagination
 * 
 * @param params - Query parameters for filtering and pagination
 * @returns Promise resolving to paginated calls
 */
export async function getAllCalls(params: CallQueryParams = {}): Promise<PaginatedResponse<Call>> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));

  const {
    page = 1,
    limit = 10,
    outcome,
    contactId,
    dateFrom,
    dateTo,
    sortBy = 'date',
    sortOrder = 'desc'
  } = params;

  // Apply filters
  let filteredCalls = [...calls];

  if (outcome) {
    filteredCalls = filteredCalls.filter(call => call.outcome === outcome);
  }

  if (contactId) {
    filteredCalls = filteredCalls.filter(call => call.contactId === contactId);
  }

  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    filteredCalls = filteredCalls.filter(call => new Date(call.date) >= fromDate);
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    filteredCalls = filteredCalls.filter(call => new Date(call.date) <= toDate);
  }

  // Apply sorting
  filteredCalls.sort((a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case 'date':
        compareValue = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'duration':
        compareValue = (a.duration || 0) - (b.duration || 0);
        break;
      case 'contactName':
        compareValue = a.contactName.localeCompare(b.contactName);
        break;
    }

    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedCalls = filteredCalls.slice(startIndex, endIndex);

  return {
    data: paginatedCalls,
    pagination: {
      page,
      limit,
      total: filteredCalls.length,
      totalPages: Math.ceil(filteredCalls.length / limit)
    }
  };
}

/**
 * Retrieves a single call by ID
 * 
 * @param id - The call ID
 * @returns Promise resolving to the call or null if not found
 */
export async function getCallById(id: string): Promise<Call | null> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50));

  const call = calls.find(c => c.id === id);
  return call || null;
}

/**
 * Creates a new call record
 * 
 * @param payload - The call data to create
 * @returns Promise resolving to the created call
 */
export async function createCall(payload: CreateCallDto): Promise<Call> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));

  const now = new Date().toISOString();
  const newCall: Call = {
    id: uuidv4(),
    ...payload,
    createdAt: now,
    updatedAt: now
  };

  calls.push(newCall);
  return newCall;
}

/**
 * Updates an existing call record
 * 
 * @param id - The call ID to update
 * @param payload - The fields to update
 * @returns Promise resolving to the updated call
 * @throws Error if call not found
 */
export async function updateCall(id: string, payload: UpdateCallDto): Promise<Call> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));

  const index = calls.findIndex(c => c.id === id);
  if (index === -1) {
    throw new Error(`Call with id ${id} not found`);
  }

  const updatedCall: Call = {
    ...calls[index],
    ...payload,
    updatedAt: new Date().toISOString()
  };

  calls[index] = updatedCall;
  return updatedCall;
}

/**
 * Deletes a call record
 * 
 * @param id - The call ID to delete
 * @returns Promise resolving when deletion is complete
 * @throws Error if call not found
 */
export async function deleteCall(id: string): Promise<void> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50));

  const index = calls.findIndex(c => c.id === id);
  if (index === -1) {
    throw new Error(`Call with id ${id} not found`);
  }

  calls.splice(index, 1);
}

/**
 * Resets the in-memory database (useful for testing)
 * 
 * @param initialData - Optional initial data to seed
 */
export function resetCallsDatabase(initialData?: Call[]): void {
  if (initialData) {
    calls = [...initialData];
  } else {
    calls = [];
  }
}

/**
 * Gets the current state of the in-memory database (useful for testing)
 * 
 * @returns Current calls array
 */
export function getCallsDatabase(): Call[] {
  return [...calls];
}