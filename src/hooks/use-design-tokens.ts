import { tokens, type DesignTokens } from '@/design-system/tokens'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function useDesignTokens() {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = currentTheme === 'dark'

  // Helper to get CSS variable value
  const getCSSVariable = (variable: string) => {
    if (!mounted || typeof window === 'undefined') return ''
    return getComputedStyle(document.documentElement).getPropertyValue(variable)
  }

  // Helper to set CSS variable
  const setCSSVariable = (variable: string, value: string) => {
    if (typeof window === 'undefined') return
    document.documentElement.style.setProperty(variable, value)
  }

  // Get token value with dark mode support
  const getToken = <K extends keyof DesignTokens>(
    category: K,
    key: keyof DesignTokens[K]
  ): string => {
    const tokenPath = tokens[category]
    if (!tokenPath || typeof tokenPath !== 'object') return ''
    
    const value = (tokenPath as any)[key]
    return value || ''
  }

  // Semantic color helpers
  const colors = {
    bg: {
      primary: getToken('colors', 'background').primary,
      secondary: getToken('colors', 'background').secondary,
      tertiary: getToken('colors', 'background').tertiary,
      accent: getToken('colors', 'background').accent,
      muted: getToken('colors', 'background').muted,
    },
    fg: {
      primary: getToken('colors', 'foreground').primary,
      secondary: getToken('colors', 'foreground').secondary,
      muted: getToken('colors', 'foreground').muted,
      accent: getToken('colors', 'foreground').accent,
    },
    accent: {
      primary: getToken('colors', 'accent').primary,
      secondary: getToken('colors', 'accent').secondary,
      success: getToken('colors', 'accent').success,
      warning: getToken('colors', 'accent').warning,
      error: getToken('colors', 'accent').error,
      info: getToken('colors', 'accent').info,
    },
    border: {
      primary: getToken('colors', 'border').primary,
      secondary: getToken('colors', 'border').secondary,
      accent: getToken('colors', 'border').accent,
    },
  }

  // Animation helpers
  const animate = {
    duration: (speed: keyof typeof tokens.animation.duration) => 
      tokens.animation.duration[speed],
    easing: (type: keyof typeof tokens.animation.easing) => 
      tokens.animation.easing[type],
    transition: (
      property: string = 'all',
      duration: keyof typeof tokens.animation.duration = 'normal',
      easing: keyof typeof tokens.animation.easing = 'default'
    ) => ({
      transition: `${property} ${tokens.animation.duration[duration]} ${tokens.animation.easing[easing]}`,
    }),
  }

  // Spacing helpers
  const space = (size: keyof typeof tokens.spacing) => tokens.spacing[size]

  // Typography helpers
  const text = {
    size: (size: keyof typeof tokens.typography.sizes) => tokens.typography.sizes[size],
    weight: (weight: keyof typeof tokens.typography.weights) => tokens.typography.weights[weight],
    lineHeight: (height: keyof typeof tokens.typography.lineHeights) => tokens.typography.lineHeights[height],
    font: (font: keyof typeof tokens.typography.fonts) => tokens.typography.fonts[font].join(', '),
  }

  // Shadow helpers
  const shadow = (size: keyof typeof tokens.shadows) => tokens.shadows[size]

  // Radius helpers
  const radius = (size: keyof typeof tokens.radius) => tokens.radius[size]

  return {
    tokens,
    isDark,
    mounted,
    colors,
    animate,
    space,
    text,
    shadow,
    radius,
    getCSSVariable,
    setCSSVariable,
    getToken,
  }
}

// Type-safe token getter for static use
export function getStaticToken<K extends keyof DesignTokens>(
  category: K,
  key: keyof DesignTokens[K]
): string {
  const tokenPath = tokens[category]
  if (!tokenPath || typeof tokenPath !== 'object') return ''
  
  const value = (tokenPath as any)[key]
  return value || ''
}