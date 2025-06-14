import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withErrorHandler, 
  AppError, 
  ErrorTypes, 
  createApiResponse,
  simulateDelay 
} from '@/lib/errorHandler'

// Validation schema
const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
})

// Mock verification tokens for demo purposes
const validVerificationTokens = new Map([
  ['demo-verify-token', 'newuser@harperai.com'],
  ['test-verify-token', 'testuser@harperai.com'],
])

export const POST = withErrorHandler(async (request: Request) => {
  // Simulate network delay
  await simulateDelay(200);
  
  const body = await request.json();
  
  // Validate input
  const validationResult = verifyEmailSchema.safeParse(body);
  if (!validationResult.success) {
    throw new AppError(
      'Invalid verification token',
      ErrorTypes.VALIDATION_ERROR,
      { 
        errors: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    );
  }

  const { token } = validationResult.data;

  // Validate verification token
  const email = validVerificationTokens.get(token);
  if (!email) {
    throw new AppError(
      'Invalid or expired verification token',
      ErrorTypes.UNAUTHORIZED,
      { token }
    );
  }

  // In a real app, we would:
  // 1. Verify the token and check expiration
  // 2. Update the user's email verification status
  // 3. Invalidate the verification token
  // 4. Send a welcome email
  
  console.log(`[Auth] Email verified for: ${email}`);

  return createApiResponse(
    { email },
    'Email verified successfully. You can now access all features.',
    { 
      email,
      emailVerified: true 
    }
  );
});