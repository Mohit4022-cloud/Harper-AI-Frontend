'use client'

import { useRef, useState, useCallback, useEffect, memo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useInfiniteContacts } from '@/hooks/use-contacts'
import { useAppStore } from '@/store'
import { Contact, ContactId } from '@/types/brand'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, Building2, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface VirtualTableProps {
  onContactSelect?: (contact: Contact) => void
  enableMultiSelect?: boolean
  className?: string
}

// Column definitions
const columns = [
  { id: 'select', width: 50, label: '' },
  { id: 'name', width: 250, label: 'Name' },
  { id: 'company', width: 200, label: 'Company' },
  { id: 'phone', width: 150, label: 'Phone' },
  { id: 'email', width: 250, label: 'Email' },
  { id: 'leadScore', width: 100, label: 'Score' },
  { id: 'status', width: 120, label: 'Status' },
  { id: 'lastContact', width: 150, label: 'Last Contact' },
  { id: 'actions', width: 100, label: 'Actions' },
]

const ROW_HEIGHT = 60
const OVERSCAN = 5

// Memoized row component for performance
const ContactRow = memo(({ 
  contact, 
  isSelected, 
  onToggleSelect,
  onContactClick,
  style,
}: {
  contact: Contact
  isSelected: boolean
  onToggleSelect: (id: ContactId) => void
  onContactClick: (contact: Contact) => void
  style: React.CSSProperties
}) => {
  const getStatusColor = (status: Contact['leadStatus']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'contacted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'qualified': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'unqualified': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 40) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div 
      style={style}
      className={cn(
        "flex items-center border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer",
        isSelected && "bg-purple-50 dark:bg-purple-900/20"
      )}
      onClick={() => onContactClick(contact)}
    >
      {/* Select */}
      <div className="w-[50px] flex items-center justify-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(contact.id)}
          onClick={(e) => e.stopPropagation()}
          className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
        />
      </div>

      {/* Name */}
      <div className="w-[250px] flex items-center gap-3 px-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={contact.avatar} />
          <AvatarFallback className="text-xs">
            {contact.firstName[0]}{contact.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {contact.firstName} {contact.lastName}
          </p>
          <div className="flex gap-2 text-xs text-gray-500">
            {contact.tags?.slice(0, 2).map(tag => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Company */}
      <div className="w-[200px] px-2">
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-3 w-3 text-gray-400" />
          <span className="truncate">{contact.company || '-'}</span>
        </div>
      </div>

      {/* Phone */}
      <div className="w-[150px] px-2">
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-3 w-3 text-gray-400" />
          <span>{contact.phone}</span>
        </div>
      </div>

      {/* Email */}
      <div className="w-[250px] px-2">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-3 w-3 text-gray-400" />
          <span className="truncate">{contact.email || '-'}</span>
        </div>
      </div>

      {/* Lead Score */}
      <div className="w-[100px] px-2">
        <span className={cn("font-semibold text-sm", getScoreColor(contact.leadScore))}>
          {contact.leadScore}
        </span>
      </div>

      {/* Status */}
      <div className="w-[120px] px-2">
        <Badge className={cn("text-xs", getStatusColor(contact.leadStatus))}>
          {contact.leadStatus}
        </Badge>
      </div>

      {/* Last Contact */}
      <div className="w-[150px] px-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>
            {contact.lastContactedAt 
              ? format(new Date(contact.lastContactedAt), 'MMM d, yyyy')
              : 'Never'
            }
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="w-[100px] px-2 flex items-center gap-2">
        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
          <Phone className="h-4 w-4" />
        </button>
        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
          <Mail className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
})

ContactRow.displayName = 'ContactRow'

export function VirtualTable({ 
  onContactSelect, 
  enableMultiSelect = true,
  className 
}: VirtualTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const scrollingRef = useRef<number>()
  
  const { 
    filters, 
    selectedContacts, 
    toggleContactSelection,
    setSelectedContacts,
  } = useAppStore()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteContacts(filters)

  // Flatten pages data
  const allContacts = data?.pages.flatMap(page => page.contacts) ?? []
  const totalCount = data?.pages[0]?.totalCount ?? 0

  // Virtual scrolling
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allContacts.length + 1 : allContacts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  // Handle infinite scroll
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]
    
    if (
      lastItem &&
      lastItem.index === allContacts.length &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    virtualItems,
    allContacts.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ])

  // Smooth scroll performance optimization
  const handleScroll = useCallback(() => {
    if (scrollingRef.current) {
      clearTimeout(scrollingRef.current)
    }
    
    scrollingRef.current = window.setTimeout(() => {
      // Re-enable pointer events after scrolling stops
      if (parentRef.current) {
        parentRef.current.style.pointerEvents = ''
      }
    }, 150)
    
    // Disable pointer events while scrolling for better performance
    if (parentRef.current) {
      parentRef.current.style.pointerEvents = 'none'
    }
  }, [])

  const handleContactClick = useCallback((contact: Contact) => {
    onContactSelect?.(contact)
  }, [onContactSelect])

  const handleSelectAll = useCallback(() => {
    if (selectedContacts.size === allContacts.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(allContacts.map(c => c.id)))
    }
  }, [selectedContacts.size, allContacts, setSelectedContacts])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
        {columns.map(column => (
          <div
            key={column.id}
            className={cn(
              "px-2 py-3 text-sm font-medium text-gray-700 dark:text-gray-300",
              column.id === 'select' && "flex items-center justify-center"
            )}
            style={{ width: column.width }}
          >
            {column.id === 'select' && enableMultiSelect ? (
              <Checkbox
                checked={selectedContacts.size === allContacts.length && allContacts.length > 0}
                indeterminate={selectedContacts.size > 0 && selectedContacts.size < allContacts.length}
                onCheckedChange={handleSelectAll}
                className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              />
            ) : (
              column.label
            )}
          </div>
        ))}
      </div>

      {/* Virtual scroll container */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const contact = allContacts[virtualRow.index]
            const isLoaderRow = virtualRow.index > allContacts.length - 1

            if (isLoaderRow) {
              return (
                <div
                  key="loader"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="flex items-center justify-center"
                >
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              )
            }

            return (
              <ContactRow
                key={contact.id}
                contact={contact}
                isSelected={selectedContacts.has(contact.id)}
                onToggleSelect={toggleContactSelection}
                onContactClick={handleContactClick}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {selectedContacts.size > 0 && (
            <span className="font-medium">{selectedContacts.size} selected • </span>
          )}
          Showing {allContacts.length} of {totalCount.toLocaleString()} contacts
        </div>
        <div className="text-sm text-gray-500">
          {hasNextPage && (
            <span>Scroll to load more...</span>
          )}
        </div>
      </div>
    </div>
  )
}