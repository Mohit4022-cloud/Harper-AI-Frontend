import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, LoginCredentials, AuthResponse } from '@/types'
import { authService } from '@/services/authService'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshAuthToken: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null })
          
          const response: AuthResponse = await authService.login(credentials)
          
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          error: null,
        })
        
        // Clear persisted state
        localStorage.removeItem('auth-storage')
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      },

      refreshAuthToken: async () => {
        try {
          const { refreshToken } = get()
          if (!refreshToken) {
            throw new Error('No refresh token available')
          }

          const response = await authService.refreshToken(refreshToken)
          
          set({
            token: response.token,
            refreshToken: response.refreshToken,
          })
        } catch (error) {
          // If refresh fails, logout user
          get().logout()
          throw error
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({
            user: { ...user, ...userData },
          })
        }
      },

      clearError: () => {
        set({ error: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
)