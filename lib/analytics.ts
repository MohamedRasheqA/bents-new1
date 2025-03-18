declare global {
    interface Window {
      amplitude: any;
    }
  }
  
  export const trackEvent = (eventName: string, eventProperties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.amplitude) {
      window.amplitude.track(eventName, eventProperties);
    }
  };