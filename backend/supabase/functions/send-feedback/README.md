# Send Feedback Function

This Supabase Edge Function handles feedback submissions using the Resend API. It provides a secure way to send user feedback via email without exposing API keys to the client.

## Features

- Secure email sending via Resend API
- Rate limiting to prevent abuse
- Spam detection
- Detailed error handling
- CORS support for cross-origin requests

## Deployment

To deploy this function, run the following command from the project root:

```bash
supabase functions deploy send-feedback --no-verify-jwt
```

## Environment Variables

This function requires the following environment variable to be set in your Supabase project:

```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

You can get a Resend API key by signing up at [resend.com](https://resend.com).

## Usage

The function expects a POST request with the following JSON body:

```json
{
  "subject": "Feedback Category",
  "message": "User feedback message",
  "email": "optional-user@email.com",
  "includeDeviceInfo": true,
  "deviceInfo": {
    "browser": "Chrome",
    "os": "Windows",
    "screen": "1920x1080",
    "version": "1.0.0"
  }
}
```

## Response

Successful response:

```json
{
  "success": true,
  "id": "email_id_from_resend"
}
```

Error response:

```json
{
  "error": "Error message"
}
```
