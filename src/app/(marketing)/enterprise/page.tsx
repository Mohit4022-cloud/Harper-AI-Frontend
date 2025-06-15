import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Building2, Shield, Globe, Gauge, Lock, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Enterprise - Harper AI Sales Intelligence Platform',
  description: 'The Revenue Intelligence Platform Built for Scale. Enterprise-grade security, unlimited scalability, and white-glove support.',
}

const features = [
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description: 'SOC 2 Type II, GDPR, CCPA compliant. Your data never leaves your environment.',
  },
  {
    icon: Globe,
    title: 'Global Scale & Performance',
    description: 'Handle millions of calls across multiple regions with 99.99% uptime SLA.',
  },
  {
    icon: Lock,
    title: 'Advanced Access Controls',
    description: 'SAML SSO, RBAC, and audit logs. Complete control over data access.',
  },
  {
    icon: Users,
    title: 'White-Glove Support',
    description: 'Dedicated customer success team, 24/7 support, and quarterly business reviews.',
  },
  {
    icon: Gauge,
    title: 'Custom AI Models',
    description: 'Train models on your data for industry-specific insights and terminology.',
  },
  {
    icon: Building2,
    title: 'Flexible Deployment',
    description: 'Cloud, on-premise, or hybrid. Deploy Harper AI your way.',
  },
]

const logos = [
  'Fortune 500 Company 1',
  'Fortune 500 Company 2',
  'Fortune 500 Company 3',
  'Fortune 500 Company 4',
  'Fortune 500 Company 5',
  'Fortune 500 Company 6',
]

export default function EnterprisePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
              <Building2 className="w-4 h-4" />
              Enterprise Solution
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              The Revenue Intelligence Platform{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Built for Scale
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Transform your global sales organization with AI that meets the most demanding 
              enterprise requirements. Security, scalability, and support you can trust.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/contact?type=enterprise">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                  Schedule Executive Briefing
                </Button>
              </Link>
              <Link href="#security">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  View Security Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 uppercase tracking-wider mb-8">
            Trusted by Fortune 500 companies
          </p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center">
            {logos.map((logo, index) => (
              <div key={index} className="bg-white rounded-lg p-6 flex items-center justify-center h-20 shadow-sm">
                <span className="text-gray-400 text-sm">{logo}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold text-gray-900">10M+</p>
              <p className="text-gray-600 mt-2">Calls analyzed daily</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-gray-900">99.99%</p>
              <p className="text-gray-600 mt-2">Uptime SLA</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-gray-900">50ms</p>
              <p className="text-gray-600 mt-2">Average latency</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-gray-900">42%</p>
              <p className="text-gray-600 mt-2">Average revenue lift</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Enterprise-Ready From Day One
            </h2>
            <p className="text-xl text-gray-600">
              Built to meet the needs of the world's largest sales organizations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 gradient-purple-pink rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section id="security" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Security & Compliance You Can Trust
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Harper AI maintains the highest standards of security and compliance, 
                ensuring your data is protected at every level.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">SOC 2 Type II</h4>
                  <p className="text-sm text-gray-600">Annual audit</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">GDPR Compliant</h4>
                  <p className="text-sm text-gray-600">Full compliance</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">CCPA Ready</h4>
                  <p className="text-sm text-gray-600">California compliant</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">ISO 27001</h4>
                  <p className="text-sm text-gray-600">Certified</p>
                </div>
              </div>
              
              <Link href="/security" className="inline-flex items-center text-purple-600 font-medium mt-6 hover:text-purple-700">
                View full security documentation →
              </Link>
            </div>
            
            <div className="bg-gray-100 rounded-2xl p-8 h-96 flex items-center justify-center">
              <span className="text-gray-400">Security Architecture Diagram</span>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Ecosystem */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Seamlessly Integrates With Your Tech Stack
            </h2>
            <p className="text-xl text-gray-600">
              Pre-built integrations with all major enterprise platforms
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {['Salesforce', 'HubSpot', 'Microsoft Teams', 'Slack', 'Zoom', 'Gong', 'Outreach', 'Salesloft'].map((integration) => (
              <div key={integration} className="bg-white rounded-lg p-6 text-center shadow-sm">
                <p className="text-gray-600">{integration}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Plus custom integrations via our enterprise API
            </p>
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 md:p-12">
            <div className="text-center mb-8">
              <p className="text-purple-600 font-medium mb-2">Case Study</p>
              <h3 className="text-2xl font-bold text-gray-900">
                How TechCorp Increased Revenue 42% with Harper AI
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">42%</p>
                <p className="text-gray-600">Revenue increase</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">67%</p>
                <p className="text-gray-600">Faster ramp time</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">3.2x</p>
                <p className="text-gray-600">ROI in year one</p>
              </div>
            </div>
            
            <blockquote className="text-lg text-gray-700 italic">
              "Harper AI transformed our global sales organization. The insights we get 
              are game-changing, and the platform scales effortlessly across our 2,000+ reps."
            </blockquote>
            <p className="text-gray-600 mt-4">
              — Global VP of Sales, TechCorp
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Sales Organization?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Let's discuss how Harper AI can drive predictable revenue growth for your enterprise
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact?type=enterprise">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                Schedule Executive Briefing
              </Button>
            </Link>
            <Link href="/contact?type=poc">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Request Proof of Concept
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-gray-400 text-sm">
            Typical POC: 30 days • Full implementation: 60-90 days
          </p>
        </div>
      </section>
    </div>
  )
}