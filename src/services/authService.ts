import { LoginCredentials, AuthResponse, User } from '@/types'
import { createApiClient, addResponseInterceptor } from '@/lib/api'

// Create auth API client
const authApi = createApiClient('auth')
addResponseInterceptor(authApi)

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await authApi.post<AuthResponse>('/login', credentials)
    return response.data
  },

  async register(userData: {
    email: string
    password: string
    name: string
    organizationId: string
  }): Promise<AuthResponse> {
    const response = await authApi.post<AuthResponse>('/register', userData)
    return response.data
  },

  async refreshToken(refreshToken: string): Promise<{
    token: string
    refreshToken: string
  }> {
    const response = await authApi.post('/refresh', { refreshToken })
    return response.data
  },

  async logout(): Promise<void> {
    await authApi.post('/logout')
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await authApi.post('/forgot-password', { email })
    return response.data
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await authApi.post('/reset-password', { token, password })
    return response.data
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await authApi.post('/verify-email', { token })
    return response.data
  },

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const response = await authApi.put(`/users/${userId}`, data)
    return response.data
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await authApi.post('/change-password', {
      currentPassword,
      newPassword,
    })
    return response.data
  },

  async enable2FA(): Promise<{
    qrCode: string
    backupCodes: string[]
  }> {
    const response = await authApi.post('/2fa/enable')
    return response.data
  },

  async verify2FA(token: string): Promise<{ message: string }> {
    const response = await authApi.post('/2fa/verify', { token })
    return response.data
  },

  async disable2FA(token: string): Promise<{ message: string }> {
    const response = await authApi.post('/2fa/disable', { token })
    return response.data
  },
}