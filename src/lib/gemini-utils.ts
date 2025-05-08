
/**
 * Utility functions for interacting with the Google Gemini API
 * to provide intelligent type-ahead suggestions
 */

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

// API key would typically come from environment variables in a real app
// For this demo, we'll simulate API calls with local logic
const API_KEY = "SIMULATED_KEY"; 

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
 * Simulated function to get suggestions from the Gemini API
 * In a production app, this would make an actual API call
 */
export async function getSuggestionFromGemini(inputText: string): Promise<string> {
  // Check rate limit
  if (!rateLimiter.canMakeCall()) {
    return useFallbackSuggestion(inputText);
  }
  
  try {
    // In a real implementation, this would be an API call to Google Gemini
    // For this demo, we'll simulate API behavior with local logic and add a delay
    
    // Simulate network delay (50-150ms)
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    // Log for telemetry (would be more sophisticated in production)
    console.log("Suggestion requested for:", inputText);
    
    // Check for common patterns first in our fallbacks
    const fallbackSuggestion = getFallbackSuggestion(inputText);
    if (fallbackSuggestion) {
      return fallbackSuggestion;
    }
    
    // For longer or more complex inputs, generate a more contextual suggestion
    // This is where the real Gemini API would be called
    const words = inputText.split(' ');
    
    if (words.length >= 3) {
      // For longer inputs, try to complete the thought
      if (inputText.includes("meeting")) {
        return " with the team at 2:00 PM";
      } else if (inputText.includes("reminder")) {
        return " to call back client tomorrow";
      } else if (inputText.includes("project")) {
        return " deadline next Friday";
      } else if (inputText.endsWith("at ")) {
        return "10:00 AM tomorrow";
      }
    }
    
    // Default suggestions for short inputs that didn't match patterns
    if (words.length < 3) {
      const lastWord = words[words.length - 1].toLowerCase();
      
      if (lastWord.endsWith("ing")) {
        return " the project documentation";
      } else if (lastWord.length > 3) {
        return " the tasks before deadline";
      }
    }
    
    // No good suggestion found
    return "";
    
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
