/**
 * Theme utility helpers for consistent dark mode implementation
 */

// Common dark mode class patterns
export const themeClasses = {
  // Backgrounds
  bgPrimary: 'bg-white dark:bg-gray-900',
  bgSecondary: 'bg-gray-50 dark:bg-gray-800',
  bgTertiary: 'bg-gray-100 dark:bg-gray-700',
  bgCard: 'bg-white dark:bg-gray-900',
  bgMuted: 'bg-gray-50 dark:bg-gray-800/50',
  
  // Borders
  border: 'border-gray-200 dark:border-gray-700',
  borderLight: 'border-gray-100 dark:border-gray-800',
  borderDark: 'border-gray-300 dark:border-gray-600',
  
  // Text
  textPrimary: 'text-gray-900 dark:text-gray-100',
  textSecondary: 'text-gray-600 dark:text-gray-400',
  textMuted: 'text-gray-500 dark:text-gray-500',
  textInverse: 'text-white dark:text-gray-900',
  
  // Hover states
  hoverBg: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  hoverBgMuted: 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
  hoverText: 'hover:text-gray-900 dark:hover:text-gray-100',
  
  // Interactive elements
  interactive: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800',
  
  // Status colors
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
} as const

/**
 * Helper to combine theme classes with custom classes
 * Usage: themeClass('bgPrimary', 'p-4 rounded-lg')
 */
export function themeClass(themeKey: keyof typeof themeClasses | string, ...customClasses: string[]): string {
  const baseClass = typeof themeKey === 'string' && themeKey in themeClasses 
    ? themeClasses[themeKey as keyof typeof themeClasses]
    : themeKey
  
  return [baseClass, ...customClasses].filter(Boolean).join(' ')
}

/**
 * Get status theme classes
 * Usage: getStatusTheme('success')
 */
export function getStatusTheme(status: 'success' | 'error' | 'warning' | 'info') {
  return themeClasses[status]
}