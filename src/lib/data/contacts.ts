// Contacts data fetching functions
export type ContactStats = {
  total: number
  active: number
  prospects: number
  customers: number
}

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function fetchContactStats(): Promise<ContactStats> {
  // Simulate API call with delay
  await delay(500)
  
  // In a real app, this would fetch from your API
  return {
    total: 156,
    active: 89,
    prospects: 45,
    customers: 67,
  }
}