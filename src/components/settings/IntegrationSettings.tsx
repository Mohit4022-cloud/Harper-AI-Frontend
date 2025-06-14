'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Key, Link, Webhook, Save, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { useSettingsStore } from '@/stores/settingsStore'

// Integration form schema
const IntegrationFormSchema = z.object({
  twilioKey: z.string().min(1, 'Twilio API key is required'),
  elevenLabsKey: z.string().min(1, 'Eleven Labs API key is required'),
  webhookUrl: z.string().url('Invalid webhook URL').optional().or(z.literal('')),
})

type IntegrationFormData = z.infer<typeof IntegrationFormSchema>

export function IntegrationSettings() {
  const { toast } = useToast()
  const { settings, updateSettings } = useSettingsStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    twilioKey: false,
    elevenLabsKey: false,
  })

  const form = useForm<IntegrationFormData>({
    resolver: zodResolver(IntegrationFormSchema),
    defaultValues: {
      twilioKey: settings.integrations.twilioKey || '',
      elevenLabsKey: settings.integrations.elevenLabsKey || '',
      webhookUrl: settings.integrations.webhookUrl || '',
    },
  })

  const onSubmit = async (data: IntegrationFormData) => {
    setIsSubmitting(true)

    try {
      await updateSettings({
        integrations: data,
      })

      toast({
        title: 'Integrations updated',
        description: 'Your integration settings have been saved.',
      })
    } catch (error) {
      console.error('Failed to update integrations:', error)
      toast({
        title: 'Update failed',
        description: 'Failed to update integration settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleShowKey = (key: string) => {
    setShowKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Mock connection status - in production, this would check actual connectivity
  const connectionStatus = {
    twilio: settings.integrations.twilioKey ? 'connected' : 'disconnected',
    elevenLabs: settings.integrations.elevenLabsKey ? 'connected' : 'disconnected',
    webhook: settings.integrations.webhookUrl ? 'connected' : 'disconnected',
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Voice Integration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Voice Integration</h3>
          
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Twilio Voice SDK</h4>
                <p className="text-sm text-gray-600">Connect your Twilio account for voice calling</p>
              </div>
              <Badge variant={connectionStatus.twilio === 'connected' ? 'default' : 'secondary'}>
                {connectionStatus.twilio === 'connected' ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </>
                )}
              </Badge>
            </div>

            <FormField
              control={form.control}
              name="twilioKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Key className="h-4 w-4 inline mr-1" />
                    Twilio API Key
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showKeys.twilioKey ? 'text' : 'password'}
                        placeholder="Enter your Twilio API key"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleShowKey('twilioKey')}
                      >
                        {showKeys.twilioKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Get your API key from the Twilio Console
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Eleven Labs AI Voice</h4>
                <p className="text-sm text-gray-600">AI-powered voice synthesis for natural conversations</p>
              </div>
              <Badge variant={connectionStatus.elevenLabs === 'connected' ? 'default' : 'secondary'}>
                {connectionStatus.elevenLabs === 'connected' ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </>
                )}
              </Badge>
            </div>

            <FormField
              control={form.control}
              name="elevenLabsKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Key className="h-4 w-4 inline mr-1" />
                    Eleven Labs API Key
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showKeys.elevenLabsKey ? 'text' : 'password'}
                        placeholder="Enter your Eleven Labs API key"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleShowKey('elevenLabsKey')}
                      >
                        {showKeys.elevenLabsKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Get your API key from your Eleven Labs dashboard
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>
        </div>

        <Separator />

        {/* Webhook Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Webhook Configuration</h3>
          
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Event Webhook</h4>
                <p className="text-sm text-gray-600">Receive real-time updates for call events</p>
              </div>
              <Badge variant={connectionStatus.webhook === 'connected' ? 'default' : 'secondary'}>
                {connectionStatus.webhook === 'connected' ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configured
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Configured
                  </>
                )}
              </Badge>
            </div>

            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Webhook className="h-4 w-4 inline mr-1" />
                    Webhook URL
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://your-domain.com/webhook"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: URL to receive call events and transcripts
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>
        </div>

        {/* Additional Integrations Coming Soon */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Coming Soon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 opacity-60">
              <h4 className="font-medium mb-2">Salesforce CRM</h4>
              <p className="text-sm text-gray-600">Sync contacts and activities</p>
              <Button variant="outline" size="sm" className="mt-3" disabled>
                Coming Soon
              </Button>
            </Card>
            <Card className="p-4 opacity-60">
              <h4 className="font-medium mb-2">HubSpot CRM</h4>
              <p className="text-sm text-gray-600">Two-way contact synchronization</p>
              <Button variant="outline" size="sm" className="mt-3" disabled>
                Coming Soon
              </Button>
            </Card>
            <Card className="p-4 opacity-60">
              <h4 className="font-medium mb-2">Slack</h4>
              <p className="text-sm text-gray-600">Real-time notifications and updates</p>
              <Button variant="outline" size="sm" className="mt-3" disabled>
                Coming Soon
              </Button>
            </Card>
            <Card className="p-4 opacity-60">
              <h4 className="font-medium mb-2">Zapier</h4>
              <p className="text-sm text-gray-600">Connect with 5000+ apps</p>
              <Button variant="outline" size="sm" className="mt-3" disabled>
                Coming Soon
              </Button>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Integrations
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}