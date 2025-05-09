import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Task, TasksByDate } from '../lib/types';
import { encryptData } from '../lib/encryption';

// Common words used in todo lists for local suggestions
const commonTodoWords = [
  "meeting", "with", "call", "email", "finish", "start", "review", 
  "complete", "write", "check", "send", "update", "prepare", "create",
  "submit", "follow", "up", "on", "the", "for", "about", "regarding",
  "report", "presentation", "document", "project", "deadline"
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

  // Function to get word autocomplete locally without API calls
  const getLocalWordSuggestion = useCallback((text: string) => {
    if (!text.trim() || !aiEnabled) {
      return { suggestion: '', words: [] };
    }
    
    // Get the last word being typed
    const lastSpaceIndex = text.lastIndexOf(' ');
    const lastWord = lastSpaceIndex >= 0 ? text.substring(lastSpaceIndex + 1) : text;
    
    // Only provide autocomplete if user has started typing a word
    if (lastWord.length < 2) {
      return { suggestion: '', words: [] };
    }
    
    // Find matching words from common todo words that START with what the user is typing
    const matchingWords = commonTodoWords.filter(word => 
      word.toLowerCase().startsWith(lastWord.toLowerCase()) && word.length > lastWord.length
    );
    
    // Get task-specific words if available
    const taskContext = prepareTaskContext();
    if (taskContext?.recentTasks) {
      // Extract words from recent tasks
      const taskWords = taskContext.recentTasks.flatMap(task => 
        task.split(/\s+/).filter(word => word.length > 3)
      );
      
      // Add matching task words to suggestions, but only if they start with what user is typing
      taskWords.forEach(word => {
        if (word.toLowerCase().startsWith(lastWord.toLowerCase()) && 
            word.length > lastWord.length && 
            !matchingWords.includes(word)) {
          matchingWords.push(word);
        }
      });
    }
    
    // If we have matches, return the first match
    if (matchingWords.length > 0) {
      // Get the completion part (what should be added after what user typed)
      const firstMatch = matchingWords[0];
      const completion = firstMatch.substring(lastWord.length);
      return { 
        suggestion: completion,
        words: matchingWords.slice(0, 5) // Limit to 5 words max
      };
    }
    
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
      
      // First try local word suggestions
      const localSuggestion = getLocalWordSuggestion(text);
      
      // Start API call in parallel, but don't wait for it if we have local suggestions
      let apiCallPromise: Promise<any> | null = null;
      
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
                setSuggestionWords([...localSuggestion.words, ...apiWords].slice(0, 5));
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
          // Get the last word being typed by the user
          const lastSpaceIndex = text.lastIndexOf(' ');
          const lastWord = lastSpaceIndex >= 0 ? text.substring(lastSpaceIndex + 1) : text;
          
          // Extract words from the API suggestion
          const suggestionWords = data.suggestion.split(/\s+/).filter(Boolean);
          
          // Only use words that start with what the user is typing
          const matchingWords = suggestionWords.filter(word => 
            word.toLowerCase().startsWith(lastWord.toLowerCase()) && 
            word.length > lastWord.length
          );
          
          if (matchingWords.length > 0) {
            // Get just the completion part of the first matching word
            const firstMatch = matchingWords[0];
            const completion = firstMatch.substring(lastWord.length);
            setSuggestion(completion);
            setSuggestionWords(matchingWords);
          } else {
            setSuggestion('');
            setSuggestionWords([]);
          }
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

    if (inputText.trim().length > 2 && aiEnabled) {
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
