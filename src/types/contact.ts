import { z } from 'zod'

export const ContactSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+\d{10,15}$/, 'Phone must be in format +1234567890'),
  company: z.string().optional(),
  title: z.string().optional(),
  industry: z.string().optional(),
  leadScore: z.number().min(0).max(100).optional(),
  status: z.enum(['active', 'inactive', 'prospect', 'customer', 'churned']).optional(),
  tags: z.array(z.string()).optional(),
  followUpDate: z.string().optional(),
  lastContactedAt: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Contact = z.infer<typeof ContactSchema>

export const CreateContactSchema = ContactSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
})

export type CreateContact = z.infer<typeof CreateContactSchema>

export const UpdateContactSchema = ContactSchema.partial().required({ id: true })

export type UpdateContact = z.infer<typeof UpdateContactSchema>