import { Users, Zap, Target, Shield } from 'lucide-react'

const differentiators = [
  {
    icon: Users,
    title: '5M+ Contact Capacity',
    description: 'Never worry about scaling your outreach again',
  },
  {
    icon: Zap,
    title: 'Real-Time AI Processing',
    description: 'Get insights during calls, not days later',
  },
  {
    icon: Target,
    title: '95% Transcription Accuracy',
    description: 'Trust every word with OpenAI Whisper technology',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption and JWT authentication',
  },
]

export default function KeyDifferentiators() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {differentiators.map((item, index) => (
            <div
              key={index}
              className="text-center group hover:scale-105 transition-transform duration-200"
            >
              <div className="mx-auto w-16 h-16 gradient-purple-pink rounded-2xl flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow">
                <item.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}