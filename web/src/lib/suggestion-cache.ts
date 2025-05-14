/**
 * Suggestion caching system for performance optimization
 * Implements aggressive caching for common patterns to improve response time
 */

interface CachedSuggestion {
  suggestion: string;
  words: string[];
  timestamp: number;
}

// Cache expiration time in milliseconds (10 minutes)
const CACHE_EXPIRATION = 10 * 60 * 1000;

// Maximum number of items to store in cache
const MAX_CACHE_SIZE = 100;

class SuggestionCache {
  private cache: Map<string, CachedSuggestion>;
  private frequencyMap: Map<string, number>;
  
  constructor() {
    this.cache = new Map<string, CachedSuggestion>();
    this.frequencyMap = new Map<string, number>();
  }
  
  /**
   * Get a suggestion from cache
   * @param key The cache key (typically the input text)
   * @returns The cached suggestion or null if not found/expired
   */
  get(key: string): { suggestion: string; words: string[] } | null {
    // Clean expired entries occasionally
    if (Math.random() < 0.1) { // 10% chance on each get
      this.cleanExpiredEntries();
    }
    
    const entry = this.cache.get(key);
    
    // Return null if not found or expired
    if (!entry || Date.now() - entry.timestamp > CACHE_EXPIRATION) {
      if (entry) {
        // Remove expired entry
        this.cache.delete(key);
        this.frequencyMap.delete(key);
      }
      return null;
    }
    
    // Update access frequency
    this.frequencyMap.set(key, (this.frequencyMap.get(key) || 0) + 1);
    
    return {
      suggestion: entry.suggestion,
      words: entry.words
    };
  }
  
  /**
   * Store a suggestion in cache
   * @param key The cache key (typically the input text)
   * @param suggestion The suggestion to cache
   * @param words Array of suggestion words
   */
  set(key: string, suggestion: string, words: string[]): void {
    // Enforce cache size limit
    if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(key)) {
      this.evictLeastFrequentlyUsed();
    }
    
    this.cache.set(key, {
      suggestion,
      words,
      timestamp: Date.now()
    });
    
    // Initialize frequency counter
    this.frequencyMap.set(key, 1);
  }
  
  /**
   * Remove expired entries from cache
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > CACHE_EXPIRATION) {
        this.cache.delete(key);
        this.frequencyMap.delete(key);
      }
    }
  }
  
  /**
   * Evict the least frequently used entry from cache
   */
  private evictLeastFrequentlyUsed(): void {
    let leastFrequentKey: string | null = null;
    let leastFrequentCount = Infinity;
    
    for (const [key, count] of this.frequencyMap.entries()) {
      if (count < leastFrequentCount) {
        leastFrequentCount = count;
        leastFrequentKey = key;
      }
    }
    
    if (leastFrequentKey) {
      this.cache.delete(leastFrequentKey);
      this.frequencyMap.delete(leastFrequentKey);
    }
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.frequencyMap.clear();
  }
  
  /**
   * Get the current size of the cache
   */
  get size(): number {
    return this.cache.size;
  }
}

// Export a singleton instance
export const suggestionCache = new SuggestionCache();
