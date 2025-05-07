/**
 * Environment variables utility
 * 
 * This file provides type-safe access to environment variables.
 * All environment variables should be accessed through this file.
 */

// Try to get config from window.APP_CONFIG (runtime config) or fall back to import.meta.env (build-time config)
declare global {
  interface Window {
    APP_CONFIG?: {
      POSTHOG_API_KEY: string;
      POSTHOG_HOST: string;
      APP_NAME: string;
    };
  }
}

// PostHog Configuration - prioritize environment variables for sensitive information
export const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY as string;
export const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST as string;

// App Configuration
export const APP_NAME = window.APP_CONFIG?.APP_NAME || import.meta.env.VITE_APP_NAME as string;

// Environment
export const MODE = import.meta.env.MODE;
export const IS_DEVELOPMENT = MODE === 'development';
export const IS_PRODUCTION = MODE === 'production';

/**
 * Validates that required environment variables are present
 * @returns True if all required variables are present, false otherwise
 */
export function validateEnv(): boolean {
  const requiredVars = [
    POSTHOG_API_KEY,
    POSTHOG_HOST,
    APP_NAME
  ];
  
  const missingVars = requiredVars.filter(v => !v);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    return false;
  }
  
  return true;
}
