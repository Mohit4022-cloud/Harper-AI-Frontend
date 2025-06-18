/**
 * API Contract Tests
 * 
 * Validates API response schemas and contracts to ensure
 * frontend-backend compatibility
 */

import { test, expect } from '@playwright/test';
import { z } from 'zod';

// Define API response schemas
const schemas = {
  // Auth endpoints
  login: z.object({
    token: z.string(),
    user: z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string(),
      role: z.enum(['admin', 'sdr', 'manager']),
    }),
  }),

  register: z.object({
    token: z.string(),
    user: z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string(),
      role: z.string(),
    }),
  }),

  // Contact endpoints
  contactList: z.object({
    contacts: z.array(z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
      company: z.string().optional(),
      position: z.string().optional(),
      phone: z.string().optional(),
      tags: z.array(z.string()).optional(),
      lastContacted: z.string().datetime().optional(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    })),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  }),

  contactDetail: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    company: z.string().optional(),
    position: z.string().optional(),
    phone: z.string().optional(),
    tags: z.array(z.string()).optional(),
    lastContacted: z.string().datetime().optional(),
    notes: z.string().optional(),
    socialProfiles: z.object({
      linkedin: z.string().url().optional(),
      twitter: z.string().optional(),
    }).optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),

  // Call endpoints
  callToken: z.object({
    token: z.string(),
    identity: z.string(),
    expiresAt: z.string().datetime(),
  }),

  callHistory: z.object({
    calls: z.array(z.object({
      id: z.string(),
      contactId: z.string(),
      duration: z.number(),
      status: z.enum(['completed', 'missed', 'failed', 'voicemail']),
      recording: z.string().url().optional(),
      transcript: z.string().optional(),
      sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
      createdAt: z.string().datetime(),
    })),
    total: z.number(),
  }),

  // Email endpoints
  emailGenerate: z.object({
    emails: z.array(z.object({
      subject: z.string(),
      body: z.string(),
      personalization: z.object({
        painPoints: z.array(z.string()).optional(),
        valueProps: z.array(z.string()).optional(),
      }).optional(),
    })),
    contactId: z.string(),
    generatedAt: z.string().datetime(),
  }),

  // Settings endpoints
  settings: z.object({
    theme: z.enum(['light', 'dark', 'system']),
    notifications: z.object({
      email: z.boolean(),
      push: z.boolean(),
      sms: z.boolean(),
    }),
    integrations: z.object({
      twilio: z.object({
        accountSid: z.string().optional(),
        authToken: z.string().optional(),
        phoneNumber: z.string().optional(),
      }).optional(),
      elevenlabs: z.object({
        apiKey: z.string().optional(),
        voiceId: z.string().optional(),
      }).optional(),
    }),
  }),

  // Analytics endpoints
  analytics: z.object({
    metrics: z.object({
      totalCalls: z.number(),
      totalEmails: z.number(),
      conversionRate: z.number(),
      activeContacts: z.number(),
    }),
    charts: z.object({
      callVolume: z.array(z.object({
        date: z.string(),
        value: z.number(),
      })),
      emailVolume: z.array(z.object({
        date: z.string(),
        value: z.number(),
      })),
    }),
  }),
};

test.describe('API Contract Tests', () => {
  test.beforeEach(async ({ request }) => {
    // Set up auth token for authenticated endpoints
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    });
    
    if (loginResponse.ok()) {
      const { token } = await loginResponse.json();
      test.info().annotations.push({
        type: 'auth-token',
        description: token,
      });
    }
  });

  test.describe('Authentication Endpoints', () => {
    test('POST /api/auth/login', async ({ request }) => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      
      // Validate schema
      const result = schemas.login.safeParse(json);
      expect(result.success).toBeTruthy();
      
      // Validate specific fields
      expect(json.token).toBeTruthy();
      expect(json.user.email).toBe('test@example.com');
    });

    test('POST /api/auth/register', async ({ request }) => {
      const response = await request.post('/api/auth/register', {
        data: {
          email: `test${Date.now()}@example.com`,
          password: 'password123',
          name: 'Test User',
        },
      });

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      
      const result = schemas.register.safeParse(json);
      expect(result.success).toBeTruthy();
    });

    test('POST /api/auth/logout', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      const response = await request.post('/api/auth/logout', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Contact Endpoints', () => {
    test('GET /api/contacts', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      const response = await request.get('/api/contacts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      
      const result = schemas.contactList.safeParse(json);
      expect(result.success).toBeTruthy();
      
      // Validate pagination
      expect(json.page).toBeGreaterThanOrEqual(1);
      expect(json.pageSize).toBeGreaterThan(0);
      expect(json.total).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/contacts/:id', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      // First get a contact ID
      const listResponse = await request.get('/api/contacts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const { contacts } = await listResponse.json();
      if (contacts.length === 0) {
        test.skip('No contacts available');
      }
      
      const contactId = contacts[0].id;
      
      const response = await request.get(`/api/contacts/${contactId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      
      const result = schemas.contactDetail.safeParse(json);
      expect(result.success).toBeTruthy();
      expect(json.id).toBe(contactId);
    });

    test('POST /api/contacts', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      const newContact = {
        name: 'API Test Contact',
        email: `apitest${Date.now()}@example.com`,
        company: 'Test Company',
        position: 'Test Position',
      };
      
      const response = await request.post('/api/contacts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: newContact,
      });

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      
      const result = schemas.contactDetail.safeParse(json);
      expect(result.success).toBeTruthy();
      expect(json.name).toBe(newContact.name);
      expect(json.email).toBe(newContact.email);
    });

    test('PUT /api/contacts/:id', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      // Create a contact first
      const createResponse = await request.post('/api/contacts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          name: 'Update Test Contact',
          email: `update${Date.now()}@example.com`,
        },
      });
      
      const contact = await createResponse.json();
      
      // Update the contact
      const updateData = {
        name: 'Updated Name',
        company: 'Updated Company',
      };
      
      const response = await request.put(`/api/contacts/${contact.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: updateData,
      });

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      
      const result = schemas.contactDetail.safeParse(json);
      expect(result.success).toBeTruthy();
      expect(json.name).toBe(updateData.name);
      expect(json.company).toBe(updateData.company);
    });

    test('DELETE /api/contacts/:id', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      // Create a contact to delete
      const createResponse = await request.post('/api/contacts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          name: 'Delete Test Contact',
          email: `delete${Date.now()}@example.com`,
        },
      });
      
      const contact = await createResponse.json();
      
      const response = await request.delete(`/api/contacts/${contact.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      
      // Verify contact is deleted
      const getResponse = await request.get(`/api/contacts/${contact.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe('Call Endpoints', () => {
    test('POST /api/calls/token', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      const response = await request.post('/api/calls/token', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      
      const result = schemas.callToken.safeParse(json);
      expect(result.success).toBeTruthy();
      
      // Validate token expiry
      const expiresAt = new Date(json.expiresAt);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    test('GET /api/calls/history', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      const response = await request.get('/api/calls/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      
      const result = schemas.callHistory.safeParse(json);
      expect(result.success).toBeTruthy();
    });
  });

  test.describe('Email Endpoints', () => {
    test('POST /api/emails/generate', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      // Get a contact first
      const contactsResponse = await request.get('/api/contacts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const { contacts } = await contactsResponse.json();
      if (contacts.length === 0) {
        test.skip('No contacts available');
      }
      
      const response = await request.post('/api/emails/generate', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          contactId: contacts[0].id,
          tone: 'professional',
          length: 'medium',
          includeFeatures: ['product-features'],
        },
      });

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      
      const result = schemas.emailGenerate.safeParse(json);
      expect(result.success).toBeTruthy();
      
      // Validate email content
      expect(json.emails.length).toBeGreaterThan(0);
      json.emails.forEach(email => {
        expect(email.subject).toBeTruthy();
        expect(email.body).toBeTruthy();
      });
    });
  });

  test.describe('Settings Endpoints', () => {
    test('GET /api/settings', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      const response = await request.get('/api/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      
      const result = schemas.settings.safeParse(json);
      expect(result.success).toBeTruthy();
    });

    test('PUT /api/settings', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      const updateData = {
        theme: 'dark',
        notifications: {
          email: false,
          push: true,
          sms: false,
        },
      };
      
      const response = await request.put('/api/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: updateData,
      });

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      
      const result = schemas.settings.safeParse(json);
      expect(result.success).toBeTruthy();
      expect(json.theme).toBe(updateData.theme);
    });
  });

  test.describe('Analytics Endpoints', () => {
    test('GET /api/analytics', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      const response = await request.get('/api/analytics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      
      const result = schemas.analytics.safeParse(json);
      expect(result.success).toBeTruthy();
      
      // Validate metrics
      expect(json.metrics.totalCalls).toBeGreaterThanOrEqual(0);
      expect(json.metrics.conversionRate).toBeGreaterThanOrEqual(0);
      expect(json.metrics.conversionRate).toBeLessThanOrEqual(100);
    });

    test('GET /api/analytics/export', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      const response = await request.get('/api/analytics/export?format=csv', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toContain('text/csv');
    });
  });

  test.describe('Error Handling', () => {
    test('401 Unauthorized without token', async ({ request }) => {
      const response = await request.get('/api/contacts');
      
      expect(response.status()).toBe(401);
      const json = await response.json();
      expect(json.error).toBeTruthy();
    });

    test('404 Not Found for invalid endpoint', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      const response = await request.get('/api/invalid-endpoint', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      expect(response.status()).toBe(404);
    });

    test('400 Bad Request for invalid data', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      const response = await request.post('/api/contacts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          // Missing required fields
          company: 'Test Company',
        },
      });
      
      expect(response.status()).toBe(400);
      const json = await response.json();
      expect(json.error).toBeTruthy();
      expect(json.details).toBeTruthy();
    });

    test('429 Rate Limiting', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      // Make multiple rapid requests
      const promises = Array.from({ length: 20 }, () =>
        request.get('/api/contacts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
      
      const responses = await Promise.all(promises);
      
      // At least one should be rate limited
      const rateLimited = responses.some(r => r.status() === 429);
      expect(rateLimited).toBeTruthy();
    });
  });

  test.describe('Response Headers', () => {
    test('CORS headers are present', async ({ request }) => {
      const response = await request.options('/api/contacts');
      
      expect(response.headers()['access-control-allow-origin']).toBeTruthy();
      expect(response.headers()['access-control-allow-methods']).toContain('GET');
      expect(response.headers()['access-control-allow-methods']).toContain('POST');
    });

    test('Security headers are present', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      const response = await request.get('/api/contacts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      expect(response.headers()['x-content-type-options']).toBe('nosniff');
      expect(response.headers()['x-frame-options']).toBe('DENY');
      expect(response.headers()['x-xss-protection']).toBe('1; mode=block');
    });
  });

  test.describe('Pagination', () => {
    test('Supports page and pageSize parameters', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      const response = await request.get('/api/contacts?page=2&pageSize=5', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      
      expect(json.page).toBe(2);
      expect(json.pageSize).toBe(5);
      expect(json.contacts.length).toBeLessThanOrEqual(5);
    });

    test('Returns proper pagination metadata', async ({ request }) => {
      const token = test.info().annotations.find(a => a.type === 'auth-token')?.description;
      
      const response = await request.get('/api/contacts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();
      
      expect(json).toHaveProperty('total');
      expect(json).toHaveProperty('page');
      expect(json).toHaveProperty('pageSize');
      expect(json).toHaveProperty('totalPages');
      expect(json).toHaveProperty('hasMore');
    });
  });
});