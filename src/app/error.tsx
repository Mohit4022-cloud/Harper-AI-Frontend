'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[Global Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm border-gray-700">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-500/10 rounded-full">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-3">
            Oops! Something went wrong
          </h1>
          
          <p className="text-gray-400 mb-6">
            {process.env.NODE_ENV === 'development' 
              ? error.message 
              : 'An unexpected error occurred. We apologize for the inconvenience.'}
          </p>
          
          {process.env.NODE_ENV === 'development' && error.digest && (
            <div className="mb-6 p-3 bg-gray-900/50 rounded-lg">
              <p className="text-xs text-gray-500 font-mono">
                Error ID: {error.digest}
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button
              onClick={() => window.location.href = '/dashboard'}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-500">
              If this problem persists, please contact{' '}
              <a 
                href="mailto:support@harperai.com" 
                className="text-blue-400 hover:underline"
              >
                support@harperai.com
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}