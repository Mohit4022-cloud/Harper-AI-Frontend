import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, Target, BarChart3, Shield, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'For Sales Managers - Harper AI Sales Intelligence Platform', 
  description: 'Scale your best performer across your entire team. Coach at scale, reduce performance variability, and hit your numbers predictably.',
}

const benefits = [
  {
    icon: Users,
    title: 'Coach Your Entire Team at Scale',
    description: 'AI surfaces coaching opportunities from every call, so you can help every rep improve',
  },
  {
    icon: TrendingUp,
    title: 'Predictable Revenue Growth',
    description: 'AI-powered forecasting helps you spot risks early and course-correct in real-time',
  },
  {
    icon: Target,
    title: 'Reduce Performance Variability',
    description: 'Turn your C-players into B-players and B-players into A-players with data-driven coaching',
  },
  {
    icon: BarChart3,
    title: 'Board-Ready Reporting',
    description: 'Beautiful, accurate reports that tell the story of your team\'s success',
  },
]

const challenges = [
  {
    challenge: 'Can\'t listen to every call',
    solution: 'AI analyzes 100% of calls and surfaces key moments',
  },
  {
    challenge: 'Reps making the same mistakes',
    solution: 'Pattern detection identifies systemic issues instantly',
  },
  {
    challenge: 'Forecasting is always wrong',
    solution: 'AI predictions based on actual conversation data',
  },
  {
    challenge: 'Top performer knowledge isn\'t shared',
    solution: 'Automatically capture and distribute winning tactics',
  },
]

export default function ForManagersPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Built for Sales Managers & Leaders
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Scale Your Best Performer{' '}
              <span className="text-transparent bg-clip-text gradient-purple-pink">
                Across Your Entire Team
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Stop flying blind. Harper AI gives you X-ray vision into every call, every deal, 
              and every rep's performance. Coach at scale and hit your number predictably.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/contact?demo=true">
                <Button size="lg" className="gradient-purple-pink text-white px-8">
                  See Team Performance Demo
                </Button>
              </Link>
              <Link href="#roi">
                <Button size="lg" variant="outline">
                  Calculate Your ROI
                </Button>
              </Link>
            </div>
            
            <p className="mt-4 text-sm text-gray-500">
              Trusted by 500+ sales leaders • See results in 2 weeks
            </p>
          </div>
        </div>
      </section>

      {/* Key Stats */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-purple-600">87%</p>
              <p className="text-gray-600 mt-1">Improvement in forecast accuracy</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-purple-600">3.2x</p>
              <p className="text-gray-600 mt-1">More coaching delivered</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-purple-600">41%</p>
              <p className="text-gray-600 mt-1">Reduction in rep ramp time</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-purple-600">28%</p>
              <p className="text-gray-600 mt-1">Increase in team quota attainment</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Finally See What's Really Happening
            </h2>
            <p className="text-xl text-gray-600">
              Transform from reactive firefighting to proactive coaching
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

      {/* Challenges & Solutions */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Biggest Management Challenges, Solved
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {challenges.map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="text-red-500 text-2xl">✗</div>
                  <div className="flex-1">
                    <p className="text-gray-500 line-through mb-2">{item.challenge}</p>
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

      {/* Dashboard Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Command Center for Sales Excellence
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to manage, coach, and scale your team
            </p>
          </div>
          
          <div className="bg-gray-100 rounded-2xl p-8 h-96 flex items-center justify-center">
            <span className="text-gray-400">Manager Dashboard Preview</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Team Performance
              </h3>
              <p className="text-gray-600">
                See individual and team metrics at a glance
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Coaching Opportunities
              </h3>
              <p className="text-gray-600">
                AI identifies who needs help and what to focus on
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Revenue Forecasting
              </h3>
              <p className="text-gray-600">
                Predictive analytics based on actual call data
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section id="roi" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Calculate Your ROI
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of SDRs on your team
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Average quota per SDR (monthly)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="$50,000"
                />
              </div>
              
              <div className="pt-6 border-t">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Estimated annual revenue increase:</p>
                  <p className="text-4xl font-bold text-purple-600">$1.68M</p>
                  <p className="text-sm text-gray-600 mt-2">Based on average 28% improvement</p>
                </div>
              </div>
              
              <Link href="/contact?type=roi" className="block">
                <Button className="w-full gradient-purple-pink text-white">
                  Get Detailed ROI Report
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 md:p-12">
            <blockquote className="text-2xl font-medium text-gray-900 mb-6">
              "Harper AI gave me superpowers as a manager. I went from spending 20 hours 
              a week in spreadsheets to actually coaching my team. We hit 118% of target 
              last quarter—first time in company history."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div>
                <p className="font-semibold text-gray-900">Jennifer Martinez</p>
                <p className="text-gray-600">VP of Sales, ScaleUp Inc.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Build a World-Class Sales Team?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            See how Harper AI can transform your team's performance in just 30 minutes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact?demo=true">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                Schedule Executive Demo
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Start 30-Day Pilot
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-white/70 text-sm">
            Quick 30-min demo • See your team's potential • No commitment
          </p>
        </div>
      </section>
    </div>
  )
}