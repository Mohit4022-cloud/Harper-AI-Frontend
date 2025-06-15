import { Metadata } from 'next'
import Pricing from '@/components/marketing/Pricing'
import { Check, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Pricing - Harper AI Sales Intelligence Platform',
  description: 'Transparent pricing that scales with your team. Start with a 30-day free trial, no credit card required.',
}

const features = [
  { name: 'Calls per month', starter: 'Up to 1,000', professional: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Team members', starter: 'Up to 10', professional: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Real-time transcription', starter: true, professional: true, enterprise: true },
  { name: 'Basic analytics', starter: true, professional: true, enterprise: true },
  { name: 'Advanced AI insights', starter: false, professional: true, enterprise: true },
  { name: 'Sentiment analysis', starter: false, professional: true, enterprise: true },
  { name: 'Custom workflows', starter: false, professional: true, enterprise: true },
  { name: 'API access', starter: false, professional: true, enterprise: true },
  { name: 'CRM integrations', starter: 'Basic', professional: 'All', enterprise: 'Custom' },
  { name: 'Support', starter: 'Email', professional: 'Priority', enterprise: 'Dedicated CSM' },
  { name: 'Training', starter: 'Self-serve', professional: 'Group sessions', enterprise: 'Custom onboarding' },
  { name: 'SLA', starter: false, professional: '99.9%', enterprise: 'Custom' },
  { name: 'Security review', starter: false, professional: false, enterprise: true },
  { name: 'Custom AI models', starter: false, professional: false, enterprise: true },
  { name: 'White-label options', starter: false, professional: false, enterprise: true },
]

export default function PricingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              No hidden fees. No setup costs. Just results.
            </p>
            <div className="inline-flex items-center gap-4 text-gray-600">
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                30-day free trial
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Pricing />
        </div>
      </section>

      {/* Feature comparison */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Detailed Feature Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-gray-900">Features</th>
                  <th className="text-center p-4 font-medium text-gray-900">Starter</th>
                  <th className="text-center p-4 font-medium text-gray-900">
                    <span className="inline-flex items-center gap-2">
                      Professional
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                        Most Popular
                      </span>
                    </span>
                  </th>
                  <th className="text-center p-4 font-medium text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-4 text-gray-900">{feature.name}</td>
                    <td className="p-4 text-center">
                      {typeof feature.starter === 'boolean' ? (
                        feature.starter ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-600">{feature.starter}</span>
                      )}
                    </td>
                    <td className="p-4 text-center bg-purple-50/50">
                      {typeof feature.professional === 'boolean' ? (
                        feature.professional ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-600">{feature.professional}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof feature.enterprise === 'boolean' ? (
                        feature.enterprise ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-600">{feature.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect 
                at the start of your next billing cycle.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens after my free trial?
              </h3>
              <p className="text-gray-600">
                After your 30-day free trial, you'll be prompted to enter payment information 
                to continue using Harper AI. You won't be charged during the trial period.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer discounts for annual billing?
              </h3>
              <p className="text-gray-600">
                Yes! Save 20% when you pay annually. That's like getting over 2 months free.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What's your refund policy?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee. If you're not satisfied within your 
                first 30 days as a paying customer, we'll refund your payment in full.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Sales Process?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of teams already using Harper AI
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              Start Your 30-Day Free Trial
            </Button>
          </Link>
          <p className="mt-4 text-white/70 text-sm">
            No credit card required
          </p>
        </div>
      </section>
    </div>
  )
}