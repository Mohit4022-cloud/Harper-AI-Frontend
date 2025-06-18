import { NextRequest } from 'next/server'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { generateTokens } from '@/lib/jwt'
import { 
  withErrorHandler, 
  AppError, 
  ErrorTypes, 
  createApiResponse,
  simulateDelay 
} from '@/lib/errorHandler'
import { createUser, findUserByEmail } from '@/lib/mockData'

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organizationId: z.string().optional(),
  phone: z.string().optional(),
})

export const POST = withErrorHandler(async (request: Request) => {
  // Simulate network delay in development
  await simulateDelay(300);
  
  const body = await request.json();
  
  // Validate input
  const validationResult = registerSchema.safeParse(body);
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

  const { email, password, name, organizationId, phone } = validationResult.data;

  // Check if user already exists
  const existingUser = findUserByEmail(email);
  if (existingUser) {
    throw new AppError(
      'User with this email already exists',
      ErrorTypes.CONFLICT,
      { email }
    );
  }

  // In a real app, we'd hash the password properly
  // For mock purposes, we'll just create the user
  const newUser = createUser({
    email,
    name,
    role: 'SDR', // Default role for new registrations
    organizationId: organizationId || 'default-org',
    phone,
  });

  // Generate tokens
  const { token, refreshToken } = generateTokens(newUser);

  // Log successful registration
  console.log(`[Auth] New user registered: ${newUser.email} (${newUser.role})`);

  return createApiResponse(
    {
      user: newUser,
      token,
      refreshToken,
    },
    'Registration successful',
    { 
      registrationMethod: 'email',
      userRole: newUser.role 
    }
  );
});