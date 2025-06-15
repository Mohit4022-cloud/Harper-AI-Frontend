import { Metadata } from 'next'
import { Phone, Brain, BarChart3, Bot, Shield, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Features - Harper AI Sales Intelligence Platform',
  description: 'Discover how Harper AI\'s AI-powered calling, conversation intelligence, and analytics transform your sales process.',
}

export default function FeaturesPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Every Feature Built to Drive{' '}
              <span className="text-transparent bg-clip-text gradient-purple-pink">
                Revenue Growth
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              From first call to closed deal, Harper AI provides the tools and insights 
              your team needs to succeed at every stage of the sales process.
            </p>
          </div>
        </div>
      </section>

      {/* AI-Powered Calling */}
      <section id="calling" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 gradient-purple-pink rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-purple-600 uppercase tracking-wider">
                  AI-Powered Calling
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Make Every Call Count with Intelligent Automation
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Harper AI's Twilio-powered calling system doesn't just connect you—it learns 
                from every interaction. Our AI analyzes tone, sentiment, and conversation 
                patterns in real-time, giving your team superhuman sales abilities.
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-purple-800">
                  <strong>Technical credibility:</strong> Built on Twilio Voice SDK for 99.95% uptime
                </p>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Zap className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Intelligent Auto-Dialer</p>
                    <p className="text-gray-600">Automatically prioritize and dial your best leads</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Zap className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Real-Time Coaching</p>
                    <p className="text-gray-600">Get AI-powered suggestions during live calls</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Zap className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Smart Call Routing</p>
                    <p className="text-gray-600">Route calls to the best available rep automatically</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-gray-100 rounded-2xl p-8 h-96 flex items-center justify-center">
              <span className="text-gray-400">AI Calling Interface Preview</span>
            </div>
          </div>
        </div>
      </section>

      {/* Conversation Intelligence */}
      <section id="intelligence" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Key Conversation Intelligence Features
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Real-time transcription with speaker identification
                      </h4>
                      <p className="text-sm text-gray-600">
                        Know exactly who said what with 95% accuracy powered by OpenAI Whisper
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Sentiment tracking throughout conversations
                      </h4>
                      <p className="text-sm text-gray-600">
                        Monitor emotional tone and engagement levels in real-time
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Automatic highlight reel creation
                      </h4>
                      <p className="text-sm text-gray-600">
                        AI automatically creates clips of key moments for coaching
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Competitor mention alerts
                      </h4>
                      <p className="text-sm text-gray-600">
                        Get instant notifications when competitors are mentioned
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 gradient-purple-pink rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-purple-600 uppercase tracking-wider">
                  Conversation Intelligence
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Turn Conversations into Revenue-Driving Insights
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our advanced sentiment analysis goes beyond keywords. Harper AI understands 
                context, emotion, and buying signals, automatically surfacing the moments 
                that matter most.
              </p>
              <p className="text-lg text-gray-600">
                Every call becomes a learning opportunity. Our AI identifies patterns across 
                thousands of conversations, helping you understand what separates top 
                performers from the rest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Dashboard */}
      <section id="analytics" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center gap-3 justify-center mb-6">
              <div className="w-12 h-12 gradient-purple-pink rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-purple-600 uppercase tracking-wider">
                Analytics Dashboard
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Data That Drives Decisions, Not Just Reports
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Stop drowning in spreadsheets. Harper AI's intelligent dashboard surfaces 
              exactly what you need to know, when you need to know it. Track team 
              performance, identify coaching opportunities, and forecast with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Performance Metrics
              </h3>
              <p className="text-gray-600">
                Track calls, conversion rates, talk time, and more with real-time updates
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Team Leaderboards
              </h3>
              <p className="text-gray-600">
                Motivate your team with gamification and friendly competition
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Revenue Forecasting
              </h3>
              <p className="text-gray-600">
                AI-powered predictions help you hit your numbers every quarter
              </p>
            </div>
          </div>

          <div className="mt-12 bg-gray-100 rounded-2xl p-8 h-96 flex items-center justify-center">
            <span className="text-gray-400">Analytics Dashboard Preview</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            See Harper AI in Action
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Experience the future of sales intelligence with a personalized demo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                Start Free 30-Day Trial
              </Button>
            </Link>
            <Link href="/contact?demo=true">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}