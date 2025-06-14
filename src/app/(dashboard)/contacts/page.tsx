'use client'

import { useState, useEffect } from 'react'
import { useContactsStore } from '@/stores/contactsStore'
import { Contact } from '@/types/contact'
import { AddContactForm } from '@/components/contacts/AddContactForm'
import { EditContactForm } from '@/components/contacts/EditContactForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash, 
  Phone,
  Mail,
  Download,
  RefreshCw,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  prospect: 'bg-blue-100 text-blue-800',
  customer: 'bg-purple-100 text-purple-800',
  churned: 'bg-red-100 text-red-800',
}

export default function ContactsPage() {
  const { contacts, loading, error, loadContacts, deleteContact } = useContactsStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  )

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return
    
    try {
      await deleteContact(id)
      toast({
        title: 'Contact deleted',
        description: `${name} has been removed from your contacts.`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete contact',
        variant: 'destructive',
      })
    }
  }

  const exportContacts = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Company', 'Title', 'Status', 'Lead Score'],
      ...filteredContacts.map(c => [
        c.name,
        c.email,
        c.phone,
        c.company || '',
        c.title || '',
        c.status || '',
        c.leadScore?.toString() || '',
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const stats = {
    total: contacts.length,
    active: contacts.filter(c => c.status === 'active').length,
    prospects: contacts.filter(c => c.status === 'prospect').length,
    customers: contacts.filter(c => c.status === 'customer').length,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">
            {stats.total} total contacts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadContacts()}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
          <Button variant="outline" onClick={exportContacts}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Contacts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Prospects</p>
                <p className="text-2xl font-bold">{stats.prospects}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Customers</p>
                <p className="text-2xl font-bold">{stats.customers}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Contacts</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[300px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-600 text-center py-4">
              Error: {error}
            </div>
          )}
          
          {loading && contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Loading contacts...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No contacts found matching your search.' : 'No contacts yet. Add your first contact!'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lead Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.company && (
                        <div>
                          <div className="font-medium">{contact.company}</div>
                          {contact.title && (
                            <div className="text-sm text-gray-500">{contact.title}</div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(statusColors[contact.status || 'prospect'])}>
                        {contact.status || 'prospect'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        {contact.leadScore || 50}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(contact.id, contact.name)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddContactForm open={showAddForm} onOpenChange={setShowAddForm} />
      <EditContactForm 
        contact={editingContact} 
        open={!!editingContact} 
        onOpenChange={(open) => !open && setEditingContact(null)} 
      />
    </div>
  )
}