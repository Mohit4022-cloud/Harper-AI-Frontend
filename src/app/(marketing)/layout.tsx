import { Inter } from 'next/font/google'
import MarketingNav from '@/components/marketing/MarketingNav'
import MarketingFooter from '@/components/marketing/MarketingFooter'

const inter = Inter({ subsets: ['latin'] })

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.className} min-h-screen flex flex-col`}>
      <MarketingNav />
      <main className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  )
}