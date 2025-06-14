/**
 * API Client Helper
 * Provides a centralized way to make API calls with proper error handling
 * and automatic URL resolution for both client and server contexts
 */

import { logger } from './logger'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: string
}

export interface ApiError extends Error {
  status?: number
  details?: string
}

/**
 * Get the base URL for API calls
 * - On client: Use relative paths (empty string)
 * - On server: Use NEXT_PUBLIC_API_URL if set, otherwise empty
 */
function getApiBaseUrl(): string {
  // Client-side: always use relative paths
  if (typeof window !== 'undefined') {
    return ''
  }
  
  // Server-side: use env var if explicitly set, otherwise relative
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (baseUrl) {
    // Remove trailing slash if present
    return baseUrl.replace(/\/$/, '')
  }
  
  return ''
}

/**
 * Make a typed API request with error handling
 * @param endpoint - API endpoint (e.g., '/api/call/start')
 * @param options - Fetch options
 * @returns Typed response data
 * @throws ApiError with status and details
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint}`
  
  try {
    // Add default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    
    // Log the request (client-side only in dev)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${options.method || 'GET'} ${url}`)
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    })
    
    // Parse response
    const contentType = response.headers.get('content-type')
    let data: any
    
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }
    
    // Handle non-2xx responses
    if (!response.ok) {
      const error = new Error(
        data?.error || `API request failed: ${response.statusText}`
      ) as ApiError
      error.status = response.status
      error.details = data?.details || data
      
      // Log error (client-side only in dev)
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.error(`API Error: ${error.message}`, error)
      }
      
      throw error
    }
    
    // Return data directly if it's already the expected format
    // Otherwise wrap in success response
    if (data && typeof data === 'object' && 'success' in data) {
      if (!data.success) {
        throw new Error(data.error || 'Request failed')
      }
      return data.data || data
    }
    
    return data
  } catch (error) {
    // Network or parsing errors
    if (error instanceof Error) {
      // Re-throw ApiError as-is
      if ('status' in error) {
        throw error
      }
      
      // Convert to ApiError
      const apiError = new Error(
        error.message || 'Network request failed'
      ) as ApiError
      apiError.status = 0 // Network error
      apiError.details = error.message
      throw apiError
    }
    
    // Unknown error
    throw new Error('An unexpected error occurred')
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  /**
   * GET request
   */
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  
  /**
   * POST request
   */
  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  /**
   * PUT request
   */
  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  /**
   * DELETE request
   */
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}