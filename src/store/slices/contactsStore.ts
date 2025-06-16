import { create } from 'zustand'
import { Contact, CreateContact } from '@/types/contact'

interface ContactsState {
  contacts: Contact[]
  loading: boolean
  error: string | null
  
  // Actions
  loadContacts: () => Promise<void>
  addContact: (contact: CreateContact) => Promise<void>
  updateContact: (contact: Partial<Contact> & { id: string }) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  
  // Helpers
  getContactById: (id: string) => Contact | undefined
  searchContacts: (query: string) => Contact[]
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  loading: false,
  error: null,

  loadContacts: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/contacts')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load contacts')
      }
      
      set({ contacts: data.data, loading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load contacts',
        loading: false 
      })
    }
  },

  addContact: async (contact: CreateContact) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add contact')
      }
      
      set(state => ({ 
        contacts: [...state.contacts, data.data],
        loading: false 
      }))
      
      return data.data
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add contact',
        loading: false 
      })
      throw error
    }
  },

  updateContact: async (contact: Partial<Contact> & { id: string }) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update contact')
      }
      
      set(state => ({
        contacts: state.contacts.map(c => 
          c.id === contact.id ? data.data : c
        ),
        loading: false
      }))
      
      return data.data
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update contact',
        loading: false 
      })
      throw error
    }
  },

  deleteContact: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete contact')
      }
      
      set(state => ({
        contacts: state.contacts.filter(c => c.id !== id),
        loading: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete contact',
        loading: false 
      })
      throw error
    }
  },

  getContactById: (id: string) => {
    return get().contacts.find(c => c.id === id)
  },

  searchContacts: (query: string) => {
    const lowerQuery = query.toLowerCase()
    return get().contacts.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.email.toLowerCase().includes(lowerQuery) ||
      c.company?.toLowerCase().includes(lowerQuery) ||
      c.phone.includes(query)
    )
  },
}))