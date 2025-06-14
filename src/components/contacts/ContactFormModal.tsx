'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/use-toast'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  title?: string | null
  department?: string | null
  company?: {
    id: string
    name: string
  } | null
  leadStatus: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'WON'
  leadScore: number
  assignedTo?: {
    id: string
    name: string
  } | null
  tags: string[]
  linkedin?: string | null
  twitter?: string | null
}

interface ContactFormModalProps {
  contact: Contact | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ContactFormModal({ 
  contact, 
  isOpen, 
  onClose, 
  onSuccess 
}: ContactFormModalProps) {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    department: '',
    companyName: '',
    leadStatus: 'NEW' as 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'WON',
    leadScore: 50,
    linkedin: '',
    twitter: '',
    tags: '',
  })

  useEffect(() => {
    if (contact) {
      setFormData({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone || '',
        title: contact.title || '',
        department: contact.department || '',
        companyName: contact.company?.name || '',
        leadStatus: contact.leadStatus,
        leadScore: contact.leadScore,
        linkedin: contact.linkedin || '',
        twitter: contact.twitter || '',
        tags: contact.tags.join(', '),
      })
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        title: '',
        department: '',
        companyName: '',
        leadStatus: 'NEW',
        leadScore: 50,
        linkedin: '',
        twitter: '',
        tags: '',
      })
    }
  }, [contact])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        title: formData.title || undefined,
        department: formData.department || undefined,
        leadStatus: formData.leadStatus,
        leadScore: formData.leadScore,
        linkedin: formData.linkedin || undefined,
        twitter: formData.twitter || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }
      
      const url = contact 
        ? `/api/contacts/v2/${contact.id}`
        : '/api/contacts/v2'
      
      const response = await fetch(url, {
        method: contact ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save contact')
      }
      
      toast({
        title: 'Success',
        description: contact ? 'Contact updated successfully' : 'Contact created successfully',
      })
      
      onSuccess()
    } catch (error) {
      console.error('Error saving contact:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save contact',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {contact ? 'Edit Contact' : 'New Contact'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="companyName">Company</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Company name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="leadStatus">Lead Status</Label>
                <Select 
                  value={formData.leadStatus} 
                  onValueChange={(value: any) => setFormData({ ...formData, leadStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="CONTACTED">Contacted</SelectItem>
                    <SelectItem value="QUALIFIED">Qualified</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                    <SelectItem value="WON">Won</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="leadScore">Lead Score (0-100)</Label>
                <Input
                  id="leadScore"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.leadScore}
                  onChange={(e) => setFormData({ ...formData, leadScore: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <Label htmlFor="twitter">Twitter Username</Label>
                <Input
                  id="twitter"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="@username"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g. hot lead, enterprise, decision maker"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (contact ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}