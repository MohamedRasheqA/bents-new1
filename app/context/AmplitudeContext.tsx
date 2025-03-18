// app/context/AmplitudeContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as amplitude from '@amplitude/analytics-browser';
import { useAuth, useUser } from '@clerk/nextjs';
import { LogLevel } from '@amplitude/analytics-types';

interface AmplitudeContextType {
  isInitialized: boolean;
  trackAmplitudeEvent: (eventName: string, eventProperties?: Record<string, any>) => void;
  identifyUser: (userId: string, userProperties?: Record<string, any>) => void;
}

const AmplitudeContext = createContext<AmplitudeContextType | undefined>(undefined);

interface AmplitudeProviderProps {
  children: React.ReactNode;
  apiKey?: string;
}

export function AmplitudeProvider({ children, apiKey }: AmplitudeProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { userId } = useAuth();
  const { user } = useUser();
  const AMPLITUDE_API_KEY = apiKey || process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

  useEffect(() => {
    if (!AMPLITUDE_API_KEY) {
      console.warn('Amplitude API key is not set');
      return;
    }

    try {
      amplitude.init(AMPLITUDE_API_KEY, undefined, {
        defaultTracking: {
          pageViews: true,
          sessions: true,
          formInteractions: true,
        },
        userId: userId || undefined,
        logLevel: (process.env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Error) as LogLevel
      });
      setIsInitialized(true);
      console.log('Amplitude initialized with user:', userId);
    } catch (error) {
      console.error('Failed to initialize Amplitude:', error);
    }
  }, [AMPLITUDE_API_KEY, userId]);

  // This effect runs whenever the user state changes
  useEffect(() => {
    if (isInitialized && userId && user) {
      try {
        // Instead of using clerk ID as the primary identifier,
        // use the user's full name or username
        const userIdentifier = user.fullName || user.username || userId;
        
        amplitude.setUserId(userIdentifier);
        
        const identify = new amplitude.Identify();
        // Store clerk_user_id as a property instead of primary identifier
        identify.set('clerk_user_id', userId);
        identify.set('distinct_id', userIdentifier);
        
        if (user.primaryEmailAddress?.emailAddress) {
          identify.set('email', user.primaryEmailAddress.emailAddress);
        }
        if (user.fullName) {
          identify.set('name', user.fullName);
        }
        
        amplitude.identify(identify);
      } catch (error) {
        console.error('Error identifying user in Amplitude:', error);
      }
    }
  }, [isInitialized, userId, user]);

  const identifyUser = useCallback((userId: string, userProperties?: Record<string, any>) => {
    if (!isInitialized) return;
    
    try {
      amplitude.setUserId(userId);
      if (userProperties) {
        const identify = new amplitude.Identify();
        Object.entries(userProperties).forEach(([key, value]) => {
          identify.set(key, value);
        });  
        amplitude.identify(identify, { user_id: userId });
      } 
    } catch (error) {
      console.error('Failed to identify user:', error);
    } 
  }, [isInitialized]);

  const trackAmplitudeEvent = useCallback((eventName: string, eventProperties?: Record<string, any>) => {
    if (!isInitialized || !userId) return;

    try {
      const userIdentifier = user?.fullName || user?.username || userId;
      const eventData = {
        ...eventProperties,
        clerk_user_id: userId, // Keep clerk ID as a property
        distinct_id: userIdentifier,
        user_name: user?.fullName,
        user_email: user?.primaryEmailAddress?.emailAddress,
        timestamp: new Date().toISOString()
      };

      amplitude.track(eventName, eventData);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [isInitialized, userId, user]);

  return (
    <AmplitudeContext.Provider value={{ isInitialized, trackAmplitudeEvent, identifyUser }}>
      {children}
    </AmplitudeContext.Provider>
  );
}

export function useAmplitudeContext() {
  const context = useContext(AmplitudeContext);
  if (context === undefined) {
    throw new Error('useAmplitudeContext must be used within an AmplitudeProvider');
  }
  return context;
}
