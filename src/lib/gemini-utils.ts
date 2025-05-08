
/**
 * Utility functions for interacting with the Google Gemini API
 * to provide intelligent type-ahead suggestions
 */

import { supabase } from "@/integrations/supabase/client";

// Sample cache of common task patterns for fallback
const FALLBACK_PATTERNS: Record<string, string[]> = {
  "buy": [" groceries", " milk", " bread", " coffee"],
  "call": [" mom", " dad", " doctor", " dentist office"],
  "schedule": [" meeting with", " appointment for", " dentist appointment", " haircut"],
  "email": [" regarding", " the team about", " the client about"],
  "finish": [" report", " presentation", " project", " homework"],
  "prepare": [" for meeting", " dinner", " presentation", " documents"],
  "review": [" documents", " code", " presentation", " budget"],
  "send": [" email", " invoice", " report", " feedback"],
  "read": [" article", " book", " documentation", " email"],
  "write": [" report", " blog post", " email to", " documentation"]
};

/**
 * Rate limiter to control API usage
 */
class RateLimiter {
  private callsPerMinute: number = 10;
  private callTimes: number[] = [];

  canMakeCall(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove calls older than 1 minute
    this.callTimes = this.callTimes.filter(time => time > oneMinuteAgo);
    
    // Check if we're within limits
    if (this.callTimes.length < this.callsPerMinute) {
      this.callTimes.push(now);
      return true;
    }
    
    return false;
  }
}

const rateLimiter = new RateLimiter();

/**
 * Get suggestions from the Gemini API via Supabase Edge Function
 * Falls back to local suggestions if API is unavailable
 */
export async function getSuggestionFromGemini(inputText: string): Promise<string> {
  // Check rate limit
  if (!rateLimiter.canMakeCall()) {
    console.log("Rate limit reached, using fallback suggestion");
    return useFallbackSuggestion(inputText);
  }
  
  try {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('gemini-suggest', {
      body: { inputText },
    });

    if (error) {
      console.error("Error calling gemini-suggest function:", error);
      return useFallbackSuggestion(inputText);
    }

    if (data.error) {
      console.error("Error in gemini-suggest function:", data.error);
      return useFallbackSuggestion(inputText);
    }

    // Use the suggestion if available, otherwise fallback
    if (data.suggestion && data.suggestion.trim()) {
      return data.suggestion;
    } else {
      return getFallbackSuggestion(inputText);
    }
  } catch (error) {
    console.error("Error getting suggestion:", error);
    return useFallbackSuggestion(inputText);
  }
}

/**
 * Get a suggestion from our fallback patterns
 */
function getFallbackSuggestion(inputText: string): string {
  const words = inputText.split(' ');
  const lastWord = words[words.length - 1].toLowerCase();
  
  // Check if the last word matches any of our patterns
  const patterns = FALLBACK_PATTERNS[lastWord];
  if (patterns) {
    // Randomly select one of the patterns for diversity
    const randomIndex = Math.floor(Math.random() * patterns.length);
    return patterns[randomIndex];
  }
  
  return "";
}

/**
 * Use a fallback suggestion when the API is unavailable or rate limited
 */
function useFallbackSuggestion(inputText: string): string {
  const suggestion = getFallbackSuggestion(inputText);
  
  // If we have a valid suggestion from our patterns, use it
  if (suggestion) {
    return suggestion;
  }
  
  // If input ends with a preposition or article, suggest a generic completion
  const lastWord = inputText.split(' ').pop()?.toLowerCase() || "";
  const prepositions = ["to", "for", "with", "in", "on", "at", "by", "about"];
  const articles = ["the", "a", "an"];
  
  if (prepositions.includes(lastWord)) {
    return " complete the task by tomorrow";
  } else if (articles.includes(lastWord)) {
    return " project deadline";
  }
  
  // No good suggestion available
  return "";
}

/**
 * Track acceptance of suggestions for telemetry
 * In a production app, this would send data to analytics
 */
export function trackSuggestionAccepted(suggestion: string, accepted: boolean): void {
  // This would normally send telemetry data
  console.log(`Suggestion ${accepted ? 'accepted' : 'rejected'}: "${suggestion}"`);
}
