'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  Phone, 
  Mail, 
  Building2, 
  User, 
  Search,
  PhoneCall,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { useContactsStore } from '@/stores/contactsStore'
import { useCallQueueStore } from '@/stores/callQueueStore'
import { cn } from '@/lib/utils'
import type { Contact } from '@/types/contact'

export function ContactsTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const { contacts, loading, loadContacts } = useContactsStore()
  const { addToQueue, queue } = useCallQueueStore()

  // Load contacts on mount
  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  // Filter contacts based on search
  const filteredContacts = contacts.filter((contact) => {
    const search = searchTerm.toLowerCase()
    return (
      contact.name.toLowerCase().includes(search) ||
      (contact.company?.toLowerCase().includes(search) || false) ||
      (contact.title?.toLowerCase().includes(search) || false) ||
      contact.email.toLowerCase().includes(search) ||
      contact.phone.includes(search)
    )
  })

  const toggleContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    )
  }

  const toggleAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(filteredContacts.map((c) => c.id))
    }
  }

  const addSelectedToQueue = () => {
    const contactsToAdd = contacts.filter((c) => selectedContacts.includes(c.id))
    // Convert to call queue format
    const queueContacts = contactsToAdd.map(c => ({
      id: c.id,
      name: c.name,
      company: c.company || '',
      title: c.title || '',
      phone: c.phone,
      email: c.email,
      industry: c.industry || '',
      lastCalled: c.lastContactedAt ? new Date(c.lastContactedAt) : undefined,
      callStatus: undefined as any,
      callDuration: undefined,
      notes: c.notes
    }))
    addToQueue(queueContacts)
    setSelectedContacts([])
  }

  const isInQueue = (contactId: string) => {
    return queue.some((c) => c.id === contactId)
  }

  const getCallStatusIcon = (contact: Contact) => {
    // Check if contact was recently contacted
    if (contact.lastContactedAt) {
      const daysSinceContact = Math.floor((Date.now() - new Date(contact.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceContact < 7) {
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      }
    }
    return null
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>Contacts Database</CardTitle>
            <Badge variant="secondary">
              {filteredContacts.length} contacts
            </Badge>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company, title, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Actions */}
          {selectedContacts.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                onClick={addSelectedToQueue}
                size="sm"
                className="gap-2"
              >
                <PhoneCall className="h-4 w-4" />
                Add {selectedContacts.length} to Call Queue
              </Button>
              <Button
                onClick={() => setSelectedContacts([])}
                variant="ghost"
                size="sm"
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        {loading && contacts.length === 0 ? (
          <div className="flex items-center justify-center h-[500px] text-muted-foreground">
            Loading contacts...
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="w-full">
            <table className="w-full">
              <thead className="sticky top-0 bg-background border-b">
                <tr>
                  <th className="text-left p-3 w-10">
                    <Checkbox
                      checked={
                        filteredContacts.length > 0 &&
                        selectedContacts.length === filteredContacts.length
                      }
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="text-left p-3">Contact</th>
                  <th className="text-left p-3">Company</th>
                  <th className="text-left p-3">Contact Info</th>
                  <th className="text-left p-3">Last Called</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors",
                      selectedContacts.includes(contact.id) && "bg-muted/30"
                    )}
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={() => toggleContact(contact.id)}
                      />
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {contact.name}
                        </p>
                        {contact.title && (
                          <p className="text-sm text-muted-foreground">
                            {contact.title}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{contact.company || 'No company'}</p>
                          {contact.industry && (
                            <p className="text-xs text-muted-foreground">
                              {contact.industry}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {contact.phone}
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {contact.email}
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      {contact.lastContactedAt ? (
                        <div>
                          <p className="text-sm">
                            {format(new Date(contact.lastContactedAt), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(contact.lastContactedAt), 'h:mm a')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getCallStatusIcon(contact)}
                        {isInQueue(contact.id) && (
                          <Badge variant="secondary" className="text-xs">
                            In Queue
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}