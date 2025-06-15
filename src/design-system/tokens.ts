export const tokens = {
  colors: {
    // Semantic colors with dark mode support
    background: {
      primary: 'hsl(var(--background-primary))',
      secondary: 'hsl(var(--background-secondary))',
      tertiary: 'hsl(var(--background-tertiary))',
      accent: 'hsl(var(--background-accent))',
      muted: 'hsl(var(--background-muted))',
    },
    foreground: {
      primary: 'hsl(var(--foreground-primary))',
      secondary: 'hsl(var(--foreground-secondary))',
      muted: 'hsl(var(--foreground-muted))',
      accent: 'hsl(var(--foreground-accent))',
    },
    accent: {
      primary: 'hsl(var(--accent-primary))',
      secondary: 'hsl(var(--accent-secondary))',
      success: 'hsl(var(--accent-success))',
      warning: 'hsl(var(--accent-warning))',
      error: 'hsl(var(--accent-error))',
      info: 'hsl(var(--accent-info))',
    },
    border: {
      primary: 'hsl(var(--border-primary))',
      secondary: 'hsl(var(--border-secondary))',
      accent: 'hsl(var(--border-accent))',
    },
  },
  typography: {
    fonts: {
      sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
      mono: ['var(--font-geist-mono)', 'Menlo', 'Monaco', 'monospace'],
      heading: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
    },
    sizes: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
    },
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeights: {
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
    '5xl': '8rem',   // 128px
  },
  animation: {
    duration: {
      fast: '100ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
      slowest: '700ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      inOut: 'cubic-bezier(0.4, 0, 0.6, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
  radius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
} as const

export type DesignTokens = typeof tokens