'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Loader2, 
  Key, 
  Phone, 
  Globe, 
  Webhook, 
  Save, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  Volume2,
  Link2,
  TestTube,
  RefreshCw
} from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/lib/api-client'

// Integration form schema
const IntegrationFormSchema = z.object({
  // Twilio
  twilioAccountSid: z.string().optional().refine(
    (val) => !val || (val.length >= 34 && val.startsWith('AC')),
    'Invalid Account SID - must start with AC'
  ),
  twilioAuthToken: z.string().optional().refine(
    (val) => !val || val.length >= 32,
    'Invalid Auth Token - must be at least 32 characters'
  ),
  twilioCallerNumber: z.string().optional().refine(
    (val) => !val || /^\+[1-9]\d{1,14}$/.test(val),
    'Must be E.164 format (+1234567890)'
  ),
  
  // ElevenLabs
  elevenLabsKey: z.string().optional(),
  elevenLabsVoiceId: z.string().optional(),
  elevenLabsAgentId: z.string().optional(),
  elevenLabsAudioUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  
  // General
  webhookUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  baseUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type IntegrationFormData = z.infer<typeof IntegrationFormSchema>

export function IntegrationSettings() {
  const { toast } = useToast()
  const { settings, updateSettings, fetchSettings } = useSettingsStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    twilioAuthToken: false,
    elevenLabsKey: false,
  })

  // Load settings on mount
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const form = useForm<IntegrationFormData>({
    resolver: zodResolver(IntegrationFormSchema),
    defaultValues: {
      twilioAccountSid: settings.integrations.twilioAccountSid || '',
      twilioAuthToken: settings.integrations.twilioAuthToken || '',
      twilioCallerNumber: settings.integrations.twilioCallerNumber || '',
      elevenLabsKey: settings.integrations.elevenLabsKey || '',
      elevenLabsVoiceId: settings.integrations.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM',
      elevenLabsAgentId: settings.integrations.elevenLabsAgentId || '',
      elevenLabsAudioUrl: settings.integrations.elevenLabsAudioUrl || '',
      webhookUrl: settings.integrations.webhookUrl || '',
      baseUrl: settings.integrations.baseUrl || process.env.NEXT_PUBLIC_API_URL || '',
    },
  })

  // Update form when settings change
  useEffect(() => {
    form.reset({
      twilioAccountSid: settings.integrations.twilioAccountSid || '',
      twilioAuthToken: settings.integrations.twilioAuthToken || '',
      twilioCallerNumber: settings.integrations.twilioCallerNumber || '',
      elevenLabsKey: settings.integrations.elevenLabsKey || '',
      elevenLabsVoiceId: settings.integrations.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM',
      elevenLabsAgentId: settings.integrations.elevenLabsAgentId || '',
      elevenLabsAudioUrl: settings.integrations.elevenLabsAudioUrl || '',
      webhookUrl: settings.integrations.webhookUrl || '',
      baseUrl: settings.integrations.baseUrl || process.env.NEXT_PUBLIC_API_URL || '',
    })
  }, [settings, form])

  const onSubmit = async (data: IntegrationFormData) => {
    console.log('Submitting integration settings:', data)
    setIsSubmitting(true)

    try {
      // Log the data being saved
      console.log('Updating settings with:', {
        integrations: {
          ...settings.integrations,
          ...data,
        },
      })

      await updateSettings({
        integrations: {
          ...settings.integrations,
          ...data,
        },
      })

      toast({
        title: 'Integrations updated',
        description: 'Your integration settings have been saved and are ready to use.',
      })
      
      // Log success
      console.log('Settings saved successfully')
    } catch (error) {
      console.error('Failed to update integrations:', error)
      
      // More detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      toast({
        title: 'Update failed',
        description: `Failed to save settings: ${errorMessage}`,
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

  const testConnection = async (service: 'twilio' | 'elevenlabs') => {
    setIsTesting(true)
    
    try {
      const endpoint = service === 'twilio' ? '/api/test/twilio' : '/api/test/elevenlabs'
      const result = await api.post(endpoint, form.getValues())
      
      if (result.success) {
        toast({
          title: `${service === 'twilio' ? 'Twilio' : 'ElevenLabs'} connected!`,
          description: result.message || 'Connection test successful.',
        })
      } else {
        throw new Error(result.error || 'Connection failed')
      }
    } catch (error: any) {
      toast({
        title: 'Connection failed',
        description: error.message || 'Unable to connect to service. Please check your credentials.',
        variant: 'destructive',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const isConfigured = {
    twilio: !!(settings.integrations.twilioAccountSid && settings.integrations.twilioAuthToken && settings.integrations.twilioCallerNumber),
    elevenLabs: !!(settings.integrations.elevenLabsKey && settings.integrations.elevenLabsVoiceId && settings.integrations.elevenLabsAgentId),
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="twilio" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="twilio" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Twilio Voice
            </TabsTrigger>
            <TabsTrigger value="elevenlabs" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              ElevenLabs AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="twilio" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Twilio Configuration
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect your Twilio account for voice calling capabilities
                  </p>
                </div>
                <Badge variant={isConfigured.twilio ? 'default' : 'secondary'}>
                  {isConfigured.twilio ? (
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

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="twilioAccountSid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account SID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="AC..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Found in your Twilio Console dashboard
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twilioAuthToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auth Token</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showKeys.twilioAuthToken ? 'text' : 'password'}
                            placeholder="Enter your Auth Token"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => toggleShowKey('twilioAuthToken')}
                          >
                            {showKeys.twilioAuthToken ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Keep this secret - it provides full access to your account
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twilioCallerNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+14155551234"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Your Twilio phone number in E.164 format
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://harper-ai-frontend.onrender.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Your deployment URL for webhook callbacks
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isConfigured.twilio && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p>Twilio is configured! Your webhook URLs:</p>
                        <code className="block text-xs bg-muted p-2 rounded">
                          Voice: {form.watch('baseUrl')}/api/call/voice<br />
                          Status: {form.watch('baseUrl')}/api/call/status
                        </code>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => testConnection('twilio')}
                    disabled={!isConfigured.twilio || isTesting}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="mr-2 h-4 w-4" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="elevenlabs" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    ElevenLabs Configuration
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI-powered voice synthesis for natural conversations
                  </p>
                </div>
                <Badge variant={isConfigured.elevenLabs ? 'default' : 'secondary'}>
                  {isConfigured.elevenLabs ? (
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

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="elevenLabsKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showKeys.elevenLabsKey ? 'text' : 'password'}
                            placeholder="sk_..."
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
                        Get your API key from the ElevenLabs dashboard
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="elevenLabsVoiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voice ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="21m00Tcm4TlvDq8ikWAM"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Default: Rachel voice. Find more in your ElevenLabs voice library
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="elevenLabsAgentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your ElevenLabs Agent ID"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Your conversational AI agent ID from ElevenLabs
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="elevenLabsAudioUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pre-generated Audio URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://your-site.com/greeting.mp3"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Use a pre-generated MP3 file instead of real-time TTS
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => testConnection('elevenlabs')}
                    disabled={!isConfigured.elevenLabs || isTesting}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="mr-2 h-4 w-4" />
                        Test Voice
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Webhook Configuration */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Advanced Configuration
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Optional webhook for custom integrations
            </p>
          </div>

          <FormField
            control={form.control}
            name="webhookUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Webhook URL</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://your-domain.com/webhook"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Receive real-time call events and transcripts
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchSettings()}
            disabled={isSubmitting}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}