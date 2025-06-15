import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DollarSign, Clock, Users, Zap, Target, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'For Small Business - Harper AI Sales Intelligence Platform',
  description: 'Enterprise-grade sales AI at small business prices. Set up in 5 minutes, see results in days. No complex implementation required.',
}

const benefits = [
  {
    icon: DollarSign,
    title: 'Affordable Pricing',
    description: 'Start at just $49/user per month. No hidden fees or setup costs.',
  },
  {
    icon: Clock,
    title: '5-Minute Setup',
    description: 'No IT team needed. Connect your tools and start calling immediately.',
  },
  {
    icon: Users,
    title: 'Scales With You',
    description: 'Whether you have 2 reps or 20, Harper AI grows with your business.',
  },
  {
    icon: Zap,
    title: 'Instant Impact',
    description: 'See improvements in your metrics within the first week.',
  },
]

const comparison = [
  {
    feature: 'Setup time',
    enterprise: '3-6 months',
    harper: '5 minutes',
  },
  {
    feature: 'Minimum seats',
    enterprise: '50+',
    harper: 'Just 1',
  },
  {
    feature: 'Implementation cost',
    enterprise: '$50,000+',
    harper: 'Free',
  },
  {
    feature: 'Time to value',
    enterprise: '6+ months',
    harper: '1 week',
  },
]

export default function SmallBusinessPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Perfect for Growing Teams
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Enterprise-Grade Sales AI at{' '}
              <span className="text-transparent bg-clip-text gradient-purple-pink">
                Small Business Prices
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Don't let the big guys have all the advantages. Harper AI gives you the same 
              powerful tools Fortune 500 companies use—without the Fortune 500 price tag.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button size="lg" className="gradient-purple-pink text-white px-8">
                  Try Free for 14 Days - No Credit Card
                </Button>
              </Link>
              <Link href="#pricing">
                <Button size="lg" variant="outline">
                  See Simple Pricing
                </Button>
              </Link>
            </div>
            
            <p className="mt-4 text-sm text-gray-500">
              Join 1,000+ small businesses • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Big Business Tools, Small Business Friendly
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to compete with the giants
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

      {/* Comparison Table */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Small Businesses Choose Harper AI
            </h2>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-4 font-medium text-gray-900"></th>
                  <th className="text-center p-4 font-medium text-gray-900">
                    Traditional Enterprise Tools
                  </th>
                  <th className="text-center p-4 font-medium text-gray-900">
                    <span className="text-purple-600">Harper AI</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-4 font-medium text-gray-900">{item.feature}</td>
                    <td className="p-4 text-center text-gray-600">{item.enterprise}</td>
                    <td className="p-4 text-center text-green-600 font-medium">{item.harper}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Small Teams, Big Results
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-purple-600" />
                <p className="font-semibold text-gray-900">Local SaaS Startup</p>
              </div>
              <p className="text-3xl font-bold text-purple-600 mb-2">210%</p>
              <p className="text-gray-600">Increase in qualified meetings</p>
              <p className="text-sm text-gray-500 mt-4">"We're competing with companies 10x our size now"</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <p className="font-semibold text-gray-900">B2B Service Company</p>
              </div>
              <p className="text-3xl font-bold text-purple-600 mb-2">$2.1M</p>
              <p className="text-gray-600">Additional revenue in 6 months</p>
              <p className="text-sm text-gray-500 mt-4">"Harper AI paid for itself in the first week"</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-600" />
                <p className="font-semibold text-gray-900">Growing Agency</p>
              </div>
              <p className="text-3xl font-bold text-purple-600 mb-2">5→25</p>
              <p className="text-gray-600">Team growth in 12 months</p>
              <p className="text-sm text-gray-500 mt-4">"Scaled our sales without scaling complexity"</p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pricing That Makes Sense
            </h2>
            <p className="text-xl text-gray-600">
              No complex tiers. No hidden fees. Just pick and grow.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter Plan</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-gray-900">$49</span>
                <span className="text-gray-600">/user/month</span>
              </div>
              <p className="text-gray-600 mt-2">Perfect for teams under 10</p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-700">Up to 1,000 calls/month</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-700">All core features included</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-700">Email support & documentation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-700">No setup fees or minimums</span>
              </div>
            </div>
            
            <Link href="/register" className="block">
              <Button className="w-full gradient-purple-pink text-white" size="lg">
                Start Your 14-Day Free Trial
              </Button>
            </Link>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              No credit card required • Upgrade anytime
            </p>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Need more? Check out our{' '}
              <Link href="/pricing" className="text-purple-600 font-medium hover:text-purple-700">
                Professional and Enterprise plans
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Level the Playing Field
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Give your small team the superpowers they deserve
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                Start Free 14-Day Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Talk to a Small Business Specialist
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-white/70 text-sm">
            Average setup time: 5 minutes • No technical skills required
          </p>
        </div>
      </section>
    </div>
  )
}