import { useState, useEffect } from "react";
import { Send, Sun, Moon, Laptop, LogIn, LogOut, User, X, Type, Upload, Download, FileText, Settings } from "lucide-react";
import { ThemeType } from "@/lib/theme-utils";
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
import { trackEvent, identifyUser } from "@/lib/posthog";
import TermsModal from "./TermsModal";
import FeedbackModal from "./FeedbackModal";
import SettingsPanel from "./SettingsPanel";

interface SettingsMenuProps {
  onExportMarkdown?: () => void;
  onImportMarkdown?: () => void;
}

const SettingsMenu = ({ onExportMarkdown, onImportMarkdown }: SettingsMenuProps) => {
  const [theme, setTheme] = useState<ThemeType>('auto');
  const [font, setFont] = useState<FontOption>(getCurrentFont());
  const [systemIsDark, setSystemIsDark] = useState<boolean>(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const { user, signIn, signOut } = useAuth();
  const { toast } = useToast();
  
  // State for feedback modal
  const [showFeedback, setShowFeedback] = useState(false);
  
  // State for Terms modal
  const [showTerms, setShowTerms] = useState(false);
  
  // State for Settings panel
  const [showSettings, setShowSettings] = useState(false);
  
  // Listen for openTermsModal event
  useEffect(() => {
    const handleOpenTermsModal = () => {
      setShowTerms(true);
    };
    
    window.addEventListener('openTermsModal', handleOpenTermsModal);
    return () => {
      window.removeEventListener('openTermsModal', handleOpenTermsModal);
    };
  }, []);

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
    if (savedTheme) {
      if (savedTheme === 'dark') {
        // Migrate old 'dark' theme to 'darker'
        setTheme('darker');
      } else if (savedTheme === 'light') {
        // Migrate old 'light' theme to 'lighter'
        setTheme('lighter');
      } else if (['lighter', 'lightest', 'darker', 'darkest', 'auto'].includes(savedTheme)) {
        setTheme(savedTheme as ThemeType);
      }
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
      
      // Track theme change with PostHog
      trackEvent('theme_changed', { theme: 'auto', system_dark_mode: isDarkMode });
    } else {
      // Update document theme and favicon based on explicit theme setting
      updateDocumentTheme(theme);
      updateFavicon(theme);
      
      localStorage.setItem("theme", theme);
      
      // Update theme in database if user is logged in
      updateUserTheme(theme);
      
      // Track theme change with PostHog
      trackEvent('theme_changed', { theme });
    }
  }, [theme]);

  // Apply font
  useEffect(() => {
    // Update document font
    updateDocumentFont(font);
    
    // Update font in database if user is logged in
    updateUserFont(font);
    
    // Track font change with PostHog
    trackEvent('font_changed', { font });
  }, [font]);

  // Update user theme in database if logged in
  const updateUserTheme = async (newTheme: string) => {
    if (user) {
      try {
        // Map the new theme values to ones compatible with the database constraint
        // The database likely has a check constraint that only allows 'light', 'dark', or 'auto'
        let dbTheme = newTheme;
        if (newTheme === 'lighter' || newTheme === 'lightest') {
          dbTheme = 'light';
        } else if (newTheme === 'darker' || newTheme === 'darkest') {
          dbTheme = 'dark';
        }
        
        const { error } = await supabase
          .from('profiles')
          .update({ theme: dbTheme, updated_at: new Date().toISOString() })
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
      
      // Track successful sign-in with PostHog
      trackEvent('user_signed_in', { method: 'google' });
      
      // If sign-in was successful and we have a user, identify them in PostHog
      if (user) {
        identifyUser(user.id, {
          email: user.email,
          name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url
        });
      }
    } catch (error: any) {
      console.error("Sign in failed:", error.message || "Could not sign in with Google");
      
      // Track failed sign-in
      trackEvent('user_sign_in_failed', { error: error.message || 'Unknown error' });
    }
  };

  const handleSignOut = async () => {
    try {
      // Track sign-out before the actual sign-out happens
      trackEvent('user_signed_out');
      
      await signOut();
      console.log("Signed out successfully");
    } catch (error: any) {
      console.error("Sign out failed:", error.message || "Could not sign out");
      
      // Track failed sign-out
      trackEvent('user_sign_out_failed', { error: error.message || 'Unknown error' });
    }
  };

  // Get user avatar URL if available
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  const openFeedbackForm = () => {
    setShowFeedback(true);
    setShowTerms(false);
    trackEvent('feedback_dialog_opened');
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-10">
      {/* Feedback Modal */}
      <FeedbackModal 
        open={showFeedback} 
        onOpenChange={setShowFeedback} 
        userEmail={user?.email} 
      />
      
      {/* Terms Modal */}
      <TermsModal 
        open={showTerms} 
        onOpenChange={setShowTerms} 
        onFeedbackClick={openFeedbackForm}
      />
      
      {/* Settings Panel */}
      <SettingsPanel
        open={showSettings}
        onOpenChange={setShowSettings}
        currentTheme={theme}
        onThemeChange={setTheme}
        currentFont={font}
        onFontChange={setFont}
      />
      
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
          <DropdownMenuItem onSelect={() => {
            setShowFeedback(true);
            trackEvent('feedback_dialog_opened');
          }}>
            <Send className="mr-2 h-4 w-4" />
            Give Feedback
          </DropdownMenuItem>
          
          {/* Terms & Conditions Menu Item */}
          <DropdownMenuItem onSelect={() => {
            setShowTerms(true);
            trackEvent('terms_viewed');
          }}>
            <FileText className="mr-2 h-4 w-4" />
            Terms & Conditions
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => {
              if (onExportMarkdown) {
                onExportMarkdown();
                trackEvent('export_markdown');
              }
            }}>
              <Download className="mr-2 h-4 w-4" />
              Export (.md)
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => {
              if (onImportMarkdown) {
                onImportMarkdown();
                trackEvent('import_markdown');
              }
            }}>
              <Upload className="mr-2 h-4 w-4" />
              Import (.md)
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {theme === 'lighter' && <Sun className="mr-2 h-4 w-4" />}
              {theme === 'lightest' && <Sun className="mr-2 h-4 w-4 opacity-80" />}
              {theme === 'darker' && <Moon className="mr-2 h-4 w-4" />}
              {theme === 'darkest' && <Moon className="mr-2 h-4 w-4 opacity-80" />}
              {theme === 'auto' && <Laptop className="mr-2 h-4 w-4" />}
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent  className="min-w-[180px]">
              <DropdownMenuItem onClick={() => {
                setTheme('lighter');
                trackEvent('theme_menu_selected', { theme: 'lighter' });
              }}>
                <Sun className="mr-2 h-4 w-4" />
                Lighter
                {theme === 'lighter' && <span className="ml-auto pl-2">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setTheme('lightest');
                trackEvent('theme_menu_selected', { theme: 'lightest' });
              }}>
                <Sun className="mr-2 h-4 w-4 opacity-80" />
                Lightest
                {theme === 'lightest' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => {
                setTheme('darker');
                trackEvent('theme_menu_selected', { theme: 'darker' });
              }}>
                <Moon className="mr-2 h-4 w-4" />
                Darker
                {theme === 'darker' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setTheme('darkest');
                trackEvent('theme_menu_selected', { theme: 'darkest' });
              }}>
                <Moon className="mr-2 h-4 w-4 opacity-80" />
                Darkest
                {theme === 'darkest' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => {
                setTheme('auto');
                trackEvent('theme_menu_selected', { theme: 'auto' });
              }}>
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
            <DropdownMenuSubContent className="min-w-[180px]">
              <DropdownMenuItem onClick={() => setFont('system-ui')}>
                System UI
                {font === 'system-ui' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFont('geist')}>
                Geist
                {font === 'geist' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFont('geist-mono')}>
                Geist Mono
                {font === 'geist-mono' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFont('jetbrains-mono')}>
                JetBrains Mono
                {font === 'jetbrains-mono' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSeparator />

          {/* Settings Menu Item */}
          <DropdownMenuItem onSelect={() => {
            setShowSettings(true);
            trackEvent('settings_opened');
          }}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          
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
