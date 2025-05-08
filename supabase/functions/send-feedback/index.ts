// @ts-nocheck
// Supabase Edge Function for sending feedback via Resend API

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds
const MAX_REQUESTS_PER_WINDOW = 5; // Maximum 5 feedback submissions per hour

// Simple in-memory rate limiting (will reset on function restart)
const rateLimitMap = new Map<string, { count: number, timestamp: number }>();

// Check if a request is rate limited
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return false;
  }
  
  // If the window has expired, reset the counter
  if (now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return false;
  }
  
  // Increment the counter and check if it exceeds the limit
  record.count += 1;
  rateLimitMap.set(ip, record);
  
  return record.count > MAX_REQUESTS_PER_WINDOW;
}

// Simple spam detection
function isSpam(message: string): boolean {
  // Check for common spam patterns
  const spamPatterns = [
    /\b(viagra|cialis|casino|lottery|prize|winner|\$\$\$)\b/i,
    /\b(crypto|bitcoin|ethereum|investment opportunity)\b/i,
    /\bhttps?:\/\/(?!worknotes\.xyz)[^\s]+\b/i, // Links not to worknotes.xyz
  ];
  
  return spamPatterns.some(pattern => pattern.test(message));
}

// Process image attachments for Resend API
function processAttachments(attachedImages: any[] = []) {
  if (!attachedImages || !Array.isArray(attachedImages) || attachedImages.length === 0) {
    return [];
  }
  
  return attachedImages.map((image, index) => {
    // Extract the base64 content from the dataUrl
    // Format is typically: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/...
    let content = image.dataUrl;
    
    // If the dataUrl includes the data:image prefix, extract just the base64 part
    if (content.includes('base64,')) {
      content = content.split('base64,')[1];
    }
    
    // Get file extension from the image type or default to jpg
    const fileType = image.file?.type || 'image/jpeg';
    const extension = fileType.split('/')[1] || 'jpg';
    
    return {
      filename: `attachment-${index + 1}.${extension}`,
      content: content,
    };
  });
}

// Create HTML for embedded images in the email
function createImageGalleryHTML(attachedImages: any[] = []) {
  if (!attachedImages || !Array.isArray(attachedImages) || attachedImages.length === 0) {
    return '';
  }
  
  // Start with a container for the images
  let galleryHTML = `
    <div style="margin-top: 25px; margin-bottom: 25px;">
      <h3>Attached Images:</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;">
  `;
  
  // Add each image with a consistent style
  attachedImages.forEach((image, index) => {
    // Get file name or use a default
    const fileName = image.file?.name || `Image ${index + 1}`;
    
    // Add the image in a container with caption
    galleryHTML += `
      <div style="border: 1px solid #e2e8f0; border-radius: 5px; padding: 10px; width: 250px;">
        <img 
          src="${image.dataUrl}" 
          alt="${fileName}" 
          style="max-width: 100%; max-height: 200px; display: block; margin: 0 auto; border-radius: 3px;"
        />
        <p style="margin-top: 8px; font-size: 12px; color: #4a5568; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${fileName}
        </p>
      </div>
    `;
  });
  
  // Close the container
  galleryHTML += `
      </div>
    </div>
  `;
  
  return galleryHTML;
}

// Main function to handle requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limiting
    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Parse the request body
    const { subject, message, email, includeDeviceInfo, deviceInfo, attachedImages } = await req.json();
    
    // Validate required fields
    if (!subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Subject and message are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Check for spam
    if (isSpam(message)) {
      return new Response(
        JSON.stringify({ error: 'Your message was flagged as potential spam. Please revise and try again.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.error('No Resend API key found');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Prepare email content
    const timestamp = new Date().toISOString();
    const techInfo = includeDeviceInfo && deviceInfo ? `
      <h3>Technical Information:</h3>
      <p>Browser: ${deviceInfo.browser || 'Not provided'}</p>
      <p>OS: ${deviceInfo.os || 'Not provided'}</p>
      <p>Screen Size: ${deviceInfo.screen || 'Not provided'}</p>
      <p>App Version: ${deviceInfo.version || 'Not provided'}</p>
    ` : '';
    
    // Create image gallery HTML if there are attached images
    const imageGallery = attachedImages && attachedImages.length > 0 
      ? createImageGalleryHTML(attachedImages)
      : '';
    
    const emailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #4a5568; border-bottom: 1px solid #eee; padding-bottom: 10px;">WorkNotes Feedback: ${subject}</h2>
            
            <div style="margin-top: 20px;">
              <h3>Message:</h3>
              <p style="white-space: pre-line;">${message}</p>
            </div>
            
            ${imageGallery}
            
            ${email ? `<p><strong>Reply to:</strong> ${email}</p>` : ''}
            ${techInfo}
            
            <p style="margin-top: 30px; font-size: 12px; color: #718096;">
              Submitted on: ${timestamp}
            </p>
          </div>
        </body>
      </html>
    `;
    
    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Worknotes Feedback <noreply@feedback.worknotes.xyz>',
        to: 'hello@worknotes.xyz',
        subject: `WorkNotes Feedback: ${subject}`,
        html: emailContent,
        reply_to: email || 'noreply@feedback.worknotes.xyz',
        attachments: processAttachments(attachedImages),
      }),
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to send feedback';
      let errorDetails = null;
      
      try {
        // Try to parse the error response as JSON
        const errorJson = await response.json();
        console.error('Resend API error:', JSON.stringify(errorJson));
        
        // Extract error message from Resend API response if available
        if (errorJson.error) {
          if (typeof errorJson.error === 'string') {
            errorMessage = errorJson.error;
          } else if (errorJson.error.message) {
            errorMessage = errorJson.error.message;
          }
        }
        
        errorDetails = errorJson;
      } catch (e) {
        // If not JSON, get as text
        const errorText = await response.text();
        console.error('Resend API error (text):', errorText);
        errorDetails = { raw: errorText };
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorDetails,
          status: response.status
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const data = await response.json();
    
    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-feedback function:', error);
    
    // Create a more detailed error response
    const errorResponse = {
      error: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      errorType: error.name || 'UnknownError',
      // Include stack trace in development only
      ...(Deno.env.get('ENVIRONMENT') === 'development' && { stack: error.stack })
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
