'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthStore } from '@/stores/authStore'
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
  Building,
  Calendar,
  MoreHorizontal,
  Activity,
  Edit,
  Trash,
  Star,
  UserPlus,
  Target,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Archive,
  Eye,
  MessageSquare,
  SortAsc,
  SortDesc,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import ContactDetailModal from '@/components/contacts/ContactDetailModal'
import ContactFormModal from '@/components/contacts/ContactFormModal'
import ImportContactsModal from '@/components/contacts/ImportContactsModal'
import BulkActionsBar from '@/components/contacts/BulkActionsBar'

// Types
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
    domain?: string | null
    industry?: string | null
  } | null
  leadStatus: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'WON'
  leadScore: number
  assignedTo?: {
    id: string
    name: string
    email: string
    avatar?: string | null
  } | null
  tags: string[]
  createdAt: string
  lastContactedAt?: string | null
  _count: {
    activities: number
    emails: number
    calls: number
    tasks: number
    notes: number
  }
}

interface ContactsResponse {
  data: Contact[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  stats?: {
    totalContacts: number
    newThisWeek: number
    contactedThisWeek: number
    avgLeadScore: number
    statusBreakdown: Record<string, number>
  }
}

// Lead status colors and labels
const leadStatusConfig = {
  NEW: { label: 'New', color: 'bg-blue-100 text-blue-800' },
  CONTACTED: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  QUALIFIED: { label: 'Qualified', color: 'bg-green-100 text-green-800' },
  LOST: { label: 'Lost', color: 'bg-red-100 text-red-800' },
  WON: { label: 'Won', color: 'bg-purple-100 text-purple-800' },
}

// Lead score colors
const getLeadScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

export default function ContactsPage() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const parentRef = useRef<HTMLDivElement>(null)
  
  // State
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<ContactsResponse['stats']>()
  
  // Modals
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  
  // Virtual scrolling
  const rowVirtualizer = useVirtualizer({
    count: contacts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Estimated row height
    overscan: 5,
  })

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        sortBy,
        sortOrder,
        includeStats: page === 1 ? 'true' : 'false',
      })
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      
      if (selectedStatus !== 'all') {
        params.append('leadStatus', selectedStatus)
      }
      
      const response = await fetch(`/api/contacts/v2?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }
      
      const data: ContactsResponse = await response.json()
      
      if (page === 1) {
        setContacts(data.data)
        setStats(data.stats)
      } else {
        setContacts(prev => [...prev, ...data.data])
      }
      
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch contacts',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [token, page, searchQuery, selectedStatus, sortBy, sortOrder, toast])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    setPage(1)
    setContacts([])
  }, [])

  // Handle status filter
  const handleStatusFilter = useCallback((value: string) => {
    setSelectedStatus(value)
    setPage(1)
    setContacts([])
  }, [])

  // Handle sort
  const handleSort = useCallback((field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
    setContacts([])
  }, [sortBy])

  // Handle selection
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedContacts(new Set(contacts.map(c => c.id)))
    } else {
      setSelectedContacts(new Set())
    }
  }, [contacts])

  const handleSelectContact = useCallback((contactId: string, checked: boolean) => {
    setSelectedContacts(prev => {
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
  const handleViewContact = useCallback((contact: Contact) => {
    setSelectedContact(contact)
    setShowDetailModal(true)
  }, [])

  const handleEditContact = useCallback((contact: Contact) => {
    setEditingContact(contact)
    setShowFormModal(true)
  }, [])

  const handleDeleteContact = useCallback(async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    
    try {
      const response = await fetch(`/api/contacts/v2/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete contact')
      }
      
      toast({
        title: 'Success',
        description: 'Contact deleted successfully',
      })
      
      // Refresh contacts
      setPage(1)
      setContacts([])
      await fetchContacts()
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete contact',
        variant: 'destructive',
      })
    }
  }, [token, fetchContacts, toast])

  // Handle export
  const handleExport = useCallback(async (format: 'csv' | 'json') => {
    try {
      const response = await fetch('/api/contacts/v2/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          filters: {
            leadStatus: selectedStatus !== 'all' ? [selectedStatus] : undefined,
            contactIds: selectedContacts.size > 0 ? Array.from(selectedContacts) : undefined,
          },
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to export contacts')
      }
      
      if (format === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `contacts_export_${new Date().toISOString()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `contacts_export_${new Date().toISOString()}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
      
      toast({
        title: 'Success',
        description: `Exported ${selectedContacts.size || 'all'} contacts as ${format.toUpperCase()}`,
      })
    } catch (error) {
      console.error('Error exporting contacts:', error)
      toast({
        title: 'Error',
        description: 'Failed to export contacts',
        variant: 'destructive',
      })
    }
  }, [token, selectedStatus, selectedContacts, toast])

  // Load more on scroll
  const items = rowVirtualizer.getVirtualItems()
  const lastItem = items[items.length - 1]

  useEffect(() => {
    if (!lastItem) return
    
    if (
      lastItem.index >= contacts.length - 1 &&
      page < totalPages &&
      !loading
    ) {
      setPage(prev => prev + 1)
    }
  }, [lastItem, contacts.length, page, totalPages, loading])

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">
            {stats?.totalContacts ? `${stats.totalContacts.toLocaleString()} total contacts` : 'Manage your leads and prospects'}
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
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          
          <Button 
            className="gradient-purple-pink hover:opacity-90"
            onClick={() => {
              setEditingContact(null)
              setShowFormModal(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-bold">{stats.totalContacts.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New This Week</p>
                  <p className="text-2xl font-bold">{stats.newThisWeek.toLocaleString()}</p>
                </div>
                <UserPlus className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Contacted This Week</p>
                  <p className="text-2xl font-bold">{stats.contactedThisWeek.toLocaleString()}</p>
                </div>
                <Activity className="h-8 w-8 text-green-400" />
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
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedStatus} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
                <SelectItem value="WON">Won</SelectItem>
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  More Filters
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem>Has Email</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Has Phone</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Has Company</DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem>Lead Score 80+</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Lead Score 60-79</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Lead Score 40-59</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Lead Score &lt;40</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedContacts.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedContacts.size}
          onClearSelection={() => setSelectedContacts(new Set())}
          onBulkAction={async (action) => {
            // Handle bulk actions
            console.log('Bulk action:', action, Array.from(selectedContacts))
          }}
        />
      )}

      {/* Contacts Table with Virtual Scrolling */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="p-0 flex-1 flex flex-col">
          {/* Table Header */}
          <div className="border-b bg-gray-50 px-6 py-3">
            <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-600">
              <div className="col-span-1">
                <Checkbox
                  checked={selectedContacts.size === contacts.length && contacts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </div>
              <div 
                className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-gray-900"
                onClick={() => handleSort('firstName')}
              >
                Name
                {sortBy === 'firstName' && (
                  sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                )}
              </div>
              <div className="col-span-2">Company</div>
              <div 
                className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-900"
                onClick={() => handleSort('leadScore')}
              >
                Lead Score
                {sortBy === 'leadScore' && (
                  sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                )}
              </div>
              <div className="col-span-2">Status</div>
              <div 
                className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-gray-900"
                onClick={() => handleSort('lastContactedAt')}
              >
                Activity
                {sortBy === 'lastContactedAt' && (
                  sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                )}
              </div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
          </div>

          {/* Virtual Scrolling Container */}
          <div 
            ref={parentRef}
            className="flex-1 overflow-auto"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const contact = contacts[virtualItem.index]
                if (!contact) return null

                return (
                  <div
                    key={contact.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center px-6 py-3 border-b hover:bg-gray-50">
                      <div className="col-span-1">
                        <Checkbox
                          checked={selectedContacts.has(contact.id)}
                          onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                        />
                      </div>
                      
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {contact.firstName[0]}{contact.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <button
                              onClick={() => handleViewContact(contact)}
                              className="font-medium text-gray-900 hover:text-blue-600 text-left"
                            >
                              {contact.firstName} {contact.lastName}
                            </button>
                            <p className="text-sm text-gray-500">{contact.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        {contact.company ? (
                          <div>
                            <p className="font-medium text-gray-900">{contact.company.name}</p>
                            <p className="text-sm text-gray-500">{contact.title}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                      
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-2xl font-bold",
                            getLeadScoreColor(contact.leadScore)
                          )}>
                            {contact.leadScore}
                          </span>
                          <span className="text-sm text-gray-500">/100</span>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "font-medium",
                            leadStatusConfig[contact.leadStatus].color
                          )}
                        >
                          {leadStatusConfig[contact.leadStatus].label}
                        </Badge>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          {contact._count.emails > 0 && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span>{contact._count.emails}</span>
                            </div>
                          )}
                          {contact._count.calls > 0 && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{contact._count.calls}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="col-span-1 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewContact(contact)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
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
                              onClick={() => handleDeleteContact(contact.id)}
                              className="text-red-600"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Loading State */}
          {loading && contacts.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading contacts...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && contacts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No contacts found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedStatus !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Get started by adding your first contact'}
              </p>
              {!searchQuery && selectedStatus === 'all' && (
                <Button 
                  onClick={() => {
                    setEditingContact(null)
                    setShowFormModal(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Contact
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ContactDetailModal
        contact={selectedContact}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedContact(null)
        }}
        onEdit={(contact) => {
          setShowDetailModal(false)
          handleEditContact(contact)
        }}
      />

      <ContactFormModal
        contact={editingContact}
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false)
          setEditingContact(null)
        }}
        onSuccess={() => {
          setShowFormModal(false)
          setEditingContact(null)
          setPage(1)
          setContacts([])
          fetchContacts()
        }}
      />

      <ImportContactsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          setShowImportModal(false)
          setPage(1)
          setContacts([])
          fetchContacts()
        }}
      />
    </div>
  )
}