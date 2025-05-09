import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Task, TasksByDate } from '../lib/types';
import { encryptData } from '../lib/encryption';
import { 
  findFuzzyMatches, 
  grammaticalConnectors, 
  allConnectors,
  predictNextConnector,
  analyzeNGrams
} from '../lib/fuzzy-match';
import { suggestionCache } from '../lib/suggestion-cache';

// Common words used in todo lists for local suggestions
const commonTodoWords = [
  // Task-related verbs
  "meeting", "call", "email", "finish", "start", "review", 
  "complete", "write", "check", "send", "update", "prepare", "create",
  "submit", "follow", "schedule", "book", "organize", "plan", "research",
  "develop", "implement", "test", "fix", "debug", "deploy", "launch",
  "analyze", "evaluate", "discuss", "present", "share", "collaborate",
  
  // Common nouns
  "report", "presentation", "document", "project", "deadline", "meeting",
  "notes", "feedback", "proposal", "draft", "version", "design", "code",
  "feature", "bug", "issue", "task", "appointment", "reminder", "notification",
  "message", "call", "conference", "workshop", "training", "session",
  
  // Time-related words
  "today", "tomorrow", "morning", "afternoon", "evening", "monday", "tuesday",
  "wednesday", "thursday", "friday", "saturday", "sunday", "weekly", "monthly",
  "daily", "urgent", "important", "priority", "deadline", "due", "date",
  
  // Include grammatical connectors too
  ...allConnectors
];

interface SuggestionResponse {
  suggestion: string;
  words: string[];
  error?: string;
}

interface SuggestionContext {
  recentTasks: string[];
  appContext: string;
}

export function useSuggestions(tasksByDate?: TasksByDate) {
  const [inputText, setInputText] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [suggestionWords, setSuggestionWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Check if AI suggestions are enabled
  useEffect(() => {
    const aiSuggestionsEnabled = localStorage.getItem('aiSuggestionsEnabled');
    // Default to true if not set
    setAiEnabled(aiSuggestionsEnabled !== 'false');
    
    // Listen for changes to the AI suggestions setting
    const handleAiSettingChange = (e: CustomEvent) => {
      setAiEnabled(e.detail.enabled);
    };
    
    window.addEventListener('aiSuggestionsSettingChanged', handleAiSettingChange as EventListener);
    
    return () => {
      window.removeEventListener('aiSuggestionsSettingChanged', handleAiSettingChange as EventListener);
    };
  }, []);

  // Helper function to prepare task context in an anonymized way
  const prepareTaskContext = useCallback(() => {
    if (!tasksByDate) return null;
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get recent tasks (today and yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Collect recent tasks
    const recentTasksMap = new Map<string, boolean>();
    const recentTasks: string[] = [];
    
    // Add today's tasks
    const todayTasks = tasksByDate[today] || [];
    todayTasks.forEach(task => {
      // Only use the content, not the ID or other identifiable info
      const content = task.content.replace(/^\[\s?[xX]?\s?\]\s?/, ''); // Remove checkbox markdown
      if (!recentTasksMap.has(content)) {
        recentTasksMap.set(content, true);
        recentTasks.push(content);
      }
    });
    
    // Add yesterday's tasks
    const yesterdayTasks = tasksByDate[yesterdayStr] || [];
    yesterdayTasks.forEach(task => {
      // Only use the content, not the ID or other identifiable info
      const content = task.content.replace(/^\[\s?[xX]?\s?\]\s?/, ''); // Remove checkbox markdown
      if (!recentTasksMap.has(content)) {
        recentTasksMap.set(content, true);
        recentTasks.push(content);
      }
    });
    
    // Limit to 10 most recent tasks to avoid overwhelming the API
    const limitedTasks = recentTasks.slice(0, 10);
    
    return {
      recentTasks: limitedTasks,
      appContext: "This is a todo app for personal task management. Suggestions should be practical, actionable task completions."
    };
  }, [tasksByDate]);

  // Enhanced function to get word autocomplete with fuzzy matching and context awareness
  const getLocalWordSuggestion = useCallback((text: string) => {
    if (!text.trim() || !aiEnabled) {
      return { suggestion: '', words: [] };
    }
    
    // Check cache first for performance optimization
    const cacheKey = `local:${text}`;
    const cachedResult = suggestionCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Get the last word being typed and all previous words for context
    const words = text.split(/\s+/).filter(Boolean);
    const lastSpaceIndex = text.lastIndexOf(' ');
    const lastWord = lastSpaceIndex >= 0 ? text.substring(lastSpaceIndex + 1) : text;
    const previousWords = words.slice(0, -1); // All words except the last one
    
    // Skip suggestions if we're at the start of a new word (wait for user to type)
    if (lastWord.length === 0) {
      return { suggestion: '', words: [] };
    }
    
    // Only provide suggestions when the user has typed at least 3 characters for a specific word
    if (lastWord.length < 3) {
      return { suggestion: '', words: [] };
    }
    
    // Use all common words for suggestions
    let candidates: string[] = [...commonTodoWords];
    
    // Get task-specific words if available
    const taskContext = prepareTaskContext();
    if (taskContext?.recentTasks) {
      // Extract words from recent tasks
      const taskWords = taskContext.recentTasks.flatMap(task => 
        task.split(/\s+/).filter(word => word.length > 2)
      );
      

      // Add unique task words to candidates
      taskWords.forEach(word => {
        if (!candidates.includes(word)) {
          candidates.push(word);
        }
      });
    }
    
    // Use fuzzy matching to find matches even with typos
    const matchingWords = findFuzzyMatches(lastWord, candidates, 2, 10);
    
    // If we have matches, return the first match
    if (matchingWords.length > 0) {
      // Get the completion part (what should be added after what user typed)
      const firstMatch = matchingWords[0];
      
      // Only use exact prefix matches (no fuzzy matching for completion)
      let completion = '';
      if (firstMatch.toLowerCase().startsWith(lastWord.toLowerCase())) {
        // Simple prefix match - just return the completion part for the current word only
        completion = firstMatch.substring(lastWord.length);
      }
      
      // Limit to completing the current word only (no additional words)
      completion = completion.split(/\s+/)[0] || '';
      
      // Enable for debugging
      console.log('Suggestion match:', {
        lastWord,
        firstMatch,
        completion,
        matchingWords: matchingWords.slice(0, 5)
      });
      
      const result = { 
        suggestion: completion,
        words: matchingWords.slice(0, 5) // Limit to 5 words max - these are the complete correct words
      };
      
      // Cache the result for future use
      suggestionCache.set(cacheKey, result.suggestion, result.words);
      
      return result;
    }
    
    // Return empty result (and don't cache it)
    return { suggestion: '', words: [] };
  }, [aiEnabled, prepareTaskContext]);

  const fetchSuggestion = useCallback(async (text: string) => {
    if (!text.trim() || !aiEnabled) {
      setSuggestion('');
      setSuggestionWords([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Check API cache first for performance optimization
      const apiCacheKey = `api:${text}`;
      const cachedApiResult = suggestionCache.get(apiCacheKey);
      
      // First try local word suggestions
      const localSuggestion = getLocalWordSuggestion(text);
      
      // Start API call in parallel, but don't wait for it if we have local suggestions or cached API results
      let apiCallPromise: Promise<any> | null = null;
      
      // If we have cached API results, use them instead of making a new API call
      if (cachedApiResult && cachedApiResult.suggestion) {
        apiCallPromise = Promise.resolve({ 
          data: { suggestion: cachedApiResult.suggestion, words: cachedApiResult.words },
          error: null
        });
      }
      
      // Only make API call if text is substantial enough and AI is enabled
      if (text.trim().length >= 2 && aiEnabled) {
        // Cancel any in-flight requests
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        // Create a new AbortController for this request
        abortControllerRef.current = new AbortController();
        
        // Set a timeout to abort the request if it takes too long
        const timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }, 800); // Abort if it takes longer than 800ms

        // Prepare task context
        const taskContext = prepareTaskContext();
        
        // Encrypt task context if available
        const encryptedContext = taskContext ? encryptData(taskContext) : null;
        
        // Start the API call but don't await it yet
        apiCallPromise = supabase.functions.invoke<SuggestionResponse>('gemini-completion', {
          body: { 
            text,
            context: encryptedContext
          },
          // Add the signal property with proper typing
          ...(abortControllerRef.current ? { signal: abortControllerRef.current.signal as any } : {}),
        }).then(result => {
          clearTimeout(timeoutId);
          return result;
        });
      }
      
      // If we have local suggestions, use them immediately
      if (localSuggestion.suggestion) {
        setSuggestion(localSuggestion.suggestion);
        setSuggestionWords(localSuggestion.words);
        
        // If we also started an API call, continue with it in the background
        if (apiCallPromise) {
          // Process API results in the background to update suggestions list
          apiCallPromise.then(({ data, error }) => {
            if (!error && data?.words && data.words.length > 0) {
              // Merge API suggestions with local suggestions
              const apiWords = data.words.filter(word => 
                word.length > 0 && !localSuggestion.words.includes(word)
              );
              
              if (apiWords.length > 0) {
                // Update with combined suggestions
                const combinedWords = [...localSuggestion.words, ...apiWords].slice(0, 5);
                setSuggestionWords(combinedWords);
                
                // Cache the combined result
                suggestionCache.set(apiCacheKey, localSuggestion.suggestion, combinedWords);
              }
            }
          }).catch(() => {
            // Ignore errors from background API call
          });
        }
        
        setIsLoading(false);
        return;
      }
      
      // If no local suggestions, wait for API call results
      if (apiCallPromise) {
        const { data, error } = await apiCallPromise;
        
        if (error) {
          console.error('Error fetching suggestion:', error);
          setError(error.message);
          setSuggestion('');
          setSuggestionWords([]);
          return;
        }
        
        if (data?.error) {
          console.error('API error:', data.error);
          setError(data.error);
          setSuggestion('');
          setSuggestionWords([]);
          return;
        }

        if (data?.suggestion) {
          // Extract just the first word from the API suggestion
          const firstWord = data.suggestion.split(/\s+/)[0] || '';
          setSuggestion(firstWord);
          setSuggestionWords(data.words || []);
          
          // For debugging only
          // console.log('API suggestion:', {
          //   suggestion: firstWord,
          //   words: data.words || []
          // });
          
          // Cache the API result
          suggestionCache.set(apiCacheKey, firstWord, data.words || []);
        } else {
          setSuggestion('');
          setSuggestionWords([]);
        }
      } else {
        // No API call was made and no local suggestions
        setSuggestion('');
        setSuggestionWords([]);
      }
    } catch (err) {
      // Ignore AbortError as it's expected when we cancel requests
      if (err.name !== 'AbortError') {
        console.error('Unexpected error:', err);
        setError(err.message);
      }
      setSuggestion('');
      setSuggestionWords([]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [aiEnabled, prepareTaskContext, getLocalWordSuggestion]);

  // Handle input text changes with debounce
  useEffect(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    // Get the last word being typed
    const lastSpaceIndex = inputText.lastIndexOf(' ');
    const lastWord = lastSpaceIndex >= 0 ? inputText.substring(lastSpaceIndex + 1) : inputText;
    
    // Only fetch suggestions if the last word has at least 3 characters and AI is enabled
    if (lastWord.length >= 3 && aiEnabled) {
      typingTimerRef.current = setTimeout(() => {
        fetchSuggestion(inputText);
      }, 400); // 400ms debounce
    } else {
      setSuggestion('');
      setSuggestionWords([]);
    }

    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [inputText, fetchSuggestion, aiEnabled]);

  // Reset suggestion when input is cleared
  useEffect(() => {
    if (!inputText.trim()) {
      setSuggestion('');
      setSuggestionWords([]);
    }
  }, [inputText]);
  
  // Function to clear the current suggestion
  const clearSuggestion = useCallback(() => {
    setSuggestion('');
    setSuggestionWords([]);
  }, []);

  // Return the hook values
  return {
    inputText,
    setInputText,
    suggestion,
    suggestionWords,
    isLoading,
    error,
    aiEnabled,
    clearSuggestion
  };
}
