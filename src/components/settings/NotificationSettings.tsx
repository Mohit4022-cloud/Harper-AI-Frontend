'use client'

import { useState } from 'react'
import { Loader2, Bell, Mail, Calendar, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { useSettingsStore } from '@/stores/settingsStore'

export function NotificationSettings() {
  const { toast } = useToast()
  const { settings, updateSettings } = useSettingsStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings.notifications)

  const handleToggle = (key: keyof typeof settings.notifications) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = async () => {
    setIsSubmitting(true)

    try {
      await updateSettings({
        notifications: localSettings,
      })

      toast({
        title: 'Notifications updated',
        description: 'Your notification preferences have been saved.',
      })
    } catch (error) {
      console.error('Failed to update notifications:', error)
      toast({
        title: 'Update failed',
        description: 'Failed to update notification settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const notificationOptions = [
    {
      key: 'callTranscripts' as const,
      icon: Bell,
      title: 'Call Transcripts',
      description: 'Receive notifications when call transcripts are ready',
    },
    {
      key: 'emailCampaigns' as const,
      icon: Mail,
      title: 'Email Campaigns',
      description: 'Get updates on email campaign performance and responses',
    },
    {
      key: 'followUpReminders' as const,
      icon: Calendar,
      title: 'Follow-up Reminders',
      description: 'Receive reminders for scheduled follow-ups and meetings',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {notificationOptions.map((option) => {
          const Icon = option.icon
          return (
            <Card key={option.key} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <Icon className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{option.title}</p>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
                <Switch
                  checked={localSettings[option.key]}
                  onCheckedChange={() => handleToggle(option.key)}
                />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Email Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Email Preferences</h3>
        <Card className="p-4">
          <CardHeader className="p-0">
            <CardTitle className="text-base">Notification Frequency</CardTitle>
            <CardDescription className="text-sm mt-1">
              Choose how often you want to receive email notifications
            </CardDescription>
          </CardHeader>
          <div className="mt-4 space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="frequency"
                value="instant"
                defaultChecked
                className="text-purple-600"
              />
              <span className="text-sm">Instant notifications</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="frequency"
                value="daily"
                className="text-purple-600"
              />
              <span className="text-sm">Daily digest</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="frequency"
                value="weekly"
                className="text-purple-600"
              />
              <span className="text-sm">Weekly summary</span>
            </label>
          </div>
        </Card>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  )
}