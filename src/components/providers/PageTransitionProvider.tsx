'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Provider to handle smooth page transitions
 * Prevents blank white screens during navigation
 */
export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Start transition immediately when pathname changes
    setIsTransitioning(true);

    // End transition after content loads
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 300); // 300ms transition time

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {/* Lightweight loading indicator during transitions */}
      {isTransitioning && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Subtle progress bar at top */}
          <div className="h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 animate-pulse" />
          
          {/* Optional: very subtle overlay to prevent jarring transitions */}
          <div className="absolute inset-0 bg-background/5 transition-opacity duration-300" />
        </div>
      )}
      
      {/* Main content with smooth opacity transition */}
      <div
        className={`transition-opacity duration-300 ${
          isTransitioning ? 'opacity-90' : 'opacity-100'
        }`}
      >
        {children}
      </div>
    </>
  );
}

/**
 * Hook to manually trigger loading state
 * Useful for programmatic navigation
 */
export function usePageTransition() {
  const [isLoading, setIsLoading] = useState(false);

  const startTransition = () => setIsLoading(true);
  const endTransition = () => setIsLoading(false);

  return {
    isLoading,
    startTransition,
    endTransition,
  };
}