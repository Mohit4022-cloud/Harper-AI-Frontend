'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Search, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    // Log 404 errors for monitoring
    console.log('[404] Page not found:', window.location.pathname);
  }, []);

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/dashboard';
    }
  };

  const suggestedPages = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Calling', href: '/calling', icon: '📞' },
    { name: 'Reports', href: '/reports', icon: '📊' },
    { name: 'Contacts', href: '/contacts', icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full bg-gray-800/50 backdrop-blur-sm border-gray-700">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-yellow-500/10 rounded-full">
              <AlertTriangle className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white text-center mb-3">
            404 - Page Not Found
          </h1>
          
          <p className="text-gray-400 text-center mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">
              Popular pages:
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {suggestedPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-300"
                >
                  {typeof page.icon === 'string' ? (
                    <span className="text-lg">{page.icon}</span>
                  ) : (
                    <page.icon className="h-4 w-4" />
                  )}
                  <span className="text-sm">{page.name}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-sm text-blue-400 text-center">
              Many features are still under development. Check back soon!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}