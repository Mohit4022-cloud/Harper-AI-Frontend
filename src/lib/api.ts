// Shared API configuration utilities
import axios from 'axios'

/**
 * Get the API base URL for the current environment
 * - Production: Uses NEXT_PUBLIC_API_URL environment variable
 * - Development: Uses window.location.origin or localhost fallback
 */
export const getApiBaseUrl = (): string => {
  // Client-side: Always use current domain to avoid CORS issues
  if (typeof window !== 'undefined') {
    console.log('🔗 Using window.location.origin:', window.location.origin)
    return window.location.origin
  }

  // Server-side: Use env variable if available (production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('🔗 Using NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    return process.env.NEXT_PUBLIC_API_URL
  }

  // Default server-side fallback
  console.log('🔗 Using localhost fallback')
  return 'http://localhost:3000'
}

/**
 * Create an axios instance with environment-aware base URL
 */
export const createApiClient = (endpoint: string) => {
  const baseURL = `${getApiBaseUrl()}/api/${endpoint}`
  
  // Log the API URL in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔗 API Client created for: ${baseURL}`)
  }
  
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
  })
}

/**
 * Add authentication token to requests
 */
export const addAuthInterceptor = (client: any) => {
  client.interceptors.request.use(
    (config: any) => {
      // Get token from localStorage or auth store
      const token = localStorage.getItem('auth-storage')
      if (token) {
        try {
          const parsed = JSON.parse(token)
          if (parsed.state?.token) {
            config.headers.Authorization = `Bearer ${parsed.state.token}`
          }
        } catch (error) {
          console.error('Error parsing auth token:', error)
        }
      }
      return config
    },
    (error: any) => {
      return Promise.reject(error)
    }
  )
}

/**
 * Handle common API response patterns
 */
export const addResponseInterceptor = (client: any) => {
  client.interceptors.response.use(
    (response: any) => {
      // If the API returns a structured response with success/data, extract the data
      if (response.data && response.data.success) {
        return { ...response, data: response.data.data }
      }
      return response
    },
    (error: any) => {
      // Handle API errors
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  )
}