import { NextRequest } from 'next/server'
import { z } from 'zod'
import { verifyToken } from '@/lib/jwt'
import { findUserById, validatePassword } from '@/lib/mockData'
import { 
  withErrorHandler, 
  AppError, 
  ErrorTypes, 
  createApiResponse,
  simulateDelay 
} from '@/lib/errorHandler'

// Validation schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})

export const POST = withErrorHandler(async (request: Request) => {
  // Simulate network delay
  await simulateDelay(300);
  
  // Get token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(
      'Authorization header missing or invalid',
      ErrorTypes.UNAUTHORIZED
    );
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    throw new AppError(
      'Invalid or expired token',
      ErrorTypes.UNAUTHORIZED
    );
  }

  const body = await request.json();
  
  // Validate input
  const validationResult = changePasswordSchema.safeParse(body);
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

  const { currentPassword, newPassword } = validationResult.data;

  // Verify current password
  const user = findUserById(payload.userId);
  if (!user || !validatePassword(user.email, currentPassword)) {
    throw new AppError(
      'Current password is incorrect',
      ErrorTypes.UNAUTHORIZED
    );
  }

  // In a real app, we would:
  // 1. Hash the new password
  // 2. Update the user's password in the database
  // 3. Optionally invalidate all existing sessions
  // 4. Send a security notification email
  
  console.log(`[Auth] Password changed for user: ${user.email}`);

  return createApiResponse(
    {},
    'Password changed successfully',
    { 
      userId: user.id,
      email: user.email,
      passwordChanged: true 
    }
  );
});