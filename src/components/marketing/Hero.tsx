import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Shield, Lock, Award } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white pt-20 pb-32">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Trust signals */}
          <div className="flex flex-wrap justify-center items-center gap-6 mb-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-600" />
              <span>GDPR Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-green-600" />
              <span>5M+ Calls Analyzed</span>
            </div>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Real-Time Sales Intelligence That Actually{' '}
            <span className="text-transparent bg-clip-text gradient-purple-pink">
              Understands Your Conversations
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed">
            Harper AI analyzes 100% of your sales calls with advanced AI, delivering instant insights 
            that help reps close more deals and managers coach at scale
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="gradient-purple-pink text-white px-8">
                Start Free 30-Day Trial
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline">
                Watch 3-Minute Demo
              </Button>
            </Link>
          </div>

          {/* No credit card text */}
          <p className="mt-4 text-sm text-gray-500">
            No credit card required • Set up in 5 minutes
          </p>
        </div>

        {/* Product preview */}
        <div className="mt-16 relative">
          <div className="relative mx-auto max-w-5xl">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Browser mockup header */}
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white rounded px-4 py-1 text-sm text-gray-600">
                      app.harperai.com/dashboard
                    </div>
                  </div>
                </div>
              </div>
              {/* Dashboard preview */}
              <div className="bg-gray-50 p-8 h-96 flex items-center justify-center">
                <p className="text-gray-400 text-lg">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}