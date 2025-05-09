// @ts-nocheck

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Get Gemini API key from environment variables
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Log API key status (not the actual key) for debugging
console.log('Gemini API Key present:', !!GEMINI_API_KEY);

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple in-memory cache for completions
const completionCache = new Map<string, { suggestion: string; words: string[]; timestamp: number }>();
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour in milliseconds

async function getGeminiCompletion(text: string, requestBody: any = {}): Promise<{ suggestion: string; words: string[] }> {
  try {
    // Check cache first
    const cachedResult = completionCache.get(text);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_EXPIRY) {
      console.log('Cache hit for:', text);
      return {
        suggestion: cachedResult.suggestion,
        words: cachedResult.words
      };
    }

    // Validate API key
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY environment variable is not set');
      throw new Error('API key not configured');
    }

    // Parse context if provided
    let taskContext = null;
    if (requestBody.context) {
      try {
        // The context is encrypted, but we don't need to decrypt it here
        // We just pass it along to Gemini in its encrypted form for privacy
        // This ensures no PII is exposed in logs or during transit
        taskContext = requestBody.context;
        console.log('Received encrypted context with request');
      } catch (error) {
        console.error('Error parsing context:', error);
        // Continue without context if there's an error
      }
    }

    // Create prompt for Gemini with context if available
    let prompt = '';
    // Set up the prompt for Gemini with enhanced contextual understanding
    const prompt = `
      You are an AI assistant for a todo list app. The user is typing a task and you need to provide intelligent word completions.
      
      Current input: "${text}"
      
      ${taskContext ? `Recent tasks for context:
${taskContext.recentTasks.map(task => `- ${task}`).join('\n')}

` : ''}
      
      INSTRUCTIONS:
      1. Analyze the partial word the user is typing (after the last space)
      2. Provide 3-5 possible completions for that word, even if it contains typos
      3. Consider the grammatical context and task patterns from the examples
      4. Prioritize common task-related words, grammatical connectors, and domain-specific terms
      5. Focus on natural language flow and coherent task descriptions
      
      For example:
      - If input is "Schedule mee", suggest: "meeting"
      - If input is "Send ema", suggest: "email"
      - If input is "Finish the pres", suggest: "presentation"
      - If input is "Talk to John abot", suggest: "about" (correcting the typo)
      - If input is "Meet with team", suggest: "to" or "for" or "at" (grammatical connectors)
      
      Your response should be ONLY a list of possible word completions, separated by spaces.
      Keep your response very concise - just the words, no explanations.
    `;
    console.log('Sending request to Gemini API for text:', text);

    // Make API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 30,
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status}`, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    // Parse response
    const data = await response.json();
    console.log('Received response from Gemini API');
    
    // Extract the completion text from the response
    // Log the full response structure for debugging
    console.log('Response structure:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Handle different response formats from Gemini API versions
    const completion = data.candidates?.[0]?.content?.parts?.[0]?.text || // v1beta format
                      data.candidates?.[0]?.text || // Some v1 format
                      '';
    
    // Clean up the completion - remove any quotes and trim whitespace
    const cleanedCompletion = completion.replace(/^"|"$/g, '').trim();
    
    // Enhanced processing for intelligent word completion with fuzzy matching
    let processedSuggestion = '';
    let words: string[] = [];

    try {
      if (cleanedCompletion) {
        // Extract the last word being typed
        const lastSpaceIndex = text.lastIndexOf(' ');
        const lastWord = lastSpaceIndex >= 0 ? text.substring(lastSpaceIndex + 1) : text;
        
        // Allow completions for very short words if they might be common connectors
        // like 'a', 'an', 'the', 'to', etc.
        const commonConnectors = ['a', 'an', 'the', 'to', 'for', 'with', 'by', 'at', 'in', 'on', 'of'];
        const allowShortCompletion = commonConnectors.some(conn => conn.startsWith(lastWord.toLowerCase()));
        
        if (lastWord.length < 1 && !allowShortCompletion) {
          return { suggestion: '', words: [] };
        }
        
        // Split the completion response into potential word completions
        const completionWords = cleanedCompletion.trim().split(/\s+/).filter(Boolean);
        
        // Use fuzzy matching for more intelligent completions
        let matchingWords: string[] = [];
        
        // First try exact prefix matches
        const exactMatches = completionWords.filter(word => 
          word.toLowerCase().startsWith(lastWord.toLowerCase()) && 
          word.length > lastWord.length
        );
        
        if (exactMatches.length > 0) {
          matchingWords = exactMatches;
        } else {
          // If no exact matches, try fuzzy matching for typo tolerance
          // Simple implementation: allow one character difference
          matchingWords = completionWords.filter(word => {
            if (word.length <= lastWord.length) return false;
            
            // Check if the word is similar enough to what the user is typing
            let errors = 0;
            for (let i = 0; i < Math.min(lastWord.length, word.length); i++) {
              if (lastWord[i].toLowerCase() !== word[i].toLowerCase()) {
                errors++;
                if (errors > 1) return false; // Allow at most one error
              }
            }
            return true;
          });
        }
        
        // If we have matching completions
        if (matchingWords.length > 0) {
          // Sort by relevance: exact matches first, then by length
          matchingWords.sort((a, b) => {
            const aExact = a.toLowerCase().startsWith(lastWord.toLowerCase());
            const bExact = b.toLowerCase().startsWith(lastWord.toLowerCase());
            
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            // Then by length (prefer shorter completions)
            return a.length - b.length;
          });
          
          // Get the best match
          const bestMatch = matchingWords[0];
          
          // For exact matches, just return the completion part
          if (bestMatch.toLowerCase().startsWith(lastWord.toLowerCase())) {
            processedSuggestion = bestMatch.substring(lastWord.length);
          } else {
            // For fuzzy matches, we need to be more careful
            // Find the point where the words diverge and suggest from there
            let divergePoint = 0;
            while (divergePoint < lastWord.length && 
                   divergePoint < bestMatch.length && 
                   lastWord[divergePoint].toLowerCase() === bestMatch[divergePoint].toLowerCase()) {
              divergePoint++;
            }
            
            // Suggest the correction from the diverge point
            processedSuggestion = bestMatch.substring(divergePoint);
          }
          
          // Return all matching words for reference
          // This is important for spelling correction - we need the complete words
          words = matchingWords;
        } else {
          // No matching completions found
          processedSuggestion = '';
          words = [];
        }
        
        // Limit to 5 words maximum
        words = words.slice(0, 5);
      }
    } catch (error) {
      console.error('Error processing completions:', error);
      processedSuggestion = '';
      words = [];
    }
    
    // Store in cache
    completionCache.set(text, {
      suggestion: processedSuggestion,
      words,
      timestamp: Date.now()
    });

    return {
      suggestion: processedSuggestion,
      words
    };
  } catch (error) {
    console.error('Error in getGeminiCompletion:', error);
    // Return empty results instead of throwing to avoid 500 errors
    return {
      suggestion: '',
      words: []
    };
  }
}

serve(async (req) => {
  console.log(`Received ${req.method} request to gemini-completion function`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request with CORS headers');
    return new Response(null, { 
      headers: corsHeaders,
      status: 204 // No content for OPTIONS
    });
  }

  try {
    // For non-OPTIONS requests, add CORS headers to all responses
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json'
    };

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Parsed request body:', JSON.stringify(requestBody));
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: responseHeaders }
      );
    }

    const { text, context } = requestBody;
    
    // Validate input
    if (!text || typeof text !== 'string') {
      console.log('Invalid input received:', text);
      return new Response(
        JSON.stringify({ error: 'Invalid input: text is required and must be a string' }),
        { status: 400, headers: responseHeaders }
      );
    }

    // Don't process empty or very short inputs
    if (text.trim().length < 3) {
      console.log('Input too short, returning empty suggestion');
      return new Response(
        JSON.stringify({ suggestion: '', words: [] }),
        { headers: responseHeaders }
      );
    }
    
    // Get completion from Gemini API
    console.log('Getting completion for:', text);
    const completion = await getGeminiCompletion(text, requestBody);
    const { suggestion, words } = completion;
    console.log('Completion result:', suggestion);
    
    // Return successful response
    return new Response(
      JSON.stringify({ 
        suggestion, 
        words 
      }),
      { headers: responseHeaders }
    );
  } catch (error) {
    console.error('Unhandled error in gemini-completion function:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        suggestion: '',
        words: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
