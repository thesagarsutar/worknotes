
import { useState, useEffect } from "react";
import { Settings, Sun, Moon, Laptop, LogIn, LogOut, User, Download, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
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
import { updateFavicon } from "@/lib/theme-utils";

interface SettingsMenuProps {
  onExportMarkdown?: () => void;
  onImportMarkdown?: () => void;
}

const SettingsMenu = ({ onExportMarkdown, onImportMarkdown }: SettingsMenuProps) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [systemIsDark, setSystemIsDark] = useState<boolean>(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const { user, signIn, signOut } = useAuth();
  const { toast } = useToast();

  // Set up system theme change detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Initial check
    setSystemIsDark(mediaQuery.matches);
    
    // Add listener for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
      
      // If in auto mode, update favicon based on new system preference
      if (theme === 'auto') {
        updateFavicon('auto', e.matches);
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
      document.documentElement.classList.toggle('dark', isDarkMode);
      localStorage.setItem("theme", "auto");
      
      // Update favicon based on system preference
      updateFavicon('auto', isDarkMode);
      
      // Update theme in database if user is logged in
      updateUserTheme("auto");
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem("theme", theme);
      
      // Update favicon based on explicit theme
      updateFavicon(theme);
      
      // Update theme in database if user is logged in
      updateUserTheme(theme);
    }
  }, [theme]);

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

  return (
    <div className="fixed bottom-4 right-4 z-10">
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
            <Button size="icon" variant="ghost" className="rounded-full w-10 h-10 p-0">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Open settings</span>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>Settings</DropdownMenuLabel>
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
