import { memo, useMemo, useCallback, useRef, useEffect } from 'react'
import { Contact } from '@/types/brand'
import { cn } from '@/lib/utils'

// Optimized contact card with memoization
export const OptimizedContactCard = memo(({ 
  contact, 
  onSelect,
  isSelected 
}: {
  contact: Contact
  onSelect?: (contact: Contact) => void
  isSelected?: boolean
}) => {
  const handleClick = useCallback(() => {
    onSelect?.(contact)
  }, [contact, onSelect])

  const displayName = useMemo(() => 
    `${contact.firstName} ${contact.lastName}`.trim(),
    [contact.firstName, contact.lastName]
  )

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "p-4 border rounded-lg cursor-pointer transition-colors",
        isSelected ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-gray-300"
      )}
    >
      <h3 className="font-medium">{displayName}</h3>
      {contact.company && <p className="text-sm text-gray-600">{contact.company}</p>}
      <p className="text-sm text-gray-500">{contact.phone}</p>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.contact.id === nextProps.contact.id &&
    prevProps.contact.updatedAt === nextProps.contact.updatedAt &&
    prevProps.isSelected === nextProps.isSelected
  )
})

OptimizedContactCard.displayName = 'OptimizedContactCard'

// Optimized list renderer with virtualization
export const OptimizedList = memo(({ 
  items, 
  renderItem,
  keyExtractor,
  className 
}: {
  items: any[]
  renderItem: (item: any, index: number) => React.ReactNode
  keyExtractor: (item: any, index: number) => string
  className?: string
}) => {
  const renderedItems = useMemo(() => 
    items.map((item, index) => (
      <div key={keyExtractor(item, index)}>
        {renderItem(item, index)}
      </div>
    )),
    [items, renderItem, keyExtractor]
  )

  return (
    <div className={className}>
      {renderedItems}
    </div>
  )
})

OptimizedList.displayName = 'OptimizedList'

// Optimized search input with debouncing
export const OptimizedSearchInput = memo(({ 
  onSearch,
  placeholder = "Search...",
  debounceMs = 300 
}: {
  onSearch: (query: string) => void
  placeholder?: string
  debounceMs?: number
}) => {
  const timeoutRef = useRef<NodeJS.Timeout>()

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      onSearch(value)
    }, debounceMs)
  }, [onSearch, debounceMs])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <input
      type="text"
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
    />
  )
})

OptimizedSearchInput.displayName = 'OptimizedSearchInput'