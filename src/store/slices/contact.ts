import { StateCreator } from 'zustand'
import { ContactId, Contact, ContactFilters } from '@/types/brand'

export interface ContactSlice {
  // State
  contacts: Contact[]
  selectedContacts: Set<ContactId>
  searchQuery: string
  filters: ContactFilters
  sortBy: keyof Contact
  sortOrder: 'asc' | 'desc'
  totalCount: number
  isLoading: boolean
  error: string | null
  
  // Actions
  setContacts: (contacts: Contact[]) => void
  addContact: (contact: Contact) => void
  updateContact: (id: ContactId, updates: Partial<Contact>) => void
  deleteContact: (id: ContactId) => void
  deleteContacts: (ids: ContactId[]) => void
  selectContact: (id: ContactId) => void
  selectAll: () => void
  clearSelection: () => void
  setSearchQuery: (query: string) => void
  setFilters: (filters: Partial<ContactFilters>) => void
  setSorting: (sortBy: keyof Contact, sortOrder: 'asc' | 'desc') => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setTotalCount: (count: number) => void
  
  // Optimistic updates
  optimisticUpdate: <T>(
    update: () => void,
    rollback: () => void,
    asyncAction: () => Promise<T>
  ) => Promise<T>
  
  // Computed values
  getFilteredContacts: () => Contact[]
  getSelectedContacts: () => Contact[]
  getContactById: (id: ContactId) => Contact | undefined
}

export const createContactSlice: StateCreator<
  ContactSlice,
  [],
  [],
  ContactSlice
> = (set, get) => ({
  // Initial state
  contacts: [],
  selectedContacts: new Set(),
  searchQuery: '',
  filters: {},
  sortBy: 'firstName',
  sortOrder: 'asc',
  totalCount: 0,
  isLoading: false,
  error: null,
  
  // Actions
  setContacts: (contacts) => set((state) => ({
    ...state,
    contacts,
    isLoading: false,
    error: null
  })),
  
  addContact: (contact) => set((state) => ({
    ...state,
    contacts: [contact, ...state.contacts],
    totalCount: state.totalCount + 1
  })),
  
  updateContact: (id, updates) => set((state) => ({
    ...state,
    contacts: state.contacts.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  
  deleteContact: (id) => set((state) => {
    const newSelectedContacts = new Set(state.selectedContacts)
    newSelectedContacts.delete(id)
    return {
      ...state,
      contacts: state.contacts.filter(c => c.id !== id),
      selectedContacts: newSelectedContacts,
      totalCount: state.totalCount - 1
    }
  }),
  
  deleteContacts: (ids) => set((state) => {
    const newSelectedContacts = new Set(state.selectedContacts)
    ids.forEach(id => newSelectedContacts.delete(id))
    return {
      ...state,
      contacts: state.contacts.filter(c => !ids.includes(c.id)),
      selectedContacts: newSelectedContacts,
      totalCount: state.totalCount - ids.length
    }
  }),
  
  selectContact: (id) => set((state) => {
    const newSelectedContacts = new Set(state.selectedContacts)
    if (newSelectedContacts.has(id)) {
      newSelectedContacts.delete(id)
    } else {
      newSelectedContacts.add(id)
    }
    return {
      ...state,
      selectedContacts: newSelectedContacts
    }
  }),
  
  selectAll: () => set((state) => {
    const filteredContacts = get().getFilteredContacts()
    return {
      ...state,
      selectedContacts: new Set(filteredContacts.map(c => c.id))
    }
  }),
  
  clearSelection: () => set((state) => ({
    ...state,
    selectedContacts: new Set()
  })),
  
  setSearchQuery: (searchQuery) => set((state) => ({
    ...state,
    searchQuery
  })),
  
  setFilters: (filters) => set((state) => ({
    ...state,
    filters: { ...state.filters, ...filters }
  })),
  
  setSorting: (sortBy, sortOrder) => set((state) => ({
    ...state,
    sortBy,
    sortOrder
  })),
  
  setLoading: (isLoading) => set((state) => ({
    ...state,
    isLoading
  })),
  
  setError: (error) => set((state) => ({
    ...state,
    error,
    isLoading: false
  })),
  
  setTotalCount: (count) => set((state) => ({
    ...state,
    totalCount: count
  })),
  
  optimisticUpdate: async (update, rollback, asyncAction) => {
    update()
    try {
      return await asyncAction()
    } catch (error) {
      rollback()
      throw error
    }
  },
  
  // Computed values
  getFilteredContacts: () => {
    const { contacts, searchQuery, filters, sortBy, sortOrder } = get()
    
    let filtered = [...contacts]
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(contact =>
        contact.firstName.toLowerCase().includes(query) ||
        contact.lastName.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone.includes(query) ||
        contact.company?.toLowerCase().includes(query)
      )
    }
    
    // Apply filters
    if (filters.status?.length) {
      filtered = filtered.filter(contact => filters.status!.includes(contact.status))
    }
    
    if (filters.leadScoreMin !== undefined) {
      filtered = filtered.filter(contact => contact.leadScore >= filters.leadScoreMin!)
    }
    
    if (filters.leadScoreMax !== undefined) {
      filtered = filtered.filter(contact => contact.leadScore <= filters.leadScoreMax!)
    }
    
    if (filters.tags?.length) {
      filtered = filtered.filter(contact => 
        filters.tags!.some(tag => contact.tags.includes(tag))
      )
    }
    
    if (filters.company?.length) {
      filtered = filtered.filter(contact => 
        filters.company!.includes(contact.company || '')
      )
    }
    
    if (filters.lastContactedWithin) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - filters.lastContactedWithin)
      filtered = filtered.filter(contact => 
        contact.lastContactedAt && contact.lastContactedAt >= cutoff
      )
    }
    
    if (filters.sentimentMin !== undefined) {
      filtered = filtered.filter(contact => 
        contact.sentiment !== undefined && contact.sentiment >= filters.sentimentMin!
      )
    }
    
    if (filters.sentimentMax !== undefined) {
      filtered = filtered.filter(contact => 
        contact.sentiment !== undefined && contact.sentiment <= filters.sentimentMax!
      )
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]
      
      if (aValue === bValue) return 0
      if (aValue === undefined || aValue === null) return 1
      if (bValue === undefined || bValue === null) return -1
      
      const comparison = aValue < bValue ? -1 : 1
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return filtered
  },
  
  getSelectedContacts: () => {
    const { contacts, selectedContacts } = get()
    return contacts.filter(contact => selectedContacts.has(contact.id))
  },
  
  getContactById: (id) => {
    const { contacts } = get()
    return contacts.find(contact => contact.id === id)
  },
})