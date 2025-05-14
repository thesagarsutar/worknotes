import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Loader2, Upload, Image as ImageIcon, X as XIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/posthog";
import { supabase } from "@/integrations/supabase/client";
import { APP_NAME } from "@/lib/env";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
}

interface DeviceInfo {
  browser: string;
  os: string;
  screen: string;
  version: string;
}

interface AttachedImage {
  file: File;
  preview: string;
  id: string;
  size: number;
}

const FEEDBACK_CATEGORIES = [
  { value: "general", label: "General Feedback" },
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "usability", label: "Usability Issue" },
  { value: "other", label: "Other" }
];

const FeedbackModal = ({ open, onOpenChange, userEmail }: FeedbackModalProps) => {
  const [subject, setSubject] = useState<string>("general");
  const [message, setMessage] = useState<string>("");
  const [email, setEmail] = useState<string>(userEmail || "");
  const [includeDeviceInfo, setIncludeDeviceInfo] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [totalSize, setTotalSize] = useState<number>(0); // Total size in bytes
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Maximum allowed size (10MB in bytes)
  const MAX_SIZE = 10 * 1024 * 1024;

  // Update email field if userEmail prop changes
  useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  // Reset form when modal is opened
  useEffect(() => {
    if (open) {
      setSubject("general");
      setMessage("");
      setEmail(userEmail || "");
      setIncludeDeviceInfo(true);
      setSubmitSuccess(false);
      setSubmitError(null);
      setAttachedImages([]);
    }
  }, [open, userEmail]);
  
  // Cleanup image previews when component unmounts
  useEffect(() => {
    return () => {
      // Revoke object URLs to avoid memory leaks
      attachedImages.forEach(image => URL.revokeObjectURL(image.preview));
    };
  }, [attachedImages]);

  // Collect device information
  const getDeviceInfo = (): DeviceInfo => {
    const userAgent = navigator.userAgent;
    const browserInfo = (() => {
      if (userAgent.indexOf("Chrome") > -1) return "Chrome";
      if (userAgent.indexOf("Safari") > -1) return "Safari";
      if (userAgent.indexOf("Firefox") > -1) return "Firefox";
      if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) return "Internet Explorer";
      if (userAgent.indexOf("Edge") > -1) return "Edge";
      return "Unknown";
    })();

    const osInfo = (() => {
      if (userAgent.indexOf("Windows") > -1) return "Windows";
      if (userAgent.indexOf("Mac") > -1) return "macOS";
      if (userAgent.indexOf("Linux") > -1) return "Linux";
      if (userAgent.indexOf("Android") > -1) return "Android";
      if (userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) return "iOS";
      return "Unknown";
    })();

    return {
      browser: browserInfo,
      os: osInfo,
      screen: `${window.screen.width}x${window.screen.height}`,
      version: APP_NAME
    };
  };

  // Calculate total size of message and images
  const calculateTotalSize = useCallback((message: string, images: AttachedImage[]) => {
    // Estimate message size (2 bytes per character is a safe estimate for UTF-16)
    const messageSize = message.length * 2;
    
    // Calculate total image size
    const imagesSize = images.reduce((total, img) => total + (img.file?.size || 0), 0);
    
    // Total size in bytes
    return messageSize + imagesSize;
  }, []);

  // Update size warning based on total size
  const updateSizeWarning = useCallback((size: number) => {
    const sizeMB = size / (1024 * 1024);
    if (size > MAX_SIZE) {
      setSizeWarning(`Total size exceeds 10MB limit (${sizeMB.toFixed(2)}MB). Please remove some images.`);
    } else if (size > MAX_SIZE * 0.8) {
      setSizeWarning(`Warning: Approaching 10MB limit (${sizeMB.toFixed(2)}MB / 10MB)`);
    } else {
      setSizeWarning(null);
    }
  }, [MAX_SIZE]);

  // Update total size whenever message or images change
  useEffect(() => {
    const newTotalSize = calculateTotalSize(message, attachedImages);
    setTotalSize(newTotalSize);
    updateSizeWarning(newTotalSize);
  }, [message, attachedImages, calculateTotalSize, updateSizeWarning]);
  
  // Handle clipboard paste for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Check if the paste event has items (files, images, etc.)
      if (e.clipboardData && e.clipboardData.items) {
        // Get the items from the clipboard
        const items = e.clipboardData.items;
        
        // Loop through the items to find images
        for (let i = 0; i < items.length; i++) {
          // Check if the item is an image
          if (items[i].type.indexOf('image') !== -1) {
            // Prevent the default paste behavior
            e.preventDefault();
            
            // Get the file from the clipboard item
            const file = items[i].getAsFile();
            if (file) {
              // Check file size (limit to 5MB)
              if (file.size > 5 * 1024 * 1024) {
                toast({
                  title: "File too large",
                  description: "Image must be less than 5MB",
                  variant: "destructive"
                });
                return;
              }
              
              // Check if adding this image would exceed the 5 image limit
              if (attachedImages.length >= 5) {
                toast({
                  title: "Too many images",
                  description: "You can attach up to 5 images",
                  variant: "destructive"
                });
                return;
              }
              
              // Convert file to data URL directly instead of using blob URL
              const reader = new FileReader();
              reader.onload = (event) => {
                if (event.target?.result) {
                  const dataUrl = event.target.result as string;
                  
                  // Create a new image with the data URL
                  const newImage: AttachedImage = {
                    file,
                    preview: dataUrl, // Use data URL instead of blob URL
                    id: `pasted-image-${Date.now()}`,
                    size: file.size
                  };
                  
                  // Check if total size would exceed 10MB limit
                  const newTotalSize = calculateTotalSize(message, [...attachedImages, newImage]);
                  if (newTotalSize > MAX_SIZE) {
                    toast({
                      title: "Total size too large",
                      description: `Total size would exceed 10MB limit (${(newTotalSize / (1024 * 1024)).toFixed(2)}MB)`,
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Add the image to attached images
                  setAttachedImages(prev => [...prev, newImage]);
                }
              };
              
              // Read the file as a data URL
              reader.readAsDataURL(file);
            }
          }
        }
      }
    };
    
    // Add the paste event listener to the document
    document.addEventListener('paste', handlePaste);
    
    // Clean up the event listener when component unmounts
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [attachedImages, message, toast, calculateTotalSize, MAX_SIZE]);

  // Handle image attachment
  const handleImageAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Validate files first
    const validFiles: File[] = [];
    
    Array.from(e.target.files).forEach(file => {
      // Only accept images
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Only image files are allowed",
          variant: "destructive"
        });
        return;
      }
      
      // Check file size (limit to 5MB per image)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Each image must be less than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      validFiles.push(file);
    });
    
    // Check if adding these files would exceed the 5 image limit
    if (attachedImages.length + validFiles.length > 5) {
      toast({
        title: "Too many images",
        description: "You can attach up to 5 images",
        variant: "destructive"
      });
      return;
    }
    
    // Process each valid file
    validFiles.forEach(file => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          
          // Create a new image with the data URL
          const newImage: AttachedImage = {
            file,
            preview: dataUrl, // Use data URL instead of blob URL
            id: `${file.name}-${Date.now()}`,
            size: file.size
          };
          
          // Check if total size would exceed 10MB limit
          const newTotalSize = calculateTotalSize(message, [...attachedImages, newImage]);
          if (newTotalSize > MAX_SIZE) {
            toast({
              title: "Total size too large",
              description: `Total size would exceed 10MB limit (${(newTotalSize / (1024 * 1024)).toFixed(2)}MB)`,
              variant: "destructive"
            });
            return;
          }
          
          // Add the image to attached images
          setAttachedImages(prev => [...prev, newImage]);
        }
      };
      
      // Read the file as a data URL
      reader.readAsDataURL(file);
    });
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove an attached image
  const removeImage = (id: string) => {
    const imageToRemove = attachedImages.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    setAttachedImages(attachedImages.filter(img => img.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }
    
    // Check if total size exceeds 10MB limit
    if (totalSize > MAX_SIZE) {
      toast({
        title: "Total size too large",
        description: `Total size exceeds 10MB limit (${(totalSize / (1024 * 1024)).toFixed(2)}MB)`,
        variant: "destructive"
      });
      return;
    }
    
    setSubmitError(null);
    setIsSubmitting(true);
    
    try {
      // Get the selected category label
      const categoryLabel = FEEDBACK_CATEGORIES.find(cat => cat.value === subject)?.label || "General Feedback";
      
      // Prepare image data for sending - all images are now stored as data URLs
      const imageData = attachedImages.map(image => ({
        dataUrl: image.preview, // Already a data URL
        file: {
          name: image.file.name,
          type: image.file.type,
          size: image.file.size
        }
      }));
      
      // Prepare the request payload
      const payload = {
        subject: categoryLabel,
        message,
        email: email.trim() || undefined,
        includeDeviceInfo,
        deviceInfo: includeDeviceInfo ? getDeviceInfo() : undefined,
        attachedImages: imageData
      };

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-feedback', {
        body: payload
      });

      if (error) {
        // Handle Supabase function invocation error
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to send feedback');
      }

      // Check for errors returned by the function itself
      if (data && data.error) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error);
      }

      // Success
      setSubmitSuccess(true);
      toast({
        title: "Feedback sent",
        description: "Thank you for your feedback!"
      });

      // Track successful feedback submission
      trackEvent('feedback_submitted_successfully', {
        category: subject,
        had_attachments: attachedImages.length > 0
      });

      // Close the form automatically after success
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error('Feedback submission error:', error);
      
      // Set the error message to display in the UI
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setSubmitError(errorMessage);
      
      toast({
        title: "Failed to send feedback",
        description: errorMessage,
        variant: "destructive"
      });

      // Track failed feedback submission
      trackEvent('feedback_submission_failed', {
        category: subject,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Send Feedback</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Category</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="message">Message</Label>
            <div className="relative">
              <Textarea
                id="message"
                placeholder="Share your thoughts, ideas, or report an issue..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[150px] resize-y pb-10"
                required
              />
              
              {/* Floating image attachment button */}
              <div className="absolute bottom-2 right-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageAttachment}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachedImages.length >= 5}
                  className="h-8 w-8 rounded-full bg-background/80 hover:bg-background border shadow-sm flex items-center justify-center"
                  title="Add images (max 5)"
                >
                  <ImageIcon className="h-4 w-4" />
                  {attachedImages.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
                      {attachedImages.length}
                    </span>
                  )}
                </Button>
              </div>
              
              {/* Image previews at the bottom of the textarea */}
              {attachedImages.length > 0 && (
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {attachedImages.map((image) => (
                    <div 
                      key={image.id} 
                      className="relative group"
                    >
                      <div 
                        className="h-8 w-8 rounded-md border bg-background/80 overflow-hidden cursor-pointer"
                        title={image.file.name}
                      >
                        <img 
                          src={image.preview} 
                          alt={image.file.name}
                          className="h-full w-full object-cover" 
                        />
                      </div>
                      
                      {/* Delete button on hover */}
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XIcon className="h-2 w-2" />
                      </button>
                      
                      {/* Large preview on hover */}
                      <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        <div className="bg-popover border rounded-md p-1 shadow-md">
                          <img 
                            src={image.preview} 
                            alt={image.file.name}
                            className="max-h-[150px] max-w-[200px] object-contain" 
                          />
                          <p className="text-xs text-center mt-1 max-w-[200px] truncate">{image.file.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Small helper text below textarea */}
            {attachedImages.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {attachedImages.length} {attachedImages.length === 1 ? 'image' : 'images'} attached (max 5MB each)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1">
              Email Address <span className="text-sm text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Provide your email if you'd like us to follow up with you.
            </p>
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="deviceInfo"
              checked={includeDeviceInfo}
              onCheckedChange={(checked) => setIncludeDeviceInfo(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="deviceInfo"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include device information
              </Label>
              <p className="text-xs text-muted-foreground">
                This helps us troubleshoot issues by including your browser, operating system, and screen size.
              </p>
            </div>
          </div>

          {/* Error message display */}
          {submitError && (
            <div className="bg-red-50 p-3 rounded-md mb-4 border border-red-200">
              <p className="text-red-800 text-sm font-medium">Error: {submitError}</p>
              <p className="text-red-700 text-xs mt-1">
                If this error persists, please email us directly at{' '}
                <a href="mailto:hello@worknotes.xyz" className="underline">
                  hello@worknotes.xyz
                </a>
              </p>
            </div>
          )}
          
          {sizeWarning && (
            <div className="bg-amber-50 p-3 rounded-md mb-4 border border-amber-200">
              <p className="text-amber-800 text-sm font-medium">{sizeWarning}</p>
              <p className="text-amber-700 text-xs mt-1">
                Total size of message and images must be under 10MB to submit feedback.
              </p>
            </div>
          )}

          <div className="pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                You can also email us at <span className="font-medium">hello@worknotes.xyz</span>
              </p>
              
              <Button 
                type="submit" 
                disabled={isSubmitting || submitSuccess || totalSize > MAX_SIZE}
                title={totalSize > MAX_SIZE ? 'Total size exceeds 10MB limit' : ''}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : submitSuccess ? (
                  "Sent!"
                ) : (
                  "Send Feedback"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
