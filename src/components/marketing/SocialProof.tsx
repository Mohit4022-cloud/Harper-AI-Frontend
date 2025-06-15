import { Star, TrendingUp, Award } from 'lucide-react'

export default function SocialProof() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Key metric */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 gradient-purple-pink rounded-full mb-4">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-2">30%</h2>
          <p className="text-xl text-gray-600">Average increase in close rates</p>
        </div>

        {/* Customer logos */}
        <div className="mb-16">
          <p className="text-center text-sm text-gray-500 uppercase tracking-wider mb-8">
            Trusted by leading sales teams
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-lg p-6 flex items-center justify-center h-20"
              >
                <span className="text-gray-400">Customer Logo {i}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="w-5 h-5 text-yellow-400 fill-current"
                />
              ))}
            </div>
            <blockquote className="text-2xl font-medium text-gray-900 mb-6">
              "Harper AI transformed how we approach sales calls. The real-time insights 
              are game-changing—our reps know exactly when to pivot, when to push, 
              and when to listen. Close rates are up 35% in just 3 months."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Sarah Johnson</p>
                <p className="text-gray-600">VP of Sales, TechCorp</p>
              </div>
            </div>
          </div>
        </div>

        {/* Awards/badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-2 text-gray-600">
            <Award className="w-5 h-5" />
            <span>G2 Leader Winter 2024</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Award className="w-5 h-5" />
            <span>Capterra Top Rated</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Award className="w-5 h-5" />
            <span>TrustRadius Top Rated</span>
          </div>
        </div>
      </div>
    </section>
  )
}