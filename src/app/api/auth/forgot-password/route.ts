import { NextRequest } from 'next/server'
import { z } from 'zod'
import { findUserByEmail } from '@/lib/mockData'
import { 
  withErrorHandler, 
  AppError, 
  ErrorTypes, 
  createApiResponse,
  simulateDelay 
} from '@/lib/errorHandler'

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export const POST = withErrorHandler(async (request: Request) => {
  // Simulate network delay
  await simulateDelay(500);
  
  const body = await request.json();
  
  // Validate input
  const validationResult = forgotPasswordSchema.safeParse(body);
  if (!validationResult.success) {
    throw new AppError(
      'Invalid email format',
      ErrorTypes.VALIDATION_ERROR,
      { 
        errors: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    );
  }

  const { email } = validationResult.data;

  // Check if user exists (but don't reveal this in the response)
  const user = findUserByEmail(email);
  
  // Always return success to prevent email enumeration
  // In a real app, we would:
  // 1. Generate a reset token
  // 2. Store it with an expiration
  // 3. Send an email with the reset link
  
  if (user) {
    console.log(`[Auth] Password reset requested for: ${user.email}`);
    // In production, send email here
  }

  return createApiResponse(
    {},
    'If an account exists with this email, you will receive a password reset link shortly.',
    { 
      email,
      resetRequested: true 
    }
  );
});