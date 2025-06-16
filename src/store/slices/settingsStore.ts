import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserSettings, UserSettingsSchema, defaultUserSettings } from '@/types/settings'
import { api } from '@/lib/api-client'

interface SettingsState {
  settings: UserSettings
  loading: boolean
  error: string | null
  
  // Actions
  fetchSettings: () => Promise<void>
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>
  resetSettings: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  initializeTheme: () => void
}

/**
 * Settings store for managing user preferences
 * Persists in-memory for the session via API
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultUserSettings,
      loading: false,
      error: null,

      /**
       * Fetch settings (prioritize localStorage)
       */
      fetchSettings: async () => {
        set({ loading: true, error: null })
        
        try {
          // First check if we have settings in the current state (from localStorage)
          const currentSettings = get().settings
          if (currentSettings && Object.keys(currentSettings.integrations).some(key => currentSettings.integrations[key as keyof typeof currentSettings.integrations])) {
            // We have settings in localStorage, use those
            set({ loading: false })
            return
          }

          // Otherwise try to fetch from API
          try {
            const response = await api.get<{ success: boolean; data: UserSettings; error?: string }>('/api/settings')
            
            if (response && response.data) {
              // Validate settings with schema
              const validatedSettings = UserSettingsSchema.parse(response.data)
              set({ settings: validatedSettings, loading: false })
            } else {
              throw new Error('Failed to fetch settings')
            }
          } catch (apiError) {
            // API failed, but that's okay - use default settings
            console.warn('Failed to fetch settings from API, using defaults:', apiError)
            set({ loading: false })
          }
        } catch (error) {
          console.error('Error in fetchSettings:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch settings',
            loading: false 
          })
        }
      },

      /**
       * Update settings (client-side only for better persistence)
       */
      updateSettings: async (updates: Partial<UserSettings>) => {
        set({ loading: true, error: null })
        
        try {
          // Merge updates with current settings
          const updatedSettings = {
            ...get().settings,
            ...updates,
            // Deep merge for nested objects
            profile: {
              ...get().settings.profile,
              ...(updates.profile || {}),
            },
            notifications: {
              ...get().settings.notifications,
              ...(updates.notifications || {}),
            },
            integrations: {
              ...get().settings.integrations,
              ...(updates.integrations || {}),
            },
          }
          
          // Validate updated settings
          const validatedSettings = UserSettingsSchema.parse(updatedSettings)
          
          // Save to localStorage immediately
          set({ settings: validatedSettings, loading: false })
          
          // Optionally try to sync with server (but don't fail if it doesn't work)
          try {
            await api.put('/api/settings', validatedSettings)
          } catch (apiError) {
            console.warn('Failed to sync settings with server, but local save succeeded:', apiError)
          }
        } catch (error) {
          console.error('Error updating settings:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update settings',
            loading: false 
          })
          throw error // Re-throw for UI handling
        }
      },

      /**
       * Reset settings to defaults
       */
      resetSettings: () => {
        set({ settings: defaultUserSettings, error: null })
      },

      /**
       * Set theme immediately and persist to localStorage
       */
      setTheme: (theme: 'light' | 'dark' | 'system') => {
        // Update store
        set((state) => ({
          settings: {
            ...state.settings,
            theme,
          },
        }))
        
        // Save to localStorage immediately
        localStorage.setItem('harper-theme', theme)
        
        // Apply theme to document
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          root.classList.add(systemTheme)
        } else {
          root.classList.add(theme)
        }
      },

      /**
       * Initialize theme from localStorage or system preference
       */
      initializeTheme: () => {
        // Try to get theme from localStorage
        const savedTheme = localStorage.getItem('harper-theme') as 'light' | 'dark' | 'system' | null
        
        // Determine the theme to use
        const theme = savedTheme || 'system'
        
        // Update store
        set((state) => ({
          settings: {
            ...state.settings,
            theme,
          },
        }))
        
        // Apply theme to document
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          root.classList.add(systemTheme)
          
          // Listen for system theme changes
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handleChange = (e: MediaQueryListEvent) => {
            if (get().settings.theme === 'system') {
              root.classList.remove('light', 'dark')
              root.classList.add(e.matches ? 'dark' : 'light')
            }
          }
          mediaQuery.addEventListener('change', handleChange)
        } else {
          root.classList.add(theme)
        }
      },
    }),
    {
      name: 'user-settings',
      // Persist all settings in localStorage
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)