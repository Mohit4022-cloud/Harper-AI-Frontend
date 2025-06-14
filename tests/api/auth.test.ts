/**
 * API Route Tests for Authentication endpoints
 */

import { NextRequest } from 'next/server';
import { POST as login } from '@/app/api/auth/login/route';
import { POST as register } from '@/app/api/auth/register/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { POST as forgotPassword } from '@/app/api/auth/forgot-password/route';
import { POST as resetPassword } from '@/app/api/auth/reset-password/route';
import { POST as changePassword } from '@/app/api/auth/change-password/route';
import { POST as verifyEmail } from '@/app/api/auth/verify-email/route';
import { GET as getProfile } from '@/app/api/auth/me/route';
import { POST as refreshToken } from '@/app/api/auth/refresh/route';
import { generateTokens } from '@/lib/jwt';
import { mockUsers } from '@/lib/mockData';

// Mock Next.js request helper
function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'POST', body, headers = {} } = options;
  
  const request = new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  return request as unknown as NextRequest;
}

describe('Authentication API Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/login', {
        body: {
          email: 'admin@harperai.com',
          password: 'password123'
        }
      });
      
      const response = await login(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('token');
      expect(data.data).toHaveProperty('refreshToken');
      expect(data.data).toHaveProperty('user');
      expect(data.data.user.email).toBe('admin@harperai.com');
    });

    it('should reject invalid credentials', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/login', {
        body: {
          email: 'admin@harperai.com',
          password: 'wrongpassword'
        }
      });
      
      const response = await login(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid email or password');
    });

    it('should validate required fields', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/login', {
        body: {
          email: 'admin@harperai.com'
          // Missing password
        }
      });
      
      const response = await login(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Email and password are required');
    });

    it('should validate email format', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/login', {
        body: {
          email: 'invalid-email',
          password: 'password123'
        }
      });
      
      const response = await login(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid email format');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/register', {
        body: {
          email: 'newuser@harperai.com',
          password: 'password123',
          name: 'New User',
          organizationId: 'org1'
        }
      });
      
      const response = await register(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('token');
      expect(data.data).toHaveProperty('refreshToken');
      expect(data.data.user.email).toBe('newuser@harperai.com');
      expect(data.data.user.role).toBe('sdr');
    });

    it('should reject duplicate email', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/register', {
        body: {
          email: 'admin@harperai.com', // Existing user
          password: 'password123',
          name: 'Duplicate User',
          organizationId: 'org1'
        }
      });
      
      const response = await register(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toContain('User with this email already exists');
    });

    it('should validate password length', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/register', {
        body: {
          email: 'newuser2@harperai.com',
          password: '12345', // Too short
          name: 'New User',
          organizationId: 'org1'
        }
      });
      
      const response = await register(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.details[0].message).toContain('Password must be at least 6 characters');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout with valid token', async () => {
      const user = mockUsers[0];
      const { token } = generateTokens(user);
      
      const request = createMockRequest('http://localhost:3000/api/auth/logout', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const response = await logout(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Logout successful');
    });

    it('should reject without token', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/logout');
      
      const response = await logout(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Authorization header missing');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const user = mockUsers[0];
      const { token } = generateTokens(user);
      
      const request = createMockRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const response = await getProfile(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.email).toBe(user.email);
      expect(data.data.id).toBe(user.id);
    });

    it('should reject invalid token', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      
      const response = await getProfile(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should accept valid email', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/forgot-password', {
        body: {
          email: 'admin@harperai.com'
        }
      });
      
      const response = await forgotPassword(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('If an account exists');
    });

    it('should validate email format', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/forgot-password', {
        body: {
          email: 'invalid-email'
        }
      });
      
      const response = await forgotPassword(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/reset-password', {
        body: {
          token: 'demo-reset-token',
          password: 'newpassword123'
        }
      });
      
      const response = await resetPassword(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Password has been reset successfully');
    });

    it('should reject invalid token', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/reset-password', {
        body: {
          token: 'invalid-token',
          password: 'newpassword123'
        }
      });
      
      const response = await resetPassword(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid or expired reset token');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password with valid current password', async () => {
      const user = mockUsers[0];
      const { token } = generateTokens(user);
      
      const request = createMockRequest('http://localhost:3000/api/auth/change-password', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: {
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        }
      });
      
      const response = await changePassword(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Password changed successfully');
    });

    it('should reject without authentication', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/change-password', {
        body: {
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        }
      });
      
      const response = await changePassword(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/verify-email', {
        body: {
          token: 'demo-verify-token'
        }
      });
      
      const response = await verifyEmail(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Email verified successfully');
    });

    it('should reject invalid token', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/verify-email', {
        body: {
          token: 'invalid-token'
        }
      });
      
      const response = await verifyEmail(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });
});