import { NextResponse } from 'next/server';

export interface ApiError {
  success: false;
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
  timestamp?: string;
  path?: string;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
  metadata?: {
    timestamp: string;
    [key: string]: any;
  };
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const ErrorTypes = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export function handleApiError(error: unknown, request?: Request): NextResponse<ApiError> {
  console.error('[API Error]', error);
  
  const timestamp = new Date().toISOString();
  const path = request?.url ? new URL(request.url).pathname : undefined;
  
  // Handle known AppError instances
  if (error instanceof AppError) {
    return NextResponse.json<ApiError>(
      {
        success: false,
        message: error.message,
        statusCode: error.statusCode,
        error: error.name,
        details: error.details,
        timestamp,
        path,
      },
      { status: error.statusCode }
    );
  }
  
  // Handle validation errors
  if (error instanceof Error && error.name === 'ValidationError') {
    return NextResponse.json<ApiError>(
      {
        success: false,
        message: 'Validation failed',
        statusCode: ErrorTypes.VALIDATION_ERROR,
        error: error.name,
        details: error.message,
        timestamp,
        path,
      },
      { status: ErrorTypes.VALIDATION_ERROR }
    );
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    const statusCode = ErrorTypes.INTERNAL_ERROR;
    return NextResponse.json<ApiError>(
      {
        success: false,
        message: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : error.message,
        statusCode,
        error: error.name,
        timestamp,
        path,
      },
      { status: statusCode }
    );
  }
  
  // Handle unknown errors
  return NextResponse.json<ApiError>(
    {
      success: false,
      message: 'An unexpected error occurred',
      statusCode: ErrorTypes.INTERNAL_ERROR,
      error: 'UnknownError',
      timestamp,
      path,
    },
    { status: ErrorTypes.INTERNAL_ERROR }
  );
}

export function createApiResponse<T>(
  data: T,
  message?: string,
  metadata?: Record<string, any>
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json<ApiSuccess<T>>({
    success: true,
    data,
    message,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  });
}

// Wrapper for API route handlers with error handling
export function withErrorHandler<T = any>(
  handler: (request: Request, context?: any) => Promise<NextResponse<ApiSuccess<T>>>
) {
  return async (request: Request, context?: any): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error, request);
    }
  };
}

// Utility function to simulate delays for mock APIs
export async function simulateDelay(ms: number = 500): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Utility function to simulate random errors
export function simulateRandomError(errorRate: number = 0.1): void {
  if (Math.random() < errorRate) {
    throw new AppError(
      'Simulated error for testing',
      ErrorTypes.SERVICE_UNAVAILABLE,
      { simulated: true, errorRate }
    );
  }
}