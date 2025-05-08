
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Get the API key from environment variables
const apiKey = Deno.env.get("GEMINI_API_KEY");

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Main function to handle requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { inputText } = await req.json();

    if (!apiKey) {
      console.error("No Gemini API key found");
      return new Response(
        JSON.stringify({ error: "API key not configured", suggestion: "" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!inputText) {
      return new Response(JSON.stringify({ suggestion: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Getting suggestion for:", inputText);

    // Call the Gemini API to get text completion
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Complete this task description in a way that sounds natural. Only return the completion, do not repeat the input. Keep it short and focused. Input: "${inputText}"`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 20,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get suggestion", suggestion: "" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    
    // Extract the text from Gemini's response
    let suggestion = "";
    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0]
    ) {
      suggestion = data.candidates[0].content.parts[0].text;
      
      // Clean up the suggestion - remove quotes, periods at end, etc.
      suggestion = suggestion.trim();
      if (suggestion.startsWith('"')) {
        suggestion = suggestion.slice(1);
      }
      if (suggestion.endsWith('"')) {
        suggestion = suggestion.slice(0, -1);
      }
      if (suggestion.endsWith('.')) {
        suggestion = suggestion.slice(0, -1);
      }
      
      // If suggestion repeats the input text, remove that part
      if (suggestion.toLowerCase().startsWith(inputText.toLowerCase())) {
        suggestion = suggestion.slice(inputText.length);
      }
    }

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in gemini-suggest function:", error);
    return new Response(
      JSON.stringify({ error: error.message, suggestion: "" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
