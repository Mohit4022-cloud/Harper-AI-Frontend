import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserSettings, UserSettingsSchema, defaultUserSettings } from '@/types/settings'

interface SettingsState {
  settings: UserSettings
  loading: boolean
  error: string | null
  
  // Actions
  fetchSettings: () => Promise<void>
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>
  resetSettings: () => void
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
       * Fetch settings from API
       */
      fetchSettings: async () => {
        set({ loading: true, error: null })
        
        try {
          const response = await fetch('/api/settings')
          
          if (!response.ok) {
            throw new Error('Failed to fetch settings')
          }
          
          const data = await response.json()
          
          if (data.success) {
            // Validate settings with schema
            const validatedSettings = UserSettingsSchema.parse(data.data)
            set({ settings: validatedSettings, loading: false })
          } else {
            throw new Error(data.error || 'Failed to fetch settings')
          }
        } catch (error) {
          console.error('Error fetching settings:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch settings',
            loading: false 
          })
        }
      },

      /**
       * Update settings via API
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
          
          const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(validatedSettings),
          })
          
          if (!response.ok) {
            throw new Error('Failed to update settings')
          }
          
          const data = await response.json()
          
          if (data.success) {
            set({ settings: validatedSettings, loading: false })
          } else {
            throw new Error(data.error || 'Failed to update settings')
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
    }),
    {
      name: 'user-settings',
      // Only persist theme preference in localStorage
      partialize: (state) => ({ theme: state.settings.theme }),
    }
  )
)