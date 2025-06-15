'use client'

import { useDesignTokens } from '@/hooks/use-design-tokens'
import { motion } from 'framer-motion'

export function TokenExample() {
  const { colors, animate, space, text, shadow, radius, isDark } = useDesignTokens()

  return (
    <div className="p-8 space-y-8">
      {/* Color Palette */}
      <section>
        <h2 className="text-heading-lg mb-4">Color Palette</h2>
        <div className="grid grid-cols-4 gap-4">
          <ColorSwatch color={colors.bg.primary} label="Background Primary" />
          <ColorSwatch color={colors.fg.primary} label="Foreground Primary" />
          <ColorSwatch color={colors.accent.primary} label="Accent Primary" />
          <ColorSwatch color={colors.border.primary} label="Border Primary" />
        </div>
      </section>

      {/* Typography Scale */}
      <section>
        <h2 className="text-heading-lg mb-4">Typography Scale</h2>
        <div className="space-y-2">
          <p style={{ fontSize: text.size('xs') }}>Extra Small Text (12px)</p>
          <p style={{ fontSize: text.size('sm') }}>Small Text (14px)</p>
          <p style={{ fontSize: text.size('base') }}>Base Text (16px)</p>
          <p style={{ fontSize: text.size('lg') }}>Large Text (18px)</p>
          <p style={{ fontSize: text.size('xl') }}>Extra Large Text (20px)</p>
          <p style={{ fontSize: text.size('2xl'), fontWeight: text.weight('semibold') }}>
            2XL Semibold Text (24px)
          </p>
        </div>
      </section>

      {/* Spacing */}
      <section>
        <h2 className="text-heading-lg mb-4">Spacing System</h2>
        <div className="flex gap-2 items-end">
          <SpacingBox size={space('xs')} label="xs" />
          <SpacingBox size={space('sm')} label="sm" />
          <SpacingBox size={space('md')} label="md" />
          <SpacingBox size={space('lg')} label="lg" />
          <SpacingBox size={space('xl')} label="xl" />
          <SpacingBox size={space('2xl')} label="2xl" />
        </div>
      </section>

      {/* Shadows */}
      <section>
        <h2 className="text-heading-lg mb-4">Shadow Scale</h2>
        <div className="grid grid-cols-3 gap-4">
          <ShadowBox shadow={shadow('sm')} label="Small" />
          <ShadowBox shadow={shadow('md')} label="Medium" />
          <ShadowBox shadow={shadow('lg')} label="Large" />
        </div>
      </section>

      {/* Animation Demo */}
      <section>
        <h2 className="text-heading-lg mb-4">Animation System</h2>
        <div className="flex gap-4">
          <motion.div
            className="p-4 bg-accent-primary text-white rounded-lg"
            whileHover={{ scale: 1.05 }}
            transition={{
              duration: parseFloat(animate.duration('normal')) / 1000,
              ease: animate.easing('spring'),
            }}
          >
            Spring Animation
          </motion.div>
          <motion.div
            className="p-4 bg-accent-info text-white rounded-lg"
            whileHover={{ y: -4 }}
            transition={{
              duration: parseFloat(animate.duration('slow')) / 1000,
              ease: animate.easing('out'),
            }}
          >
            Smooth Lift
          </motion.div>
        </div>
      </section>

      {/* Border Radius */}
      <section>
        <h2 className="text-heading-lg mb-4">Border Radius</h2>
        <div className="flex gap-4">
          <RadiusBox radius={radius('sm')} label="sm" />
          <RadiusBox radius={radius('md')} label="md" />
          <RadiusBox radius={radius('lg')} label="lg" />
          <RadiusBox radius={radius('xl')} label="xl" />
          <RadiusBox radius={radius('full')} label="full" />
        </div>
      </section>
    </div>
  )
}

// Helper Components
function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="text-center">
      <div
        className="h-20 rounded-lg border mb-2"
        style={{ backgroundColor: color }}
      />
      <p className="text-body-sm">{label}</p>
    </div>
  )
}

function SpacingBox({ size, label }: { size: string; label: string }) {
  return (
    <div className="text-center">
      <div
        className="bg-accent-primary"
        style={{ width: size, height: size }}
      />
      <p className="text-caption mt-1">{label}</p>
    </div>
  )
}

function ShadowBox({ shadow, label }: { shadow: string; label: string }) {
  return (
    <div
      className="p-6 bg-white dark:bg-background-secondary rounded-lg text-center"
      style={{ boxShadow: shadow }}
    >
      <p className="text-body-md">{label} Shadow</p>
    </div>
  )
}

function RadiusBox({ radius, label }: { radius: string; label: string }) {
  return (
    <div
      className="w-20 h-20 bg-accent-primary flex items-center justify-center text-white"
      style={{ borderRadius: radius }}
    >
      <span className="text-body-sm">{label}</span>
    </div>
  )
}