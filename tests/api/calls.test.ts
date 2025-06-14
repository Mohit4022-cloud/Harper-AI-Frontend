/**
 * API Route Tests for Calls endpoints
 * 
 * This file demonstrates how to test Next.js API routes using Jest and
 * the built-in test utilities. These tests can be run with:
 * npm test tests/api/calls.test.ts
 */

import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/calls/route';
import { GET as getById, PUT as updateById, DELETE as deleteById } from '@/app/api/calls/[id]/route';
import { resetCallsDatabase, getCallsDatabase } from '@/lib/callService';

// Mock Next.js request helper
function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options;
  
  const request = new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  // Cast to NextRequest (in real tests, use proper Next.js test utilities)
  return request as unknown as NextRequest;
}

describe('Calls API Routes', () => {
  beforeEach(() => {
    // Reset database to initial state before each test
    resetCallsDatabase([
      {
        id: 'test-1',
        contactName: 'Test User 1',
        date: '2024-01-15T10:00:00Z',
        summary: 'Test call 1',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'test-2',
        contactName: 'Test User 2',
        date: '2024-01-15T14:00:00Z',
        summary: 'Test call 2',
        outcome: 'connected',
        createdAt: '2024-01-15T14:00:00Z',
        updatedAt: '2024-01-15T14:00:00Z'
      }
    ]);
  });

  describe('GET /api/calls', () => {
    it('should return paginated list of calls', async () => {
      const request = createMockRequest('http://localhost:3000/api/calls');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
      expect(data.data).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it('should respect pagination parameters', async () => {
      const request = createMockRequest('http://localhost:3000/api/calls?page=1&limit=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(1);
      expect(data.pagination.totalPages).toBe(2);
    });

    it('should filter by outcome', async () => {
      const request = createMockRequest('http://localhost:3000/api/calls?outcome=connected');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].outcome).toBe('connected');
    });

    it('should validate date parameters', async () => {
      const request = createMockRequest('http://localhost:3000/api/calls?dateFrom=invalid-date');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid dateFrom format');
    });
  });

  describe('POST /api/calls', () => {
    it('should create a new call with valid data', async () => {
      const newCall = {
        contactName: 'New Contact',
        date: '2024-01-16T10:00:00Z',
        summary: 'New test call',
        outcome: 'connected',
        duration: 300
      };

      const request = createMockRequest('http://localhost:3000/api/calls', {
        method: 'POST',
        body: newCall
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.contactName).toBe(newCall.contactName);
      expect(data.summary).toBe(newCall.summary);
      expect(response.headers.get('Location')).toBe(`/api/calls/${data.id}`);
    });

    it('should validate required fields', async () => {
      const invalidCall = {
        // Missing required fields
        outcome: 'connected'
      };

      const request = createMockRequest('http://localhost:3000/api/calls', {
        method: 'POST',
        body: invalidCall
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeInstanceOf(Array);
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'contactName' }),
          expect.objectContaining({ field: 'date' }),
          expect.objectContaining({ field: 'summary' })
        ])
      );
    });

    it('should validate date format', async () => {
      const callWithInvalidDate = {
        contactName: 'Test',
        date: 'not-a-date',
        summary: 'Test'
      };

      const request = createMockRequest('http://localhost:3000/api/calls', {
        method: 'POST',
        body: callWithInvalidDate
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details[0].field).toBe('date');
    });
  });

  describe('GET /api/calls/[id]', () => {
    it('should return a specific call by ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/calls/test-1');
      const response = await getById(request, { params: Promise.resolve({ id: 'test-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('test-1');
      expect(data.contactName).toBe('Test User 1');
    });

    it('should return 404 for non-existent call', async () => {
      const request = createMockRequest('http://localhost:3000/api/calls/non-existent');
      const response = await getById(request, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });

  describe('PUT /api/calls/[id]', () => {
    it('should update an existing call', async () => {
      const updates = {
        summary: 'Updated summary',
        outcome: 'voicemail' as const
      };

      const request = createMockRequest('http://localhost:3000/api/calls/test-1', {
        method: 'PUT',
        body: updates
      });
      
      const response = await updateById(request, { params: Promise.resolve({ id: 'test-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('test-1');
      expect(data.summary).toBe('Updated summary');
      expect(data.outcome).toBe('voicemail');
      expect(new Date(data.updatedAt).getTime()).toBeGreaterThan(
        new Date(data.createdAt).getTime()
      );
    });

    it('should return 404 for non-existent call', async () => {
      const request = createMockRequest('http://localhost:3000/api/calls/non-existent', {
        method: 'PUT',
        body: { summary: 'Updated' }
      });
      
      const response = await updateById(request, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should validate update fields', async () => {
      const invalidUpdate = {
        outcome: 'invalid-outcome'
      };

      const request = createMockRequest('http://localhost:3000/api/calls/test-1', {
        method: 'PUT',
        body: invalidUpdate
      });
      
      const response = await updateById(request, { params: Promise.resolve({ id: 'test-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject unknown fields', async () => {
      const updateWithUnknownField = {
        summary: 'Updated',
        unknownField: 'value'
      };

      const request = createMockRequest('http://localhost:3000/api/calls/test-1', {
        method: 'PUT',
        body: updateWithUnknownField
      });
      
      const response = await updateById(request, { params: Promise.resolve({ id: 'test-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/calls/[id]', () => {
    it('should delete an existing call', async () => {
      const request = createMockRequest('http://localhost:3000/api/calls/test-1', {
        method: 'DELETE'
      });
      
      const response = await deleteById(request, { params: Promise.resolve({ id: 'test-1' }) });

      expect(response.status).toBe(204);
      expect(await response.text()).toBe('');

      // Verify call was deleted
      const calls = getCallsDatabase();
      expect(calls).toHaveLength(1);
      expect(calls.find(c => c.id === 'test-1')).toBeUndefined();
    });

    it('should return 404 for non-existent call', async () => {
      const request = createMockRequest('http://localhost:3000/api/calls/non-existent', {
        method: 'DELETE'
      });
      
      const response = await deleteById(request, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });

  describe('Method Not Allowed', () => {
    it('should return 405 for PUT on collection endpoint', async () => {
      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toContain('Method not allowed');
      expect(response.headers.get('Allow')).toBe('GET, POST');
    });

    it('should return 405 for DELETE on collection endpoint', async () => {
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toContain('Method not allowed');
      expect(response.headers.get('Allow')).toBe('GET, POST');
    });
  });
});

/**
 * Integration test example using fetch
 * 
 * This demonstrates how to test the API endpoints running in a real Next.js server
 */
describe('Calls API Integration Tests', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

  it('should perform full CRUD operations', async () => {
    // Create a call
    const createResponse = await fetch(`${baseUrl}/api/calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactName: 'Integration Test',
        date: new Date().toISOString(),
        summary: 'Integration test call'
      })
    });

    expect(createResponse.status).toBe(201);
    const createdCall = await createResponse.json();
    expect(createdCall.id).toBeDefined();

    // Read the call
    const getResponse = await fetch(`${baseUrl}/api/calls/${createdCall.id}`);
    expect(getResponse.status).toBe(200);
    const fetchedCall = await getResponse.json();
    expect(fetchedCall.id).toBe(createdCall.id);

    // Update the call
    const updateResponse = await fetch(`${baseUrl}/api/calls/${createdCall.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: 'Updated integration test call'
      })
    });

    expect(updateResponse.status).toBe(200);
    const updatedCall = await updateResponse.json();
    expect(updatedCall.summary).toBe('Updated integration test call');

    // Delete the call
    const deleteResponse = await fetch(`${baseUrl}/api/calls/${createdCall.id}`, {
      method: 'DELETE'
    });

    expect(deleteResponse.status).toBe(204);

    // Verify deletion
    const verifyResponse = await fetch(`${baseUrl}/api/calls/${createdCall.id}`);
    expect(verifyResponse.status).toBe(404);
  });
});

/**
 * Playwright E2E test example
 * 
 * Save this in a separate file: tests/e2e/calls-api.spec.ts
 */
const playwrightExample = `
import { test, expect } from '@playwright/test';

test.describe('Calls API E2E Tests', () => {
  test('should create and retrieve a call', async ({ request }) => {
    // Create a new call
    const createResponse = await request.post('/api/calls', {
      data: {
        contactName: 'E2E Test Contact',
        date: new Date().toISOString(),
        summary: 'E2E test call summary',
        outcome: 'connected',
        duration: 180
      }
    });

    expect(createResponse.ok()).toBeTruthy();
    const newCall = await createResponse.json();
    expect(newCall.id).toBeTruthy();

    // Retrieve the created call
    const getResponse = await request.get(\`/api/calls/\${newCall.id}\`);
    expect(getResponse.ok()).toBeTruthy();
    
    const retrievedCall = await getResponse.json();
    expect(retrievedCall.contactName).toBe('E2E Test Contact');
    expect(retrievedCall.outcome).toBe('connected');
  });

  test('should handle validation errors', async ({ request }) => {
    const response = await request.post('/api/calls', {
      data: {
        // Missing required fields
        outcome: 'connected'
      }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error).toBe('Validation failed');
    expect(error.details).toBeInstanceOf(Array);
  });

  test('should filter calls by outcome', async ({ request }) => {
    // Create test data
    await request.post('/api/calls', {
      data: {
        contactName: 'Connected Call',
        date: new Date().toISOString(),
        summary: 'Test',
        outcome: 'connected'
      }
    });

    await request.post('/api/calls', {
      data: {
        contactName: 'Voicemail Call',
        date: new Date().toISOString(),
        summary: 'Test',
        outcome: 'voicemail'
      }
    });

    // Filter by outcome
    const response = await request.get('/api/calls?outcome=connected');
    expect(response.ok()).toBeTruthy();
    
    const result = await response.json();
    const connectedCalls = result.data.filter(call => call.outcome === 'connected');
    expect(connectedCalls.length).toBeGreaterThan(0);
    expect(connectedCalls.every(call => call.outcome === 'connected')).toBeTruthy();
  });
});
`;

// Export the Playwright example for reference
export { playwrightExample };