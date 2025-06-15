import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Target, TrendingUp, Clock, Shield, Zap, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'For SDRs - Harper AI Sales Intelligence Platform',
  description: 'Hit quota every quarter with AI that works as hard as you do. Automate repetitive tasks and focus on closing deals.',
}

const benefits = [
  {
    icon: Target,
    title: 'Never Miss Quota Again',
    description: 'AI-powered insights help you focus on the right prospects at the right time',
  },
  {
    icon: Clock,
    title: 'Save 3+ Hours Daily',
    description: 'Automate manual tasks like data entry, follow-ups, and call logging',
  },
  {
    icon: TrendingUp,
    title: 'Close Deals Faster',
    description: 'Real-time coaching helps you handle objections and close with confidence',
  },
  {
    icon: Shield,
    title: 'Beat Call Reluctance',
    description: 'AI provides talk tracks and confidence boosters before every call',
  },
]

const painPoints = [
  {
    problem: 'Spending hours on manual data entry',
    solution: 'Automatic call logging and CRM updates',
  },
  {
    problem: 'Not knowing what to say on calls',
    solution: 'Real-time talk tracks and objection handling',
  },
  {
    problem: 'Missing follow-ups with prospects',
    solution: 'Automated follow-up sequences that work',
  },
  {
    problem: 'Struggling to hit activity metrics',
    solution: 'Smart dialer that maximizes connect rates',
  },
]

export default function ForSDRsPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-50 to-pink-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Built for Sales Development Representatives
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Hit Quota Every Quarter with{' '}
              <span className="text-transparent bg-clip-text gradient-purple-pink">
                AI That Works as Hard as You Do
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Stop drowning in repetitive tasks. Harper AI handles the busywork so you can 
              focus on what you do best—building relationships and closing deals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button size="lg" className="gradient-purple-pink text-white px-8">
                  Start Free Trial - No Manager Approval Needed
                </Button>
              </Link>
              <Link href="#testimonial">
                <Button size="lg" variant="outline">
                  See How SDRs Use Harper
                </Button>
              </Link>
            </div>
            
            <p className="mt-4 text-sm text-gray-500">
              Join 10,000+ SDRs • Set up in 5 minutes • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Finally, AI That Actually Helps You Sell
            </h2>
            <p className="text-xl text-gray-600">
              Built by SDRs, for SDRs. We know what you need to succeed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 gradient-purple-pink rounded-xl flex items-center justify-center">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points & Solutions */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              We Solve Your Biggest Challenges
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {painPoints.map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="text-red-500 text-2xl">✗</div>
                  <div className="flex-1">
                    <p className="text-gray-500 line-through mb-2">{item.problem}</p>
                    <p className="text-gray-900 font-medium flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      {item.solution}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section id="testimonial" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 md:p-12">
            <blockquote className="text-2xl font-medium text-gray-900 mb-6">
              "Before Harper AI, I was spending 4 hours a day on admin work. Now I spend 
              that time actually selling. Hit 150% of quota last quarter and got promoted 
              to AE. This tool changed my career."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div>
                <p className="font-semibold text-gray-900">Michael Chen</p>
                <p className="text-gray-600">Former SDR, now Account Executive</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-gray-900">147%</p>
              <p className="text-gray-600">Average quota attainment</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">3.5hrs</p>
              <p className="text-gray-600">Saved per day</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">2.3x</p>
              <p className="text-gray-600">More meetings booked</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Started in Minutes
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 gradient-purple-pink rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connect Your Tools
              </h3>
              <p className="text-gray-600">
                One-click integration with your CRM and dialer
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 gradient-purple-pink rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Make Your First Call
              </h3>
              <p className="text-gray-600">
                AI starts learning your style immediately
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 gradient-purple-pink rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Watch Your Numbers Soar
              </h3>
              <p className="text-gray-600">
                See improvements in your metrics within days
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Stop Working Harder. Start Working Smarter.
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of SDRs who are crushing quota with Harper AI
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              Start Free Trial - No Manager Approval Needed
            </Button>
          </Link>
          <p className="mt-4 text-white/70 text-sm">
            30-day free trial • No credit card • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  )
}