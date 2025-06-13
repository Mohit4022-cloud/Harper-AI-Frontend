import { User, Contact, Call, Email, DashboardMetrics } from '@/types'

// Mock Users Database
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@harperai.com',
    name: 'Admin User',
    avatar: '',
    role: 'org_admin',
    organizationId: 'org1',
    teamId: 'team1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    email: 'sdr@harperai.com',
    name: 'SDR User',
    avatar: '',
    role: 'sdr',
    organizationId: 'org1',
    teamId: 'team1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    email: 'demo@harperai.com',
    name: 'Demo User',
    avatar: '',
    role: 'sdr',
    organizationId: 'org1',
    teamId: 'team1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

// Mock Contacts Database
export const mockContacts: Contact[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@acmecorp.com',
    phone: '+1-555-0123',
    company: 'Acme Corporation',
    title: 'VP of Sales',
    industry: 'Technology',
    leadScore: 85,
    status: 'qualified',
    source: 'Website',
    assignedTo: '2',
    tags: ['hot-lead', 'enterprise'],
    notes: [],
    activities: [],
    customFields: {},
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@techstart.com',
    phone: '+1-555-0456',
    company: 'TechStart Inc',
    title: 'CTO',
    industry: 'SaaS',
    leadScore: 92,
    status: 'new',
    source: 'LinkedIn',
    assignedTo: '2',
    tags: ['decision-maker', 'saas'],
    notes: [],
    activities: [],
    customFields: {},
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Davis',
    email: 'mike.davis@growthco.com',
    phone: '+1-555-0789',
    company: 'Growth Co',
    title: 'Head of Marketing',
    industry: 'Marketing',
    leadScore: 78,
    status: 'contacted',
    source: 'Referral',
    assignedTo: '2',
    tags: ['warm-lead', 'marketing'],
    notes: [],
    activities: [],
    customFields: {},
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-22'),
  },
]

// Mock Dashboard Metrics
export const mockMetrics: DashboardMetrics = {
  totalCalls: 156,
  callsToday: 24,
  callConnectRate: 68.5,
  averageCallDuration: 245, // seconds
  emailsSent: 89,
  emailOpenRate: 34.2,
  emailReplyRate: 12.8,
  leadsGenerated: 18,
  dealsWon: 5,
  revenue: 24500,
  lastUpdated: new Date(),
}

// Helper function to find user by email
export function findUserByEmail(email: string): User | undefined {
  return mockUsers.find(user => user.email === email)
}

// Helper function to validate password (mock - always returns true for demo)
export function validatePassword(email: string, password: string): boolean {
  // In a real app, you'd hash and compare passwords
  // For demo purposes, any password works
  const user = findUserByEmail(email)
  return !!user && password.length >= 6
}

// Generate mock call data
export function generateMockCalls(userId: string, count: number = 10): Call[] {
  const calls: Call[] = []
  const contacts = mockContacts.slice(0, 3) // Use first 3 contacts
  
  for (let i = 0; i < count; i++) {
    const contact = contacts[i % contacts.length]
    const startDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
    const duration = Math.floor(Math.random() * 600) + 30 // 30-630 seconds
    
    calls.push({
      id: `call-${i + 1}`,
      contactId: contact.id,
      userId,
      phoneNumber: contact.phone || '+1-555-0000',
      direction: Math.random() > 0.7 ? 'inbound' : 'outbound',
      status: 'completed',
      duration,
      startedAt: startDate,
      endedAt: new Date(startDate.getTime() + duration * 1000),
      notes: `Call with ${contact.firstName} ${contact.lastName}`,
    })
  }
  
  return calls
}