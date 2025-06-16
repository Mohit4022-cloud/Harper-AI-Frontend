import { UserSettings, defaultUserSettings } from '@/types/settings'

// Initialize the settings database if it doesn't exist
if (!global.userSettings) {
  global.userSettings = new Map<string, UserSettings>()
}

// Export getter and setter functions to interact with the database
export function getUserSettings(userId: string): UserSettings {
  const settings = global.userSettings.get(userId)
  return settings || { ...defaultUserSettings }
}

export function setUserSettings(userId: string, settings: UserSettings): void {
  global.userSettings.set(userId, settings)
}

export function updateUserSettings(userId: string, updates: Partial<UserSettings>): UserSettings {
  const currentSettings = getUserSettings(userId)
  const updatedSettings = { ...currentSettings, ...updates }
  setUserSettings(userId, updatedSettings)
  return updatedSettings
}

export function deleteUserSettings(userId: string): boolean {
  return global.userSettings.delete(userId)
}

// For backward compatibility with the original implementation
export function getDefaultUserSettings(): UserSettings {
  return getUserSettings('default')
}

export function setDefaultUserSettings(settings: UserSettings): void {
  setUserSettings('default', settings)
}