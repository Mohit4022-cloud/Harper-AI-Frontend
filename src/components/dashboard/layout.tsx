'use client'

import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-64 bg-muted/40 md:block">
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-4">
              <h2 className="text-lg font-semibold">Harper AI</h2>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              <a href="/dashboard" className="flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                Dashboard
              </a>
              <a href="/contacts" className="flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                Contacts
              </a>
              <a href="/calls" className="flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                Calls
              </a>
              <a href="/campaigns" className="flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                Campaigns
              </a>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}