'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, addMinutes } from 'date-fns'
import { CalendarEvent, CalendarEventSchema, CalendarEventType, DEFAULT_EVENT_DURATIONS } from '@/types/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { useContactsStore } from '@/stores/contactsStore'
import { z } from 'zod'

// Form schema (without id and timestamps)
const EventFormSchema = CalendarEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

type EventFormData = z.infer<typeof EventFormSchema>

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (event: EventFormData) => Promise<void>
  event?: CalendarEvent | null
  defaultDate?: Date
}

export function EventDialog({
  open,
  onOpenChange,
  onSave,
  event,
  defaultDate,
}: EventDialogProps) {
  const { toast } = useToast()
  const { contacts, loadContacts } = useContactsStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch contacts when dialog opens
  useEffect(() => {
    if (open && contacts.length === 0) {
      loadContacts()
    }
  }, [open, contacts.length, loadContacts])

  const form = useForm<EventFormData>({
    resolver: zodResolver(EventFormSchema),
    defaultValues: event || {
      title: '',
      description: '',
      type: 'call',
      startTime: defaultDate?.toISOString() || new Date().toISOString(),
      endTime: addMinutes(defaultDate || new Date(), DEFAULT_EVENT_DURATIONS.call).toISOString(),
      contactId: '',
      contactName: '',
      contactPhone: '',
      location: '',
      isCompleted: false,
      notes: '',
    },
  })

  // Update form when event changes
  useEffect(() => {
    if (event) {
      form.reset(event)
    } else if (defaultDate) {
      form.reset({
        title: '',
        description: '',
        type: 'call',
        startTime: defaultDate.toISOString(),
        endTime: addMinutes(defaultDate, DEFAULT_EVENT_DURATIONS.call).toISOString(),
        contactId: '',
        contactName: '',
        contactPhone: '',
        location: '',
        isCompleted: false,
        notes: '',
      })
    }
  }, [event, defaultDate, form])

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true)

    try {
      await onSave(data)
      toast({
        title: event ? 'Event updated' : 'Event created',
        description: `${data.title} has been ${event ? 'updated' : 'added'} to your calendar.`,
      })
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save event:', error)
      toast({
        title: 'Failed to save event',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTypeChange = (type: CalendarEventType) => {
    const currentStart = new Date(form.getValues('startTime'))
    const duration = DEFAULT_EVENT_DURATIONS[type]
    const newEnd = addMinutes(currentStart, duration)
    
    form.setValue('type', type)
    form.setValue('endTime', newEnd.toISOString())
  }

  const handleContactChange = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId)
    if (contact) {
      form.setValue('contactId', contactId)
      form.setValue('contactName', contact.name)
      form.setValue('contactPhone', contact.phone || '')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'New Event'}</DialogTitle>
          <DialogDescription>
            {event ? 'Update the event details below.' : 'Fill in the details for your new event.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Sales call with John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type and Contact */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={handleTypeChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={handleContactChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a contact" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No contact</SelectItem>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id!}>
                            {contact.name} - {contact.company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={format(new Date(field.value), "yyyy-MM-dd'T'HH:mm")}
                        onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={format(new Date(field.value), "yyyy-MM-dd'T'HH:mm")}
                        onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a description..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location (for meetings) */}
            {form.watch('type') === 'meeting' && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Office, Zoom link, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{event ? 'Update' : 'Create'} Event</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}