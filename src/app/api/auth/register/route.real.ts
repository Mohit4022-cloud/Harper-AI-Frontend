import { NextRequest } from 'next/server';
import { userDb } from '@/lib/db/auth';
import { generateTokens } from '@/lib/jwt';
import { 
  withErrorHandler, 
  AppError, 
  ErrorTypes, 
  createApiResponse,
  simulateDelay 
} from '@/lib/errorHandler';
import { validatePasswordStrength } from '@/lib/security/password';

export const POST = withErrorHandler(async (request: Request) => {
  // Simulate network delay in development
  await simulateDelay(300);
  
  const body = await request.json();
  const { email, password, name, organizationName } = body;

  // Validate required fields
  if (!email || !password || !name) {
    throw new AppError(
      'Email, password, and name are required',
      ErrorTypes.VALIDATION_ERROR,
      { 
        missingFields: { 
          email: !email, 
          password: !password, 
          name: !name 
        } 
      }
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

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    throw new AppError(
      'Password does not meet requirements',
      ErrorTypes.VALIDATION_ERROR,
      { 
        field: 'password',
        requirements: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true
        },
        errors: passwordValidation.errors
      }
    );
  }

  try {
    // Check if user already exists
    const existingUser = await userDb.exists(email);
    if (existingUser) {
      throw new AppError(
        'An account with this email already exists',
        ErrorTypes.CONFLICT,
        { field: 'email' }
      );
    }

    // Create user in database
    const user = await userDb.create({
      email,
      password,
      name,
      role: 'user', // Default role
    });

    // Generate tokens
    const { token, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Log successful registration
    console.log(`[Auth] New user registered: ${user.email}`);

    // In a real app, you might want to:
    // 1. Send a welcome email
    // 2. Create default settings
    // 3. Set up organization if provided
    // 4. Track analytics

    return createApiResponse(
      {
        user: userWithoutPassword,
        token,
        refreshToken,
      },
      'Registration successful',
      { 
        registrationMethod: 'email',
        userRole: user.role 
      }
    );
  } catch (error) {
    // Log error for debugging
    console.error('[Auth] Registration error:', error);
    
    // Re-throw AppErrors, wrap others
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      'An error occurred during registration',
      ErrorTypes.INTERNAL_ERROR
    );
  }
});