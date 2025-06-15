import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const plans = [
  {
    name: 'Starter',
    subtitle: 'For growing teams',
    price: '$49',
    unit: '/user/month',
    features: [
      'Up to 1,000 calls/month',
      'Basic analytics & reporting',
      'Email support',
      'Core integrations',
      '14-day free trial',
    ],
    cta: 'Start Free Trial',
    href: '/register?plan=starter',
    popular: false,
  },
  {
    name: 'Professional',
    subtitle: 'For scaling teams',
    price: '$99',
    unit: '/user/month',
    features: [
      'Unlimited calls',
      'Advanced analytics & AI insights',
      'Priority support',
      'All integrations',
      'Custom workflows',
      '30-day free trial',
    ],
    cta: 'Start Free Trial',
    href: '/register?plan=professional',
    popular: true,
  },
  {
    name: 'Enterprise',
    subtitle: 'For large organizations',
    price: 'Custom',
    unit: '',
    features: [
      'Unlimited everything',
      'Custom AI models',
      'Dedicated customer success',
      'Custom integrations',
      'SLA & security review',
      'Proof of concept available',
    ],
    cta: 'Contact Sales',
    href: '/contact?type=enterprise',
    popular: false,
  },
]

export default function Pricing() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Transparent Pricing That Scales With You
          </h2>
          <p className="text-xl text-gray-600">
            No hidden fees. No setup costs. Just results.
          </p>
          <p className="mt-4 text-gray-600">
            Save 20% with annual billing • 30-day money-back guarantee
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 ${
                plan.popular ? 'ring-2 ring-purple-600' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-600 mt-1">{plan.subtitle}</p>

                <div className="mt-6 flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-1">{plan.unit}</span>
                </div>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href} className="block mt-8">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'gradient-purple-pink text-white'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/pricing" className="text-purple-600 font-medium hover:text-purple-700">
            See detailed feature comparison →
          </Link>
        </div>
      </div>
    </section>
  )
}