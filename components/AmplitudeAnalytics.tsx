'use client';

import { useAmplitudeContext } from '@/app/context/AmplitudeContext';
import { useEffect } from 'react';

export default function AmplitudeAnalytics() {
  const { isInitialized, trackAmplitudeEvent } = useAmplitudeContext();

  useEffect(() => {
    if (isInitialized) {
      trackAmplitudeEvent('page_view', {
        path: window.location.pathname,
        url: window.location.href,
      });
    }
  }, [isInitialized, trackAmplitudeEvent]);

  return null;
}
