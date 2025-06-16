import { env } from '@/lib/env';

/**
 * Security configuration for the application
 */
export const securityConfig = {
  // JWT Configuration
  jwt: {
    secret: env.server.JWT_SECRET,
    expiresIn: env.server.JWT_EXPIRY,
    refreshExpiresIn: env.server.REFRESH_TOKEN_EXPIRY,
    algorithm: 'HS256' as const,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(env.server.RATE_LIMIT_WINDOW),
    maxRequests: parseInt(env.server.RATE_LIMIT_MAX_REQUESTS),
    // Stricter limits for auth endpoints
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per window
    },
  },
  
  // CORS Configuration
  cors: {
    credentials: true,
    maxAge: 86400, // 24 hours
  },
  
  // Security Headers
  headers: {
    contentSecurityPolicy: {
      development: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http: https: ws: wss:;",
      production: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
    },
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
    xXssProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
  },
  
  // Password Requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  
  // Session Configuration
  session: {
    cookieName: 'harper-ai-session',
    secure: env.server.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  
  // API Security
  api: {
    // Endpoints that don't require authentication
    publicEndpoints: [
      '/api/health',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
    ],
    // Endpoints that require special permissions
    adminEndpoints: [
      '/api/users',
      '/api/settings/admin',
      '/api/reports/admin',
    ],
  },
};

/**
 * Check if an endpoint requires authentication
 */
export function requiresAuth(pathname: string): boolean {
  return !securityConfig.api.publicEndpoints.some(endpoint => 
    pathname.startsWith(endpoint)
  );
}

/**
 * Check if an endpoint requires admin privileges
 */
export function requiresAdmin(pathname: string): boolean {
  return securityConfig.api.adminEndpoints.some(endpoint => 
    pathname.startsWith(endpoint)
  );
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars } = securityConfig.password;
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}