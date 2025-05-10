import { useEffect } from 'react';
import posthog from 'posthog-js';
import { POSTHOG_API_KEY, POSTHOG_HOST, IS_DEVELOPMENT } from './env';

/**
 * Initialize PostHog
 * 
 * This function initializes PostHog with the provided API key and host.
 * It should be called once at the application startup.
 */
export function initPostHog() {
  console.log("PostHog API key:  ", POSTHOG_API_KEY);
  console.log("PostHog Host: ", POSTHOG_HOST);
  if (!POSTHOG_API_KEY) {
    console.warn('PostHog API key is not defined. Analytics will not be tracked.');
    return;
  }

  // Initialize PostHog
  posthog.init(POSTHOG_API_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // We'll manually capture pageviews
    loaded: (posthog) => {
      if (IS_DEVELOPMENT) {
        // In development, log PostHog events to console
        posthog.debug();
      }
    },
  });
  
  // Enable session recording after initialization
  posthog.startSessionRecording();
}

/**
 * PostHog Provider Component
 * 
 * This component initializes PostHog and provides analytics tracking
 * for your application.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PostHog
    initPostHog();

    // Capture initial pageview
    posthog.capture('$pageview');
    
    // Explicitly start session recording to ensure it's enabled
    // This is a belt-and-suspenders approach to make sure recording works
    setTimeout(() => {
      if (posthog && typeof posthog.startSessionRecording === 'function') {
        posthog.startSessionRecording();
      }
    }, 1000); // Small delay to ensure PostHog is fully initialized

    // No specific cleanup needed for PostHog
    // The instance will be garbage collected when the app unmounts
    return () => {};
  }, []);

  return <>{children}</>;
}

/**
 * Track event with PostHog
 * 
 * @param eventName The name of the event to track
 * @param properties Optional properties to include with the event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (!POSTHOG_API_KEY) return;
  posthog.capture(eventName, properties);
}

/**
 * Identify user with PostHog
 * 
 * @param userId The unique identifier for the user
 * @param properties Optional properties to associate with the user
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (!POSTHOG_API_KEY) return;
  posthog.identify(userId, properties);
}

/**
 * Reset user identity
 * 
 * Call this when a user logs out to reset their identity
 */
export function resetIdentity() {
  if (!POSTHOG_API_KEY) return;
  posthog.reset();
}
