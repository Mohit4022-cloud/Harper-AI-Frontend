'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { initializeTheme, settings } = useSettingsStore()

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  // Listen for system theme changes when theme is set to 'system'
  useEffect(() => {
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(e.matches ? 'dark' : 'light')
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [settings.theme])

  return <>{children}</>
}