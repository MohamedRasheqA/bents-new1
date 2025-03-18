// app/hooks/useAmplitude.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import * as amplitude from '@amplitude/analytics-browser';

interface AmplitudeEvent {
  eventName: string;
  eventProperties?: Record<string, any>;
}


export function useAmplitude() {
  const { userId } = useAuth();
  const { user } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY) {
      amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY, undefined, {
        defaultTracking: {
          pageViews: true,
          sessions: true,
          formInteractions: true,
        }
      });
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (userId && user) {
      const userIdentifier = user.fullName || user.username || userId;
      amplitude.setUserId(userIdentifier);
      
      const identify = new amplitude.Identify();
      identify.set('clerk_user_id', userId);
      if (user.primaryEmailAddress?.emailAddress) {
        identify.set('email', user.primaryEmailAddress.emailAddress);
      }
      if (user.firstName) {
        identify.set('firstName', user.firstName);
      }
      if (user.lastName) {
        identify.set('lastName', user.lastName);
      }
      if (user.fullName) {
        identify.set('fullName', user.fullName);
      }
      if (user.createdAt) {
        identify.set('createdAt', user.createdAt.toISOString());
      }

      amplitude.identify(identify);
    } else {
      amplitude.reset();
    }

    return () => {
      amplitude.reset();
    };
  }, [userId, user]);

  const trackEvent = useCallback((eventName: string, eventProperties: Record<string, any> = {}) => {
    if (!userId || !isInitialized) return;

    try {
      const userIdentifier = user?.fullName || user?.username || userId;
      amplitude.setUserId(userIdentifier);
      
      amplitude.track(eventName, {
        ...eventProperties,
        clerk_user_id: userId,
        user_name: user?.fullName,
        email: user?.primaryEmailAddress?.emailAddress,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [userId, user, isInitialized]);

  return { trackEvent, isInitialized };
}
