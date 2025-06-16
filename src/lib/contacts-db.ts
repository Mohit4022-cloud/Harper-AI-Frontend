import { Contact } from '@/types/contact'

// Initialize the contacts database if it doesn't exist
if (!global.contactsDb) {
  global.contactsDb = []
}

// Export getter and setter functions to interact with the database
export function getContactsDb(): Contact[] {
  return global.contactsDb
}

export function setContactsDb(contacts: Contact[]): void {
  global.contactsDb = contacts
}

// Helper functions for common operations
export function findContactById(id: string): Contact | undefined {
  return global.contactsDb.find(c => c.id === id)
}

export function findContactByEmail(email: string): Contact | undefined {
  return global.contactsDb.find(c => c.email === email)
}

export function addContact(contact: Contact): void {
  global.contactsDb.push(contact)
}

export function updateContact(id: string, updatedContact: Contact): boolean {
  const index = global.contactsDb.findIndex(c => c.id === id)
  if (index === -1) return false
  
  global.contactsDb[index] = updatedContact
  return true
}

export function deleteContact(id: string): Contact | null {
  const index = global.contactsDb.findIndex(c => c.id === id)
  if (index === -1) return null
  
  return global.contactsDb.splice(index, 1)[0]
}