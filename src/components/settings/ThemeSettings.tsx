'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/lib/utils'

export function ThemeSettings() {
  const { toast } = useToast()
  const { settings, setTheme } = useSettingsStore()

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setTheme(theme)
    
    const labels = {
      light: 'Light',
      dark: 'Dark', 
      system: 'System'
    }
    
    toast({
      title: 'Theme updated',
      description: `Theme changed to ${labels[theme]} mode.`,
    })
  }

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light',
      description: 'Classic light theme for day time',
      icon: Sun,
      preview: 'bg-white border-gray-200 text-gray-900',
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      description: 'Easy on the eyes for night time',
      icon: Moon,
      preview: 'bg-gray-900 border-gray-700 text-gray-100',
    },
    {
      value: 'system' as const,
      label: 'System',
      description: 'Automatically match your system theme',
      icon: Monitor,
      preview: 'bg-gradient-to-r from-white to-gray-900 text-gray-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Choose Theme</h3>
        <RadioGroup value={settings.theme} onValueChange={handleThemeChange}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon
              return (
                <Label
                  key={option.value}
                  htmlFor={option.value}
                  className="cursor-pointer"
                >
                  <Card
                    className={cn(
                      'p-4 hover:border-purple-500 transition-colors',
                      settings.theme === option.value && 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    )}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="sr-only"
                    />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <div
                          className={cn(
                            'h-3 w-3 rounded-full',
                            settings.theme === option.value
                              ? 'bg-purple-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          )}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{option.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
                      </div>
                      {/* Theme Preview */}
                      <div
                        className={cn(
                          'rounded-md p-3 border text-sm font-mono',
                          option.preview
                        )}
                      >
                        <div className="space-y-1">
                          <div className="opacity-70">// Preview</div>
                          <div>Hello World</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Label>
              )
            })}
          </div>
        </RadioGroup>
      </div>

      {/* Additional Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Additional Options</h3>
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">High Contrast</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Increase contrast for better readability
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Custom Colors</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Personalize your color scheme
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Info Message */}
      <div className="text-sm text-gray-600 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          Theme changes are applied immediately and saved automatically.
        </p>
      </div>
    </div>
  )
}