import Link from 'next/link'
import { Phone, Brain, BarChart3, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Phone,
    title: 'AI-Powered Calling',
    description: 'Harper AI\'s Twilio-powered calling system doesn\'t just connect you—it learns from every interaction. Our AI analyzes tone, sentiment, and conversation patterns in real-time, giving your team superhuman sales abilities.',
    link: '/features#calling',
  },
  {
    icon: Brain,
    title: 'Conversation Intelligence',
    description: 'Our advanced sentiment analysis goes beyond keywords. Harper AI understands context, emotion, and buying signals, automatically surfacing the moments that matter most.',
    link: '/features#intelligence',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Stop drowning in spreadsheets. Harper AI\'s intelligent dashboard surfaces exactly what you need to know, when you need to know it. Track performance and forecast with confidence.',
    link: '/features#analytics',
  },
]

export default function Features() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Transform Every Conversation Into Revenue
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Harper AI combines real-time AI processing with enterprise-scale infrastructure, 
            delivering insights that actually drive revenue growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-300"
            >
              <div className="w-14 h-14 gradient-purple-pink rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {feature.description}
              </p>
              <Link
                href={feature.link}
                className="text-purple-600 font-medium inline-flex items-center hover:text-purple-700 transition-colors"
              >
                Learn more
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/features">
            <Button size="lg" className="gradient-purple-pink text-white">
              Explore All Features
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}