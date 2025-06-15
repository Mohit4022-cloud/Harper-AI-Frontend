const { tokens } = require('./src/design-system/tokens')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/design-system/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Map design tokens to Tailwind
        'background-primary': 'hsl(var(--background-primary))',
        'background-secondary': 'hsl(var(--background-secondary))',
        'background-tertiary': 'hsl(var(--background-tertiary))',
        'background-accent': 'hsl(var(--background-accent))',
        'background-muted': 'hsl(var(--background-muted))',
        
        'foreground-primary': 'hsl(var(--foreground-primary))',
        'foreground-secondary': 'hsl(var(--foreground-secondary))',
        'foreground-muted': 'hsl(var(--foreground-muted))',
        'foreground-accent': 'hsl(var(--foreground-accent))',
        
        'accent-primary': 'hsl(var(--accent-primary))',
        'accent-secondary': 'hsl(var(--accent-secondary))',
        'accent-success': 'hsl(var(--accent-success))',
        'accent-warning': 'hsl(var(--accent-warning))',
        'accent-error': 'hsl(var(--accent-error))',
        'accent-info': 'hsl(var(--accent-info))',
        
        'border-primary': 'hsl(var(--border-primary))',
        'border-secondary': 'hsl(var(--border-secondary))',
        'border-accent': 'hsl(var(--border-accent))',
        
        // Shadcn/ui compatibility
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: tokens.typography.fonts.sans,
        mono: tokens.typography.fonts.mono,
        heading: tokens.typography.fonts.heading,
      },
      fontSize: Object.entries(tokens.typography.sizes).reduce((acc, [key, value]) => {
        acc[key] = value
        return acc
      }, {}),
      fontWeight: tokens.typography.weights,
      lineHeight: tokens.typography.lineHeights,
      spacing: tokens.spacing,
      boxShadow: tokens.shadows,
      borderRadius: {
        ...tokens.radius,
        DEFAULT: 'var(--radius)',
      },
      transitionDuration: tokens.animation.duration,
      transitionTimingFunction: tokens.animation.easing,
      animation: {
        'fade-in': 'fadeIn var(--animation-duration, 200ms) var(--animation-easing, ease)',
        'slide-in': 'slideIn var(--animation-duration, 200ms) var(--animation-easing, ease)',
        'scale-in': 'scaleIn var(--animation-duration, 200ms) var(--animation-easing, ease)',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}