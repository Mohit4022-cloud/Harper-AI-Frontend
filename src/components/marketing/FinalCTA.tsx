import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-600 to-pink-600 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Ready to Transform Your Sales Process?
        </h2>
        <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
          Join thousands of teams already using Harper AI to accelerate their revenue growth. 
          Set up in minutes, see results in days.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/register">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              Start Free 30-Day Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/contact?demo=true">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Schedule a Demo
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-white/70 text-sm">
          No credit card required • 30-day money-back guarantee
        </p>
      </div>
    </section>
  )
}