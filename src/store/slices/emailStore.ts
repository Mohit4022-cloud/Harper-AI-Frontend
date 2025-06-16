import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EmailSettings {
  tone: 'Professional' | 'Consultative' | 'Direct' | 'Friendly' | 'Urgent'
  length: 'short' | 'medium' | 'long'
  subjectStyle: 'question' | 'benefit' | 'company-specific' | 'statistic' | 'personal'
  cta: string
  focusAreas: string[]
  personalizationDepth: number
  includeFeatures: string[]
  customInstructions?: string
}

interface EmailState {
  settings: EmailSettings
  presets: Record<string, EmailSettings>
  updateSettings: (settings: Partial<EmailSettings>) => void
  resetSettings: () => void
  savePreset: (name: string, settings: EmailSettings) => void
  loadPreset: (name: string) => void
}

const defaultSettings: EmailSettings = {
  tone: 'Professional',
  length: 'medium',
  subjectStyle: 'benefit',
  cta: '15-minute call',
  focusAreas: ['pain-points'],
  personalizationDepth: 3,
  includeFeatures: ['company-news', 'industry-insights'],
  customInstructions: ''
}

export const useEmailStore = create<EmailState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      presets: {},
      
      updateSettings: (newSettings) => 
        set(state => ({ 
          settings: { ...state.settings, ...newSettings } 
        })),
      
      resetSettings: () => 
        set({ settings: defaultSettings }),
      
      savePreset: (name, settings) =>
        set(state => ({
          presets: { ...state.presets, [name]: settings }
        })),
      
      loadPreset: (name) => {
        const preset = get().presets[name]
        if (preset) {
          set({ settings: preset })
        }
      }
    }),
    {
      name: 'harper-email-settings'
    }
  )
)