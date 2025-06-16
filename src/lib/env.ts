import { z } from 'zod';

/**
 * Server-side environment variables schema
 */
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Database
  DATABASE_URL: z.string().optional(),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRY: z.string().default('7d'),
  REFRESH_TOKEN_EXPIRY: z.string().default('30d'),
  
  // API Keys (optional in development)
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_AGENT_ID: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_CALLER_NUMBER: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Feature Flags
  ENABLE_REAL_TIME_TRANSCRIPTION: z.string().transform(val => val === 'true').default('false'),
  ENABLE_AI_COACHING: z.string().transform(val => val === 'true').default('false'),
  ENABLE_PREDICTIVE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  ENABLE_CRM_SYNC: z.string().transform(val => val === 'true').default('false'),
});

/**
 * Client-side environment variables schema
 * These are prefixed with NEXT_PUBLIC_
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_WS_URL: z.string().optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().default('1.0.0'),
  NEXT_PUBLIC_ENABLE_CALLING: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_RECORDING: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_TRANSCRIPTION: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_AI_COACHING: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_REAL_TIME_TRANSCRIPTION: z.string().transform(val => val === 'true').default('false'),
});

/**
 * Validates environment variables at build/runtime
 */
export function validateEnv() {
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    try {
      // Skip validation in test environment with minimal config
      if (process.env.NODE_ENV === 'test') {
        const testEnv = {
            NODE_ENV: 'test' as const,
            JWT_SECRET: 'test-secret-for-testing-only-not-for-production',
            JWT_EXPIRY: '7d',
            REFRESH_TOKEN_EXPIRY: '30d',
            DATABASE_URL: undefined,
            ELEVENLABS_API_KEY: undefined,
            ELEVENLABS_AGENT_ID: undefined,
            TWILIO_ACCOUNT_SID: undefined,
            TWILIO_AUTH_TOKEN: undefined,
            TWILIO_CALLER_NUMBER: undefined,
            RATE_LIMIT_WINDOW: '60000',
            RATE_LIMIT_MAX_REQUESTS: '100',
            LOG_LEVEL: 'info' as const,
            ENABLE_REAL_TIME_TRANSCRIPTION: false,
            ENABLE_AI_COACHING: false,
            ENABLE_PREDICTIVE_ANALYTICS: false,
            ENABLE_CRM_SYNC: false,
        };
        const testClientEnv = {
            NEXT_PUBLIC_API_URL: undefined,
            NEXT_PUBLIC_WS_URL: undefined,
            NEXT_PUBLIC_APP_VERSION: '1.0.0',
            NEXT_PUBLIC_ENABLE_CALLING: false,
            NEXT_PUBLIC_ENABLE_RECORDING: false,
            NEXT_PUBLIC_ENABLE_TRANSCRIPTION: false,
            NEXT_PUBLIC_ENABLE_AI_COACHING: false,
            NEXT_PUBLIC_ENABLE_REAL_TIME_TRANSCRIPTION: false,
        };
        return {
          server: testEnv,
          client: testClientEnv,
        };
      }
      
      const serverEnv = serverEnvSchema.parse(process.env);
      const clientEnv = clientEnvSchema.parse(process.env);
      
      // Additional production checks
      if (serverEnv.NODE_ENV === 'production') {
        // Ensure critical services are configured
        if (!serverEnv.DATABASE_URL) {
          throw new Error('DATABASE_URL is required in production');
        }
        
        // Ensure JWT secret is not default
        if (serverEnv.JWT_SECRET.includes('demo') || serverEnv.JWT_SECRET.includes('test')) {
          throw new Error('JWT_SECRET must be changed from default value in production');
        }
        
        // Warn about missing optional services
        if (!serverEnv.ELEVENLABS_API_KEY) {
          console.warn('⚠️  ELEVENLABS_API_KEY not set - AI voice features will be disabled');
        }
        
        if (!serverEnv.TWILIO_ACCOUNT_SID || !serverEnv.TWILIO_AUTH_TOKEN) {
          console.warn('⚠️  Twilio credentials not set - calling features will be disabled');
        }
      }
      
      return { server: serverEnv, client: clientEnv };
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Invalid environment variables:');
        error.errors.forEach((err) => {
          console.error(`   ${err.path.join('.')}: ${err.message}`);
        });
        
        // In development, provide helpful setup instructions
        if (process.env.NODE_ENV === 'development') {
          console.error('\n📝 To fix this, create a .env.local file with:');
          console.error('   JWT_SECRET=your-secret-key-at-least-32-chars');
          console.error('   # Add other required variables as needed\n');
        }
      }
      throw new Error('Environment validation failed');
    }
  }
  
  // Client-side validation
  return {
    server: {} as z.infer<typeof serverEnvSchema>,
    client: clientEnvSchema.parse({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
      NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
      NEXT_PUBLIC_ENABLE_CALLING: process.env.NEXT_PUBLIC_ENABLE_CALLING,
      NEXT_PUBLIC_ENABLE_RECORDING: process.env.NEXT_PUBLIC_ENABLE_RECORDING,
      NEXT_PUBLIC_ENABLE_TRANSCRIPTION: process.env.NEXT_PUBLIC_ENABLE_TRANSCRIPTION,
      NEXT_PUBLIC_ENABLE_AI_COACHING: process.env.NEXT_PUBLIC_ENABLE_AI_COACHING,
      NEXT_PUBLIC_ENABLE_REAL_TIME_TRANSCRIPTION: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME_TRANSCRIPTION,
    }),
  };
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe access to environment variables
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;