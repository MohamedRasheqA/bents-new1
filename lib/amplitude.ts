// app/lib/amplitude.ts
type AmplitudeWindow = Window & {
  amplitude?: {
    getInstance: () => {
      logEvent: (eventName: string, eventProperties?: Record<string, any>) => void;
    };
  };
};

export const logEvent = (eventName: string, eventProperties?: Record<string, any>) => {
  try {
    const win = window as AmplitudeWindow;
    if (!win.amplitude) {
      console.warn('Amplitude not initialized');
      return;
    }
    
    win.amplitude.getInstance().logEvent(eventName, eventProperties);
    console.log('Event tracked:', eventName, eventProperties);
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};
