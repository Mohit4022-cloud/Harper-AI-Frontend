'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useInfiniteContacts, useDeleteContacts, useBulkUpdateContacts } from '@/hooks/use-contacts'
import { useRealtimeSync } from '@/hooks/use-realtime-sync'
import { Contact, ContactId, ContactFilters } from '@/types/brand'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Download,
  Upload,
  CheckSquare,
  Square,
  MoreVertical,
  Phone,
  Mail,
  User,
  Calendar,
  Tag,
  Trash2,
  Edit2,
  Star,
  StarOff,
  Archive,
  ChevronDown,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDistanceToNow } from 'date-fns'

const ROW_HEIGHT = 72 // Height of each contact row
const OVERSCAN = 5 // Number of items to render outside visible area

interface VirtualContactTableProps {
  filters?: ContactFilters
  onContactSelect?: (contact: Contact) => void
}

export function VirtualContactTable({ filters = {}, onContactSelect }: VirtualContactTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<ContactId>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  
  // Real-time sync
  useRealtimeSync({ syncContacts: true })
  
  // Infinite query for contacts
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteContacts({
    ...filters,
    search,
  })
  
  // Mutations
  const deleteContacts = useDeleteContacts()
  const bulkUpdate = useBulkUpdateContacts()
  
  // Flatten all pages of contacts
  const allContacts = useMemo(
    () => data?.pages.flatMap(page => page.contacts) ?? [],
    [data]
  )
  
  // Virtual list configuration
  const virtualizer = useVirtualizer({
    count: allContacts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
    onChange: (instance) => {
      // Load more when scrolling near the end
      const lastItem = instance.getVirtualItems().at(-1)
      if (
        lastItem &&
        lastItem.index >= allContacts.length - 1 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage()
      }
    },
  })
  
  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === allContacts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allContacts.map(c => c.id)))
    }
  }, [allContacts, selectedIds.size])
  
  const handleSelectContact = useCallback((id: ContactId) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])
  
  // Bulk actions
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} contact${selectedIds.size > 1 ? 's' : ''}?`
    )
    
    if (confirmed) {
      await deleteContacts.mutateAsync(Array.from(selectedIds))
      setSelectedIds(new Set())
      setIsSelecting(false)
    }
  }, [selectedIds, deleteContacts])
  
  const handleBulkFavorite = useCallback(async (favorite: boolean) => {
    if (selectedIds.size === 0) return
    
    await bulkUpdate.mutateAsync({
      ids: Array.from(selectedIds),
      updates: { isFavorite: favorite },
    })
    setSelectedIds(new Set())
    setIsSelecting(false)
  }, [selectedIds, bulkUpdate])
  
  const handleBulkArchive = useCallback(async () => {
    if (selectedIds.size === 0) return
    
    await bulkUpdate.mutateAsync({
      ids: Array.from(selectedIds),
      updates: { status: 'archived' },
    })
    setSelectedIds(new Set())
    setIsSelecting(false)
  }, [selectedIds, bulkUpdate])
  
  // Export functionality
  const handleExport = useCallback(async () => {
    const selectedContacts = selectedIds.size > 0
      ? allContacts.filter(c => selectedIds.has(c.id))
      : allContacts
    
    const csv = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Tags', 'Created At'].join(','),
      ...selectedContacts.map(c =>
        [
          c.firstName,
          c.lastName,
          c.email,
          c.phone,
          c.company || '',
          c.tags.join(';'),
          c.createdAt.toISOString(),
        ].join(',')
      ),
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [selectedIds, allContacts])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelecting) {
        setIsSelecting(false)
        setSelectedIds(new Set())
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && isSelecting) {
        e.preventDefault()
        handleSelectAll()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSelecting, handleSelectAll])
  
  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-background-subtle">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              Contacts
              {allContacts.length > 0 && (
                <span className="ml-2 text-sm text-foreground-muted">
                  ({allContacts.length.toLocaleString()})
                </span>
              )}
            </h2>
            
            {isSelecting && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsSelecting(false)
                    setSelectedIds(new Set())
                  }}
                >
                  Cancel
                </Button>
                
                {selectedIds.size > 0 && (
                  <>
                    <span className="text-sm text-foreground-muted">
                      {selectedIds.size} selected
                    </span>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBulkDelete}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBulkFavorite(true)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBulkArchive}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsSelecting(!isSelecting)}>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select multiple
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Upload className="h-4 w-4 mr-2" />
                  Import contacts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Column headers */}
        <div className="flex items-center px-4 py-2 text-sm font-medium text-foreground-muted border-t border-border">
          {isSelecting && (
            <div className="w-10 flex items-center justify-center">
              <Checkbox
                checked={selectedIds.size === allContacts.length && allContacts.length > 0}
                indeterminate={selectedIds.size > 0 && selectedIds.size < allContacts.length}
                onCheckedChange={handleSelectAll}
              />
            </div>
          )}
          <div className="flex-1 grid grid-cols-12 gap-4">
            <div className="col-span-4">Name</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-2">Tags</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
        </div>
      </div>
      
      {/* Virtual list */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <AnimatePresence mode="popLayout">
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const contact = allContacts[virtualItem.index]
              if (!contact) return null
              
              const isSelected = selectedIds.has(contact.id)
              
              return (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className={cn(
                    'flex items-center px-4 border-b border-border hover:bg-background-subtle/50 transition-colors',
                    isSelected && 'bg-accent/10',
                    'cursor-pointer'
                  )}
                  onClick={() => {
                    if (isSelecting) {
                      handleSelectContact(contact.id)
                    } else {
                      onContactSelect?.(contact)
                    }
                  }}
                >
                  {isSelecting && (
                    <div className="w-10 flex items-center justify-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectContact(contact.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 grid grid-cols-12 gap-4 py-3">
                    {/* Name & Avatar */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        {contact.avatarUrl ? (
                          <img
                            src={contact.avatarUrl}
                            alt={`${contact.firstName} ${contact.lastName}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-accent" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {contact.firstName} {contact.lastName}
                          </p>
                          {contact.isFavorite && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        {contact.company && (
                          <p className="text-sm text-foreground-muted truncate">
                            {contact.company}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Email */}
                    <div className="col-span-3 flex items-center">
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-sm text-accent hover:underline truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {contact.email}
                      </a>
                    </div>
                    
                    {/* Phone */}
                    <div className="col-span-2 flex items-center">
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-sm text-foreground-subtle hover:text-foreground truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {contact.phone}
                        </a>
                      )}
                    </div>
                    
                    {/* Tags */}
                    <div className="col-span-2 flex items-center gap-1 overflow-hidden">
                      {contact.tags.slice(0, 2).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {contact.tags.length > 2 && (
                        <span className="text-xs text-foreground-muted">
                          +{contact.tags.length - 2}
                        </span>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onContactSelect?.(contact)}>
                            <User className="h-4 w-4 mr-2" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleBulkFavorite(!contact.isFavorite)}
                          >
                            {contact.isFavorite ? (
                              <>
                                <StarOff className="h-4 w-4 mr-2" />
                                Remove from favorites
                              </>
                            ) : (
                              <>
                                <Star className="h-4 w-4 mr-2" />
                                Add to favorites
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        
        {/* Loading indicator */}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-foreground-muted">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span className="text-sm">Loading more contacts...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Empty state */}
      {!isLoading && allContacts.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <User className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No contacts found</h3>
            <p className="text-foreground-muted">
              {search ? 'Try adjusting your search terms' : 'Start by adding your first contact'}
            </p>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-destructive">
            <p>Failed to load contacts</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm underline mt-2"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}