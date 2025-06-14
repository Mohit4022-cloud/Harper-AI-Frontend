import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { 
  withErrorHandler, 
  AppError, 
  ErrorTypes, 
  createApiResponse,
  simulateDelay 
} from '@/lib/errorHandler'

export const POST = withErrorHandler(async (request: Request) => {
  // Simulate network delay in development
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

  // In a real app, we would:
  // 1. Add the token to a blacklist
  // 2. Clear any server-side sessions
  // 3. Log the logout event
  
  console.log(`[Auth] User logged out: ${payload.email}`);

  return createApiResponse(
    {},
    'Logout successful',
    { 
      userId: payload.userId,
      email: payload.email 
    }
  );
});