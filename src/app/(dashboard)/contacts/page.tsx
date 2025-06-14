'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  ChevronDown,
  Mail,
  Phone,
  Building2,
  MoreHorizontal,
  Edit,
  Trash,
  UserPlus,
  Target,
  Activity,
  RefreshCw,
  Eye,
  MessageSquare,
  Archive,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { useContactsStore, type Contact } from '@/stores/contactsStore'
import { AddContactForm } from '@/components/contacts/AddContactForm'

// Lead status colors and labels
const leadStatusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  prospect: { label: 'Prospect', color: 'bg-blue-100 text-blue-800' },
  customer: { label: 'Customer', color: 'bg-purple-100 text-purple-800' },
  churned: { label: 'Churned', color: 'bg-red-100 text-red-800' },
}

// Lead score colors
const getLeadScoreColor = (score?: number) => {
  if (!score) return 'text-gray-400'
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

export default function ContactsPage() {
  const { toast } = useToast()
  const {
    contacts,
    loading,
    error,
    searchTerm,
    selectedTags,
    fetchContacts,
    searchContacts,
    setSearchTerm,
    setSelectedTags,
    deleteContact,
    getTags,
  } = useContactsStore()

  // State
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  // Fetch contacts on mount
  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Filter contacts
  const filteredContacts = searchContacts(searchTerm).filter((contact) => {
    if (selectedStatus === 'all') return true
    return contact.status === selectedStatus
  })

  // Stats calculation
  const stats = {
    totalContacts: contacts.length,
    activeContacts: contacts.filter((c) => c.status === 'active').length,
    prospects: contacts.filter((c) => c.status === 'prospect').length,
    customers: contacts.filter((c) => c.status === 'customer').length,
    avgLeadScore: Math.round(
      contacts.reduce((sum, c) => sum + (c.leadScore || 0), 0) / contacts.length || 0
    ),
  }

  // Handle selection
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedContacts(new Set(filteredContacts.map((c) => c.id!)))
      } else {
        setSelectedContacts(new Set())
      }
    },
    [filteredContacts]
  )

  const handleSelectContact = useCallback((contactId: string, checked: boolean) => {
    setSelectedContacts((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(contactId)
      } else {
        newSet.delete(contactId)
      }
      return newSet
    })
  }, [])

  // Handle contact actions
  const handleEditContact = useCallback((contact: Contact) => {
    setEditingContact(contact)
    setShowAddForm(true)
  }, [])

  const handleDeleteContact = useCallback(
    async (contactId: string) => {
      if (!confirm('Are you sure you want to delete this contact?')) return

      try {
        await deleteContact(contactId)
        toast({
          title: 'Success',
          description: 'Contact deleted successfully',
        })
      } catch (error) {
        console.error('Error deleting contact:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete contact',
          variant: 'destructive',
        })
      }
    },
    [deleteContact, toast]
  )

  // Handle export
  const handleExport = useCallback(
    async (format: 'csv' | 'json') => {
      try {
        const exportData = selectedContacts.size > 0
          ? contacts.filter((c) => selectedContacts.has(c.id!))
          : filteredContacts

        if (format === 'csv') {
          // Simple CSV export
          const headers = ['Name', 'Email', 'Phone', 'Company', 'Title', 'Status', 'Lead Score']
          const rows = exportData.map((c) => [
            c.name,
            c.email,
            c.phone || '',
            c.company || '',
            c.title || '',
            c.status || '',
            c.leadScore || '',
          ])
          
          const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
          ].join('\n')

          const blob = new Blob([csvContent], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`
          a.click()
          URL.revokeObjectURL(url)
        } else {
          // JSON export
          const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json',
          })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `contacts_${new Date().toISOString().split('T')[0]}.json`
          a.click()
          URL.revokeObjectURL(url)
        }

        toast({
          title: 'Success',
          description: `Exported ${exportData.length} contacts as ${format.toUpperCase()}`,
        })
      } catch (error) {
        console.error('Error exporting contacts:', error)
        toast({
          title: 'Error',
          description: 'Failed to export contacts',
          variant: 'destructive',
        })
      }
    },
    [contacts, filteredContacts, selectedContacts, toast]
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">
            {stats.totalContacts > 0
              ? `${stats.totalContacts} total contacts`
              : 'Manage your leads and prospects'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            disabled
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>

          <Button
            className="gradient-purple-pink hover:opacity-90"
            onClick={() => {
              setEditingContact(null)
              setShowAddForm(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats.totalContacts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-bold">{stats.totalContacts}</p>
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
                  <p className="text-2xl font-bold">{stats.activeContacts}</p>
                </div>
                <Activity className="h-8 w-8 text-green-400" />
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
                <UserPlus className="h-8 w-8 text-blue-400" />
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
                <Users className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Lead Score</p>
                  <p className="text-2xl font-bold">{stats.avgLeadScore}</p>
                </div>
                <Target className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contacts by name, email, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="border-b bg-gray-50 px-6 py-3">
            <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-600">
              <div className="col-span-1">
                <Checkbox
                  checked={
                    selectedContacts.size === filteredContacts.length &&
                    filteredContacts.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Company</div>
              <div className="col-span-2">Contact Info</div>
              <div className="col-span-1">Score</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
          </div>

          {/* Loading State */}
          {loading && contacts.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading contacts...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-6 text-center text-red-600">
              <p>Error: {error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredContacts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No contacts found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first contact'}
              </p>
              {!searchTerm && selectedStatus === 'all' && (
                <Button
                  onClick={() => {
                    setEditingContact(null)
                    setShowAddForm(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Contact
                </Button>
              )}
            </div>
          )}

          {/* Contact Rows */}
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="grid grid-cols-12 gap-4 items-center px-6 py-3 border-b hover:bg-gray-50"
            >
              <div className="col-span-1">
                <Checkbox
                  checked={selectedContacts.has(contact.id!)}
                  onCheckedChange={(checked) =>
                    handleSelectContact(contact.id!, checked as boolean)
                  }
                />
              </div>

              <div className="col-span-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {contact.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.email}</p>
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                {contact.company ? (
                  <div>
                    <p className="font-medium text-gray-900">{contact.company}</p>
                    {contact.title && (
                      <p className="text-sm text-gray-500">{contact.title}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>

              <div className="col-span-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">{contact.email}</span>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">{contact.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-1">
                <span
                  className={cn(
                    'text-lg font-bold',
                    getLeadScoreColor(contact.leadScore)
                  )}
                >
                  {contact.leadScore || 0}
                </span>
              </div>

              <div className="col-span-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    'font-medium',
                    leadStatusConfig[contact.status || 'prospect'].color
                  )}
                >
                  {leadStatusConfig[contact.status || 'prospect'].label}
                </Badge>
              </div>

              <div className="col-span-1 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Contact
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Phone className="h-4 w-4 mr-2" />
                      Make Call
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Note
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteContact(contact.id!)}
                      className="text-red-600"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          {/* Selected Actions Bar */}
          {selectedContacts.size > 0 && (
            <div className="sticky bottom-0 bg-white border-t px-6 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''}{' '}
                selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedContacts(new Set())}
                >
                  Clear Selection
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Handle bulk delete
                    if (
                      confirm(
                        `Are you sure you want to delete ${selectedContacts.size} contacts?`
                      )
                    ) {
                      selectedContacts.forEach((id) => deleteContact(id))
                      setSelectedContacts(new Set())
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Contact Form */}
      <AddContactForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={() => {
          setShowAddForm(false)
          setEditingContact(null)
          fetchContacts()
        }}
      />
    </div>
  )
}