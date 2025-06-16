import { Contact } from './contact'
import { UserSettings } from './settings'
import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var contactsDb: Contact[]
  // eslint-disable-next-line no-var
  var userSettings: Map<string, UserSettings>
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export {}