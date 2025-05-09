# Gemini Completion Function

This Supabase Edge Function provides AI-powered task completion suggestions using Google's Gemini API.

## Features

- Generates task completion suggestions based on partial input
- Implements in-memory caching to reduce API calls
- Returns suggestions as full text and word-by-word arrays
- Includes error handling and rate limiting

## Setup

### 1. Get a Gemini API Key

You'll need to obtain an API key from Google's AI Studio (https://makersuite.google.com/app/apikey).

### 2. Deploy the Function

Deploy this function to your Supabase project:

```bash
supabase functions deploy gemini-completion
```

### 3. Set the API Key as a Secret

Set your Gemini API key as a Supabase secret:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
```

## Usage

Make POST requests to the function with the following JSON payload:

```json
{
  "text": "buy milk and"
}
```

The function will return a JSON response with the completion suggestion:

```json
{
  "suggestion": "eggs for breakfast",
  "words": ["eggs", "for", "breakfast"]
}
```

## Error Handling

The function includes error handling for:
- Missing API key
- Invalid input
- API errors
- Rate limiting

## Caching

The function implements an in-memory cache to reduce API calls for repeated inputs. Cache entries expire after 1 hour.
