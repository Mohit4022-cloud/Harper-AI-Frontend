import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import { logger } from './logger'
import { performanceMonitor } from './performance'

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: Record<string, any>
}

export interface ApiResponse<T = any> {
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
    pages?: number
  }
}

class ApiClient {
  private client: AxiosInstance
  private requestIdCounter = 0

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api'
    
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const requestId = `req_${Date.now()}_${++this.requestIdCounter}`
        config.headers['X-Request-ID'] = requestId
        
        // Add auth token if available
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Performance tracking
        config.metadata = {
          startTime: Date.now(),
          requestId,
        }

        logger.debug('API Request', {
          method: config.method,
          url: config.url,
          requestId,
        })

        return config
      },
      (error) => {
        logger.error('API Request Error', { error })
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - (response.config.metadata?.startTime || Date.now())
        const requestId = response.config.headers['X-Request-ID']

        logger.debug('API Response', {
          method: response.config.method,
          url: response.config.url,
          status: response.status,
          duration,
          requestId,
        })

        // Track API performance
        if (response.config.url) {
          performanceMonitor.measure(
            `api_${response.config.method}_${response.config.url}`,
            'navigation'
          )
        }

        return response.data
      },
      async (error: AxiosError<ApiError>) => {
        const duration = Date.now() - (error.config?.metadata?.startTime || Date.now())
        const requestId = error.config?.headers?.['X-Request-ID']

        // Enhanced error logging
        logger.error('API Response Error', {
          method: error.config?.method,
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          duration,
          requestId,
          response: error.response?.data,
        })

        // Handle token refresh
        if (error.response?.status === 401 && error.config && !error.config._retry) {
          error.config._retry = true
          
          try {
            await this.refreshToken()
            const token = this.getAuthToken()
            if (token) {
              error.config.headers.Authorization = `Bearer ${token}`
            }
            return this.client(error.config)
          } catch (refreshError) {
            // Redirect to login
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            return Promise.reject(refreshError)
          }
        }

        // Format error for consistency
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'An error occurred',
          code: error.response?.data?.code || error.code,
          status: error.response?.status,
          details: error.response?.data?.details,
        }

        return Promise.reject(apiError)
      }
    )
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) throw new Error('No refresh token')

    const response = await this.post<{ token: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken }
    )

    localStorage.setItem('auth_token', response.data.token)
    localStorage.setItem('refresh_token', response.data.refreshToken)
  }

  // HTTP methods with improved typing
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.get(url, config)
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.post(url, data, config)
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.put(url, data, config)
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.patch(url, data, config)
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.delete(url, config)
  }

  // File upload with progress
  async uploadFile(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse> {
    const formData = new FormData()
    formData.append('file', file)

    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  }

  // Batch requests
  async batch<T = any>(requests: Array<() => Promise<any>>): Promise<T[]> {
    return Promise.all(requests.map(request => request()))
  }

  // Cancel request
  createCancelToken() {
    return axios.CancelToken.source()
  }

  isCancel(error: any): boolean {
    return axios.isCancel(error)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export types
export type { AxiosRequestConfig }

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime: number
      requestId: string
    }
    _retry?: boolean
  }
}