import Hero from '@/components/marketing/Hero'
import KeyDifferentiators from '@/components/marketing/KeyDifferentiators'
import Features from '@/components/marketing/Features'
import SocialProof from '@/components/marketing/SocialProof'
import Pricing from '@/components/marketing/Pricing'
import FinalCTA from '@/components/marketing/FinalCTA'

export const metadata = {
  title: 'Harper AI - Real-Time Sales Intelligence Platform',
  description: 'Harper AI analyzes 100% of your sales calls with advanced AI, delivering instant insights that help reps close more deals and managers coach at scale.',
  openGraph: {
    title: 'Harper AI - Real-Time Sales Intelligence Platform',
    description: 'Harper AI analyzes 100% of your sales calls with advanced AI, delivering instant insights that help reps close more deals and managers coach at scale.',
    type: 'website',
  },
}

export default function MarketingHome() {
  return (
    <>
      <Hero />
      <KeyDifferentiators />
      <Features />
      <SocialProof />
      <Pricing />
      <FinalCTA />
    </>
  )
}