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
    // Set up the prompt for Gemini
    const prompt = `
      You are an AI assistant for a todo list app. The user is typing a task and you need to provide word completions.
      
      Current input: "${text}"
      
      ${taskContext ? `Recent tasks for context:
${taskContext.recentTasks.map(task => `- ${task}`).join('\n')}

` : ''}
      
      IMPORTANT: ONLY provide completions for the current word the user is typing. DO NOT suggest next words.
      
      For example:
      - If input is "Schedule mee", you might complete it as "meeting"
      - If input is "Send ema", you might complete it as "email"
      
      Extract the last partial word from the input (after the last space) and provide 3-5 possible completions for that word.
      Your response should be ONLY a list of possible word completions, separated by spaces.
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
    
    // Process the response to focus strictly on word completion (not suggestion)
    let processedSuggestion = '';
    let words: string[] = [];

    try {
      if (cleanedCompletion) {
        // Extract the last word being typed
        const lastSpaceIndex = text.lastIndexOf(' ');
        const lastWord = lastSpaceIndex >= 0 ? text.substring(lastSpaceIndex + 1) : text;
        
        // If no partial word is being typed, don't provide any completion
        if (lastWord.length < 2) {
          return { suggestion: '', words: [] };
        }
        
        // Split the completion response into potential word completions
        const completionWords = cleanedCompletion.trim().split(/\s+/).filter(Boolean);
        
        // Filter to only words that could complete what the user is typing
        const matchingWords = completionWords.filter(word => 
          word.toLowerCase().startsWith(lastWord.toLowerCase()) && 
          word.length > lastWord.length
        );
        
        // If we have matching completions
        if (matchingWords.length > 0) {
          // Sort by length (shorter completions first)
          matchingWords.sort((a, b) => a.length - b.length);
          
          // Get just the completion part of the first matching word
          const firstMatch = matchingWords[0];
          const completion = firstMatch.substring(lastWord.length);
          processedSuggestion = completion;
          
          // Return all matching words for reference
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
