import { Contact } from './contact'
import { UserSettings } from './settings'
import { PrismaClient } from '@prisma/client'

declare global {
  var contactsDb: Contact[]
  var userSettings: Map<string, UserSettings>
  var prisma: PrismaClient | undefined
}

export {}