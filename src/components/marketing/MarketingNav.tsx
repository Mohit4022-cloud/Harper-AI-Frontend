'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MarketingNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="w-8 h-8 gradient-purple-pink rounded-lg flex items-center justify-center mr-2">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Harper AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link href="/for-sdrs" className="text-gray-600 hover:text-gray-900 transition-colors">
              For SDRs
            </Link>
            <Link href="/for-managers" className="text-gray-600 hover:text-gray-900 transition-colors">
              For Managers
            </Link>
            <Link href="/security" className="text-gray-600 hover:text-gray-900 transition-colors">
              Security
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="gradient-purple-pink text-white">
                Start Free 30-Day Trial
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/features"
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Pricing
            </Link>
            <Link
              href="/for-sdrs"
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              For SDRs
            </Link>
            <Link
              href="/for-managers"
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              For Managers
            </Link>
            <Link
              href="/security"
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Security
            </Link>
            <div className="mt-4 px-3 space-y-2">
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link href="/register" className="block">
                <Button className="w-full gradient-purple-pink text-white">
                  Start Free 30-Day Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}