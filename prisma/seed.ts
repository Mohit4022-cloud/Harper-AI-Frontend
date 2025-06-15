import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@harperai.com' },
    update: {},
    create: {
      email: 'admin@harperai.com',
      name: 'Harper Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  })
  console.log('✅ Created admin user')

  // Create demo team
  const team = await prisma.team.upsert({
    where: { slug: 'demo-team' },
    update: {},
    create: {
      name: 'Demo Team',
      slug: 'demo-team',
      ownerId: admin.id,
      plan: 'PROFESSIONAL',
      features: ['unlimited-calls', 'ai-coaching', 'advanced-analytics', 'api-access'],
      settings: {
        workingHours: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
        },
        callRecording: true,
        voicemail: true,
        autoDialer: true,
      },
    },
  })
  console.log('✅ Created demo team')

  // Add admin to team
  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: admin.id,
      role: 'OWNER',
    },
  })

  // Create sample users
  const users = []
  for (let i = 0; i < 5; i++) {
    const userPassword = await hash('user123', 12)
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        name: faker.person.fullName(),
        passwordHash: userPassword,
        role: 'USER',
        status: 'ACTIVE',
        avatar: faker.image.avatar(),
      },
    })
    users.push(user)

    // Add users to team
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: faker.helpers.arrayElement(['ADMIN', 'MEMBER']),
      },
    })
  }
  console.log(`✅ Created ${users.length} sample users`)

  // Create contacts
  const contacts = []
  const contactStatuses = ['ACTIVE', 'INACTIVE'] as const
  const sources = ['Website', 'LinkedIn', 'Referral', 'Cold Outreach', 'Event', 'Import']
  const tags = ['lead', 'customer', 'prospect', 'partner', 'vip', 'nurture', 'qualified']

  for (let i = 0; i < 1000; i++) {
    const contact = await prisma.contact.create({
      data: {
        teamId: team.id,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number(),
        company: faker.company.name(),
        jobTitle: faker.person.jobTitle(),
        status: faker.helpers.arrayElement(contactStatuses),
        source: faker.helpers.arrayElement(sources),
        score: faker.number.int({ min: 0, max: 100 }),
        tags: faker.helpers.arrayElements(tags, { min: 0, max: 3 }),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zip: faker.location.zipCode(),
          country: faker.location.country(),
        },
        socialProfiles: {
          linkedin: faker.helpers.maybe(() => `https://linkedin.com/in/${faker.internet.userName()}`, { probability: 0.7 }),
          twitter: faker.helpers.maybe(() => `https://twitter.com/${faker.internet.userName()}`, { probability: 0.3 }),
        },
        customFields: {
          industry: faker.company.buzzNoun(),
          employeeCount: faker.helpers.arrayElement(['1-10', '11-50', '51-200', '201-500', '500+']),
          annualRevenue: faker.helpers.arrayElement(['< $1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '> $100M']),
        },
        lastContactAt: faker.date.recent({ days: 30 }),
      },
    })
    contacts.push(contact)
  }
  console.log(`✅ Created ${contacts.length} contacts`)

  // Create calls
  const callTypes = ['VOICE', 'VIDEO'] as const
  const callDirections = ['INBOUND', 'OUTBOUND'] as const
  const callStatuses = ['COMPLETED', 'MISSED', 'VOICEMAIL'] as const
  const sentiments = ['positive', 'neutral', 'negative']

  for (let i = 0; i < 500; i++) {
    const user = faker.helpers.arrayElement([admin, ...users])
    const contact = faker.helpers.arrayElement(contacts)
    const startTime = faker.date.recent({ days: 7 })
    const duration = faker.number.int({ min: 30, max: 600 })
    
    await prisma.call.create({
      data: {
        teamId: team.id,
        contactId: contact.id,
        userId: user.id,
        type: faker.helpers.arrayElement(callTypes),
        direction: faker.helpers.arrayElement(callDirections),
        status: faker.helpers.arrayElement(callStatuses),
        duration,
        from: faker.helpers.arrayElement([faker.phone.number(), '+1-800-HARPER']),
        to: faker.helpers.arrayElement([contact.phone || faker.phone.number(), '+1-800-HARPER']),
        recordingUrl: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.8 }),
        recordingDuration: duration,
        sentiment: faker.helpers.arrayElement(sentiments),
        summary: {
          keyPoints: faker.helpers.arrayElements([
            'Discussed pricing options',
            'Scheduled follow-up meeting',
            'Interested in enterprise plan',
            'Requested product demo',
            'Asked about integration options',
            'Concerns about implementation timeline',
          ], { min: 2, max: 4 }),
          nextSteps: faker.helpers.arrayElements([
            'Send proposal',
            'Schedule demo',
            'Follow up next week',
            'Send case studies',
            'Connect with technical team',
          ], { min: 1, max: 3 }),
        },
        startedAt: startTime,
        endedAt: new Date(startTime.getTime() + duration * 1000),
      },
    })
  }
  console.log('✅ Created 500 sample calls')

  // Create campaigns
  const campaignTypes = ['CALLING', 'SMS', 'EMAIL', 'MULTI_CHANNEL'] as const
  const campaignStatuses = ['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED'] as const

  for (let i = 0; i < 10; i++) {
    const campaign = await prisma.campaign.create({
      data: {
        teamId: team.id,
        name: faker.company.catchPhrase(),
        description: faker.lorem.paragraph(),
        type: faker.helpers.arrayElement(campaignTypes),
        status: faker.helpers.arrayElement(campaignStatuses),
        settings: {
          maxAttemptsPerContact: 3,
          timeBetweenAttempts: 24,
          dailyCallLimit: 100,
          workingHours: {
            start: '09:00',
            end: '17:00',
          },
        },
        metrics: {
          totalContacts: faker.number.int({ min: 50, max: 500 }),
          contactsReached: faker.number.int({ min: 30, max: 400 }),
          conversions: faker.number.int({ min: 5, max: 50 }),
          avgCallDuration: faker.number.int({ min: 120, max: 300 }),
        },
        startDate: faker.date.recent({ days: 30 }),
        endDate: faker.date.future({ years: 0.1 }),
      },
    })

    // Add contacts to campaign
    const campaignContacts = faker.helpers.arrayElements(contacts, { min: 20, max: 100 })
    for (const contact of campaignContacts) {
      await prisma.campaignContact.create({
        data: {
          campaignId: campaign.id,
          contactId: contact.id,
          status: faker.helpers.arrayElement(['PENDING', 'COMPLETED', 'FAILED', 'SKIPPED']),
          attempts: faker.number.int({ min: 0, max: 3 }),
          lastAttemptAt: faker.helpers.maybe(() => faker.date.recent({ days: 7 }), { probability: 0.7 }),
        },
      })
    }
  }
  console.log('✅ Created 10 campaigns with contacts')

  // Create activities
  const activityTypes = [
    'CALL_PLACED',
    'CALL_RECEIVED',
    'EMAIL_SENT',
    'NOTE_ADDED',
    'CONTACT_UPDATED',
  ] as const

  for (let i = 0; i < 2000; i++) {
    const user = faker.helpers.arrayElement([admin, ...users])
    const contact = faker.helpers.arrayElement(contacts)
    const activityType = faker.helpers.arrayElement(activityTypes)
    
    await prisma.activity.create({
      data: {
        teamId: team.id,
        contactId: contact.id,
        userId: user.id,
        type: activityType,
        title: getActivityTitle(activityType),
        description: faker.lorem.sentence(),
        metadata: getActivityMetadata(activityType),
        createdAt: faker.date.recent({ days: 30 }),
      },
    })
  }
  console.log('✅ Created 2000 activities')

  // Create webhooks
  await prisma.webhook.create({
    data: {
      teamId: team.id,
      url: 'https://example.com/webhooks/harperai',
      events: ['call.completed', 'contact.created', 'contact.updated'],
      secret: faker.string.alphanumeric(32),
      active: true,
      description: 'Main CRM integration webhook',
    },
  })
  console.log('✅ Created sample webhook')

  // Create API key
  await prisma.apiKey.create({
    data: {
      teamId: team.id,
      name: 'Production API Key',
      key: `harpai_${faker.string.alphanumeric(32)}`,
      permissions: ['contacts:read', 'contacts:write', 'calls:read', 'campaigns:read'],
    },
  })
  console.log('✅ Created sample API key')

  console.log('\n🎉 Database seed completed successfully!')
}

function getActivityTitle(type: string): string {
  const titles = {
    CALL_PLACED: 'Outbound call placed',
    CALL_RECEIVED: 'Inbound call received',
    EMAIL_SENT: 'Email sent',
    NOTE_ADDED: 'Note added',
    CONTACT_UPDATED: 'Contact information updated',
  }
  return titles[type] || 'Activity'
}

function getActivityMetadata(type: string): any {
  switch (type) {
    case 'CALL_PLACED':
    case 'CALL_RECEIVED':
      return {
        duration: faker.number.int({ min: 30, max: 600 }),
        outcome: faker.helpers.arrayElement(['connected', 'voicemail', 'no_answer']),
      }
    case 'EMAIL_SENT':
      return {
        subject: faker.lorem.sentence(),
        template: faker.helpers.arrayElement(['follow_up', 'introduction', 'proposal']),
      }
    case 'NOTE_ADDED':
      return {
        content: faker.lorem.paragraph(),
      }
    default:
      return {}
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })