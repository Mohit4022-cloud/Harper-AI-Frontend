import { NextRequest } from 'next/server'
import { findUserByEmail, validatePassword } from '@/lib/mockData'
import { generateTokens } from '@/lib/jwt'
import { 
  withErrorHandler, 
  AppError, 
  ErrorTypes, 
  createApiResponse,
  simulateDelay 
} from '@/lib/errorHandler'

export const POST = withErrorHandler(async (request: Request) => {
  // Simulate network delay in development
  await simulateDelay(300);
  
  const body = await request.json();
  const { email, password } = body;

  // Validate input
  if (!email || !password) {
    throw new AppError(
      'Email and password are required',
      ErrorTypes.VALIDATION_ERROR,
      { missingFields: { email: !email, password: !password } }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError(
      'Invalid email format',
      ErrorTypes.VALIDATION_ERROR,
      { field: 'email', value: email }
    );
  }

  // Find user and validate password
  const user = findUserByEmail(email);
  if (!user || !validatePassword(email, password)) {
    throw new AppError(
      'Invalid email or password',
      ErrorTypes.UNAUTHORIZED
    );
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError(
      'Account is deactivated. Please contact support.',
      ErrorTypes.FORBIDDEN,
      { userId: user.id, email: user.email }
    );
  }

  // Generate tokens
  const { token, refreshToken } = generateTokens(user);

  // Update last login (in real app, this would update the database)
  user.lastLoginAt = new Date();

  // Log successful login
  console.log(`[Auth] Successful login for user: ${user.email} (${user.role})`);

  return createApiResponse(
    {
      user,
      token,
      refreshToken,
    },
    'Login successful',
    { 
      loginMethod: 'email',
      userRole: user.role 
    }
  );
});