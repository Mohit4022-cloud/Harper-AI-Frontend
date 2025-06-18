'use client';

import { useEffect, useCallback } from 'react';
import { updateSessionActivity, isSessionExpiringSoon, getSessionTimeRemaining } from '@/lib/session';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

/**
 * Component to monitor user session and handle inactivity
 * Automatically refreshes session on user activity
 */
export function SessionMonitor() {
  const router = useRouter();
  const { toast } = useToast();

  // Update session activity on user interaction
  const handleUserActivity = useCallback(() => {
    updateSessionActivity();
  }, []);

  // Check session status periodically
  const checkSession = useCallback(() => {
    if (isSessionExpiringSoon()) {
      const remaining = getSessionTimeRemaining();
      const minutes = Math.floor(remaining / 60000);
      
      if (minutes > 0 && minutes <= 5) {
        toast({
          title: 'Session Expiring Soon',
          description: `Your session will expire in ${minutes} minute${minutes === 1 ? '' : 's'}. Please save your work.`,
          variant: 'default',
        });
      } else if (remaining <= 0) {
        toast({
          title: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
        router.push('/login');
      }
    }
  }, [router, toast]);

  useEffect(() => {
    // Activity events to monitor
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Check session every minute
    const interval = setInterval(checkSession, 60000);

    // Initial activity update
    updateSessionActivity();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(interval);
    };
  }, [handleUserActivity, checkSession]);

  // This component doesn't render anything
  return null;
}