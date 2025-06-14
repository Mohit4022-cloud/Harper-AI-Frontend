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
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Mock reset tokens for demo purposes
const validResetTokens = new Map([
  ['demo-reset-token', 'admin@harperai.com'],
  ['test-reset-token', 'sdr@harperai.com'],
])

export const POST = withErrorHandler(async (request: Request) => {
  // Simulate network delay
  await simulateDelay(300);
  
  const body = await request.json();
  
  // Validate input
  const validationResult = resetPasswordSchema.safeParse(body);
  if (!validationResult.success) {
    throw new AppError(
      'Validation failed',
      ErrorTypes.VALIDATION_ERROR,
      { 
        errors: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    );
  }

  const { token, password } = validationResult.data;

  // Validate reset token
  const email = validResetTokens.get(token);
  if (!email) {
    throw new AppError(
      'Invalid or expired reset token',
      ErrorTypes.UNAUTHORIZED,
      { token }
    );
  }

  // In a real app, we would:
  // 1. Verify the token and check expiration
  // 2. Hash the new password
  // 3. Update the user's password in the database
  // 4. Invalidate the reset token
  // 5. Send a confirmation email
  
  console.log(`[Auth] Password reset completed for: ${email}`);

  return createApiResponse(
    {},
    'Password has been reset successfully. You can now login with your new password.',
    { 
      email,
      passwordReset: true 
    }
  );
});