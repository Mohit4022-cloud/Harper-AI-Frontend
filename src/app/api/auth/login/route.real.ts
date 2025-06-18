import { NextRequest } from 'next/server';
import { userDb } from '@/lib/db/auth';
import { comparePassword } from '@/lib/auth/bcrypt';
import { generateTokens } from '@/lib/jwt';
import { 
  withErrorHandler, 
  AppError, 
  ErrorTypes, 
  createApiResponse,
  simulateDelay 
} from '@/lib/errorHandler';

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

  try {
    // Find user in database
    const user = await userDb.findByEmail(email);
    
    // Check if user exists
    if (!user) {
      throw new AppError(
        'Invalid email or password',
        ErrorTypes.UNAUTHORIZED
      );
    }

    // Compare passwords
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
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

    // Update last login
    await userDb.updateLastLogin(user.id);

    // Generate tokens
    const { token, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Log successful login
    console.log(`[Auth] Successful login for user: ${user.email} (${user.role})`);

    return createApiResponse(
      {
        user: userWithoutPassword,
        token,
        refreshToken,
      },
      'Login successful',
      { 
        loginMethod: 'email',
        userRole: user.role 
      }
    );
  } catch (error) {
    // Log error for debugging
    console.error('[Auth] Login error:', error);
    
    // Re-throw AppErrors, wrap others
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      'An error occurred during login',
      ErrorTypes.INTERNAL_ERROR
    );
  }
});