import { useState, useEffect } from "react";
import { Send, Sun, Moon, Laptop, LogIn, LogOut, User, Download, UploadCloud, X, Type } from "lucide-react";
import { FontOption, updateDocumentFont, getCurrentFont } from "@/lib/font-utils";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { updateFavicon, updateDocumentTheme } from "@/lib/theme-utils";
import { Textarea } from "@/components/ui/textarea";

interface SettingsMenuProps {
  onExportMarkdown?: () => void;
  onImportMarkdown?: () => void;
}

const SettingsMenu = ({ onExportMarkdown, onImportMarkdown }: SettingsMenuProps) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [font, setFont] = useState<FontOption>(getCurrentFont());
  const [systemIsDark, setSystemIsDark] = useState<boolean>(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const { user, signIn, signOut } = useAuth();
  const { toast } = useToast();
  
  // State for feedback form
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Set up system theme change detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Initial check
    setSystemIsDark(mediaQuery.matches);
    
    // Add listener for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
      
      // If in auto mode, update both favicon and document theme based on new system preference
      if (theme === 'auto') {
        updateFavicon('auto', e.matches);
        updateDocumentTheme('auto', e.matches);
      }
    };
    
    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  // Initialize theme based on system preference or stored preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setTheme(savedTheme as 'light' | 'dark' | 'auto');
    }
  }, []);

  // Apply theme
  useEffect(() => {
    if (theme === 'auto') {
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Update document theme and favicon based on system preference
      updateDocumentTheme('auto', isDarkMode);
      updateFavicon('auto', isDarkMode);
      
      localStorage.setItem("theme", "auto");
      
      // Update theme in database if user is logged in
      updateUserTheme("auto");
    } else {
      // Update document theme and favicon based on explicit theme setting
      updateDocumentTheme(theme);
      updateFavicon(theme);
      
      localStorage.setItem("theme", theme);
      
      // Update theme in database if user is logged in
      updateUserTheme(theme);
    }
  }, [theme]);

  // Apply font
  useEffect(() => {
    // Update document font
    updateDocumentFont(font);
    
    // Update font in database if user is logged in
    updateUserFont(font);
  }, [font]);

  // Update user theme in database if logged in
  const updateUserTheme = async (newTheme: string) => {
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ theme: newTheme, updated_at: new Date().toISOString() })
          .eq('id', user.id);
          
        if (error) {
          console.error("Error updating theme:", error);
        }
      } catch (err) {
        console.error("Error updating theme:", err);
      }
    }
  };
  
  // Update user font in database if logged in
  const updateUserFont = async (newFont: string) => {
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ font: newFont, updated_at: new Date().toISOString() })
          .eq('id', user.id);
          
        if (error) {
          console.error("Error updating font:", error);
        }
      } catch (err) {
        console.error("Error updating font:", err);
      }
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error: any) {
      console.error("Sign in failed:", error.message || "Could not sign in with Google");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      console.log("Signed out successfully");
    } catch (error: any) {
      console.error("Sign out failed:", error.message || "Could not sign out");
    }
  };

  // Get user avatar URL if available
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      toast({
        title: "Please enter your feedback",
        variant: "destructive"
      });
      return;
    }
    
    setFeedbackSubmitting(true);
    
    try {
      // Create a FormData object to send the email
      const formData = new FormData();
      formData.append('message', feedbackMessage);
      formData.append('to', 'hello@worknotes.xyz');
      formData.append('subject', 'Feedback for Worknotes app');
      
      // In a real app, you would send this to your backend API
      // For example: await fetch('/api/send-feedback', { method: 'POST', body: formData });
      
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Open the default email client as a fallback method
      const mailtoLink = `mailto:hello@worknotes.xyz?subject=${encodeURIComponent('Feedback for Worknotes app')}&body=${encodeURIComponent(feedbackMessage)}`;
      window.open(mailtoLink);
      
      toast({
        title: "Feedback sent",
        description: "Thank you for your feedback!"
      });
      
      // Reset the form
      setFeedbackMessage('');
      setShowFeedback(false);
    } catch (error) {
      toast({
        title: "Failed to send feedback",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setFeedbackSubmitting(false);
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-10">
      {/* Feedback Modal (without overlay) */}
      {showFeedback && (
        <div className="fixed bottom-4 right-4 z-50 w-80 p-5 shadow-lg border bg-background rounded-md">
          <button 
            onClick={() => setShowFeedback(false)}
            className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium">Feedback</h3>
              <p className="text-xs text-muted-foreground">
                Help us improve by sharing your thoughts, ideas, or reporting issues.
              </p>
            </div>
            <Textarea 
              placeholder="What's in your mind?"
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              className="min-h-[120px]"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                You can also email us at{' '}
                <span className="select-text">hello@worknotes.xyz</span>
              </div>
              <Button 
                size="sm" 
                type="submit" 
                disabled={feedbackSubmitting} 
                onClick={handleSubmitFeedback}
              >
                {feedbackSubmitting ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {user ? (
            <Avatar className="cursor-pointer h-6 w-6">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="User avatar" />
              ) : null}
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-4 h-4 rounded-full bg-gray-400 opacity-50 hover:opacity-90 transition-opacity cursor-pointer"></div>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          {/* Give Feedback Menu Item */}
          <DropdownMenuItem onSelect={() => setShowFeedback(true)}>
            <Send className="mr-2 h-4 w-4" />
            Give Feedback
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Download className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={onExportMarkdown}>
                  Export as markdown
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            <DropdownMenuItem onClick={onImportMarkdown}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Import
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {theme === 'light' && <Sun className="mr-2 h-4 w-4" />}
              {theme === 'dark' && <Moon className="mr-2 h-4 w-4" />}
              {theme === 'auto' && <Laptop className="mr-2 h-4 w-4" />}
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
                {theme === 'light' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
                {theme === 'dark' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('auto')}>
                <Laptop className="mr-2 h-4 w-4" />
                Auto
                {theme === 'auto' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Type className="mr-2 h-4 w-4" />
              Font
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setFont('system-ui')}>
                System UI
                {font === 'system-ui' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFont('ibm-plex-sans')}>
                IBM Plex Sans
                {font === 'ibm-plex-sans' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFont('jetbrains-mono')}>
                JetBrains Mono
                {font === 'jetbrains-mono' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSeparator />
          
          {user ? (
            <>
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={handleSignIn}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in with Google
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SettingsMenu;