import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { findUserById } from '@/lib/mockData'
import { 
  withErrorHandler, 
  AppError, 
  ErrorTypes, 
  createApiResponse,
  simulateDelay 
} from '@/lib/errorHandler'

export const GET = withErrorHandler(async (request: Request) => {
  // Simulate network delay
  await simulateDelay(100);
  
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

  // Get user data
  const user = findUserById(payload.userId);
  if (!user) {
    throw new AppError(
      'User not found',
      ErrorTypes.NOT_FOUND
    );
  }

  // Remove sensitive data
  const { password, ...safeUser } = user as any;

  return createApiResponse(
    safeUser,
    'User profile retrieved successfully',
    { 
      userId: user.id,
      role: user.role 
    }
  );
});