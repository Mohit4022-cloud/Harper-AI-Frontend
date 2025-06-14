'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, User, Mail, Lock, Save } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { useSettingsStore } from '@/stores/settingsStore'

// Profile form schema
const ProfileFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword
  }
  return true
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ProfileFormData = z.infer<typeof ProfileFormSchema>

export function ProfileSettings() {
  const { toast } = useToast()
  const { settings, updateSettings } = useSettingsStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      fullName: settings.profile.fullName || '',
      email: settings.profile.email || '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true)

    try {
      // Only include password if it was changed
      const updates = {
        profile: {
          fullName: data.fullName,
          email: data.email,
          ...(data.password ? { password: data.password } : {}),
        },
      }

      await updateSettings(updates)

      toast({
        title: 'Profile updated',
        description: 'Your profile information has been saved.',
      })

      // Clear password fields after successful update
      form.setValue('password', '')
      form.setValue('confirmPassword', '')
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast({
        title: 'Update failed',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
          
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <User className="h-4 w-4 inline mr-1" />
                  Full Name
                </FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormDescription>
                  This email will be used for login and notifications
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Password Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Change Password</h3>
          <p className="text-sm text-gray-600">
            Leave blank to keep your current password
          </p>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Lock className="h-4 w-4 inline mr-1" />
                  New Password
                </FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormDescription>
                  Must be at least 8 characters long
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Lock className="h-4 w-4 inline mr-1" />
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}