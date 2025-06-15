import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Shield, Lock, FileCheck, Database, Key, Globe } from 'lucide-react'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Security & Compliance - Harper AI',
  description: 'Enterprise-grade security and compliance. SOC 2 Type II certified, GDPR compliant, and built with security-first architecture.',
}

const securityFeatures = [
  {
    icon: Shield,
    title: 'End-to-End Encryption',
    description: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256).',
  },
  {
    icon: Lock,
    title: 'Zero Trust Architecture',
    description: 'Every request is authenticated and authorized, no exceptions.',
  },
  {
    icon: Key,
    title: 'Advanced Access Controls',
    description: 'SAML SSO, MFA, RBAC, and granular permission management.',
  },
  {
    icon: Database,
    title: 'Data Isolation',
    description: 'Complete tenant isolation with dedicated encryption keys.',
  },
  {
    icon: FileCheck,
    title: 'Audit Logging',
    description: 'Comprehensive audit trails for all data access and changes.',
  },
  {
    icon: Globe,
    title: 'Global Compliance',
    description: 'Meet data residency requirements with regional deployments.',
  },
]

const certifications = [
  { name: 'SOC 2 Type II', description: 'Annual audit by independent third party' },
  { name: 'GDPR Compliant', description: 'Full EU data protection compliance' },
  { name: 'CCPA Ready', description: 'California privacy law compliant' },
  { name: 'ISO 27001', description: 'Information security management certified' },
  { name: 'HIPAA Ready', description: 'Healthcare data protection available' },
  { name: 'PCI DSS', description: 'Payment card data security' },
]

const techPartners = [
  { name: 'Twilio', description: 'Voice infrastructure' },
  { name: 'OpenAI', description: 'AI processing' },
  { name: 'PostgreSQL', description: 'Database' },
  { name: 'AWS', description: 'Cloud infrastructure' },
]

export default function SecurityPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
              <Shield className="w-4 h-4" />
              Security & Compliance
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Bank-Level Security for Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Most Valuable Asset
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Your data is your competitive advantage. We protect it with the most advanced 
              security infrastructure and practices in the industry.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/contact?type=security">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                  Request Security Documentation
                </Button>
              </Link>
              <Link href="#architecture">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  View Architecture
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-gray-900">99.99%</p>
              <p className="text-gray-600 mt-1">Uptime SLA</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">0</p>
              <p className="text-gray-600 mt-1">Security breaches</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">24/7</p>
              <p className="text-gray-600 mt-1">Security monitoring</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">256-bit</p>
              <p className="text-gray-600 mt-1">AES encryption</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Security-First Architecture
            </h2>
            <p className="text-xl text-gray-600">
              Built from the ground up with security at every layer
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 gradient-purple-pink rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section id="architecture" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              High-Level Architecture
            </h2>
            <p className="text-xl text-gray-600">
              Designed for maximum security and performance at scale
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="bg-gray-100 rounded-xl p-12 h-96 flex items-center justify-center">
              <span className="text-gray-400">Security Architecture Diagram</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Edge Security</h4>
                <p className="text-sm text-gray-600">
                  DDoS protection, WAF, and intelligent threat detection at the edge
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Application Security</h4>
                <p className="text-sm text-gray-600">
                  Zero-trust networking, encrypted service mesh, and runtime protection
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Security</h4>
                <p className="text-sm text-gray-600">
                  Encryption at rest, key rotation, and hardware security modules
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Compliance & Certifications
            </h2>
            <p className="text-xl text-gray-600">
              Meeting the highest standards of security and privacy
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <div key={index} className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {cert.name}
                </h3>
                <p className="text-gray-600">
                  {cert.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Partners */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Technology Partners
            </h2>
            <p className="text-xl text-gray-600">
              Built on trusted, enterprise-grade infrastructure
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {techPartners.map((partner, index) => (
              <div key={index} className="bg-white rounded-lg p-6 text-center shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-1">{partner.name}</h4>
                <p className="text-sm text-gray-600">{partner.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-900 font-medium mb-2">
              Performance Metrics
            </p>
            <p className="text-gray-600">
              Process 10,000 calls simultaneously • 50ms average latency • 99.99% uptime
            </p>
          </div>
        </div>
      </section>

      {/* Data Ownership */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Your Data, Your Control
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Complete Data Ownership</h4>
                  <p className="text-gray-600">You own all your data. Export anytime, delete anytime.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">No Data Mining</h4>
                  <p className="text-gray-600">We never use your data to train models or for any other purpose.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Right to Deletion</h4>
                  <p className="text-gray-600">Request complete data deletion at any time, fully automated.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Security Questions? We Have Answers.
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Our security team is ready to discuss your specific requirements
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact?type=security">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                Talk to Security Team
              </Button>
            </Link>
            <a href="/docs/security-whitepaper.pdf" download>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Download Security Whitepaper
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}