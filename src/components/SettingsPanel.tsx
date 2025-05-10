import { useState } from "react";
import { Check, Sparkles, Volume2, User, AlertTriangle, Palette, Mail, Edit, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeType } from "@/lib/theme-utils";
import { FontOption } from "@/lib/font-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/posthog";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTheme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  currentFont: FontOption;
  onFontChange: (font: FontOption) => void;
}

const SettingsPanel = ({
  open,
  onOpenChange,
  currentTheme,
  onThemeChange,
  currentFont,
  onFontChange
}: SettingsPanelProps) => {
  const { user, signIn, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("appearance");
  const [soundsEnabled, setSoundsEnabled] = useState(localStorage.getItem('soundsEnabled') !== 'false');
  const [taskAddSoundEnabled, setTaskAddSoundEnabled] = useState(localStorage.getItem('taskAddSoundEnabled') !== 'false');
  const [taskCompleteSoundEnabled, setTaskCompleteSoundEnabled] = useState(localStorage.getItem('taskCompleteSoundEnabled') !== 'false');
  const [taskUncheckSoundEnabled, setTaskUncheckSoundEnabled] = useState(localStorage.getItem('taskUncheckSoundEnabled') !== 'false');
  const [appRefreshSoundEnabled, setAppRefreshSoundEnabled] = useState(localStorage.getItem('appRefreshSoundEnabled') !== 'false');
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(localStorage.getItem('aiSuggestionsEnabled') !== 'false');
  
  // Get user information from Google sign-in
  const userFullName = user?.user_metadata?.full_name || '';
  const userEmail = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  const userInitial = userFullName ? userFullName.charAt(0).toUpperCase() : '?';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[720px] max-w-[720px] p-0 overflow-hidden" style={{ height: '480px', maxHeight: '480px', minHeight: '480px', width: '720px', maxWidth: '720px', minWidth: '720px' }}>
        <div className="flex flex-col h-full">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar with tabs */}
            <div className="w-[180px] p-6">
              <div>
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => setActiveTab("appearance")}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 text-sm transition-colors rounded-md w-full",
                      activeTab === "appearance" 
                        ? "bg-accent text-accent-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Palette className="h-4 w-4" />
                    Appearance
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("sounds")}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 text-sm transition-colors rounded-md w-full",
                      activeTab === "sounds" 
                        ? "bg-accent text-accent-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Volume2 className="h-4 w-4" />
                    Sounds
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("experimental")}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 text-sm transition-colors rounded-md w-full",
                      activeTab === "experimental" 
                        ? "bg-accent text-accent-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Sparkles className="h-4 w-4" />
                    Experimental
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 text-sm transition-colors rounded-md w-full",
                      activeTab === "profile" 
                        ? "bg-accent text-accent-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <User className="h-4 w-4" />
                    Account
                  </button>
                </div>
              </div>
            </div>
            
            {/* Right content area */}
            <div className="flex-1 p-6" style={{ maxHeight: 'calc(100% - 10px)', overflowY: 'auto', msOverflowStyle: 'auto', scrollbarWidth: 'auto' }}>
              {/* Appearance Tab */}
              {activeTab === "appearance" && (
                <div className="space-y-6 pb-10">
                  <div>
                    <h2 className="text-lg font-medium mb-4">Theme</h2>
                    <div className="relative w-full border rounded-md">
                      <Select
                        value={currentTheme}
                        onValueChange={(value) => {
                          onThemeChange(value as ThemeType);
                          trackEvent('theme_changed', { theme: value });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto (System)</SelectItem>
                          <SelectItem value="lighter">Lighter</SelectItem>
                          <SelectItem value="lightest">Lightest</SelectItem>
                          <SelectItem value="darker">Darker</SelectItem>
                          <SelectItem value="darkest">Darkest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-medium mb-4">Font</h2>
                    <div className="relative w-full border rounded-md">
                      <Select
                        value={currentFont}
                        onValueChange={(value) => {
                          onFontChange(value as FontOption);
                          trackEvent('font_changed', { font: value });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system-ui">System UI</SelectItem>
                          <SelectItem value="geist">Geist</SelectItem>
                          <SelectItem value="geist-mono">Geist Mono</SelectItem>
                          <SelectItem value="jetbrains-mono">JetBrains Mono</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Sounds Tab */}
              {activeTab === "sounds" && (
                <div className="space-y-6 pb-10">
                  {/* Master Sound Toggle */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Enable Sound Effects</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Toggle all sound effects in the application.
                        </p>
                      </div>
                      <div className="ml-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={soundsEnabled}
                            onChange={(e) => {
                              const isEnabled = e.target.checked;
                              setSoundsEnabled(isEnabled);
                              localStorage.setItem('soundsEnabled', isEnabled.toString());
                              // Dispatch custom event to notify components about the change
                              window.dispatchEvent(new CustomEvent('soundsSettingChanged', { 
                                detail: { enabled: isEnabled } 
                              }));
                              trackEvent('sounds_setting_changed', { enabled: isEnabled });
                            }}
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:bg-green-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Individual Sound Toggles */}
                  <div className="border rounded-lg divide-y">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Task Add Sound</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Subtle sound when adding a new task
                          </p>
                        </div>
                        <div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={taskAddSoundEnabled}
                              onChange={(e) => {
                                const isEnabled = e.target.checked;
                                setTaskAddSoundEnabled(isEnabled);
                                localStorage.setItem('taskAddSoundEnabled', isEnabled.toString());
                                trackEvent('task_add_sound_setting_changed', { enabled: isEnabled });
                              }}
                              disabled={!soundsEnabled}
                            />
                            <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:bg-green-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Task Complete Sound</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Two-tone success sound when completing a task
                          </p>
                        </div>
                        <div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={taskCompleteSoundEnabled}
                              onChange={(e) => {
                                const isEnabled = e.target.checked;
                                setTaskCompleteSoundEnabled(isEnabled);
                                localStorage.setItem('taskCompleteSoundEnabled', isEnabled.toString());
                                trackEvent('task_complete_sound_setting_changed', { enabled: isEnabled });
                              }}
                              disabled={!soundsEnabled}
                            />
                            <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:bg-green-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Task Uncheck Sound</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Reverse two-tone sound when unchecking a task
                          </p>
                        </div>
                        <div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={taskUncheckSoundEnabled}
                              onChange={(e) => {
                                const isEnabled = e.target.checked;
                                setTaskUncheckSoundEnabled(isEnabled);
                                localStorage.setItem('taskUncheckSoundEnabled', isEnabled.toString());
                                trackEvent('task_uncheck_sound_setting_changed', { enabled: isEnabled });
                              }}
                              disabled={!soundsEnabled}
                            />
                            <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:bg-green-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">App Refresh Sound</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Gentle welcome sound when the app refreshes
                          </p>
                        </div>
                        <div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={appRefreshSoundEnabled}
                              onChange={(e) => {
                                const isEnabled = e.target.checked;
                                setAppRefreshSoundEnabled(isEnabled);
                                localStorage.setItem('appRefreshSoundEnabled', isEnabled.toString());
                                trackEvent('app_refresh_sound_setting_changed', { enabled: isEnabled });
                              }}
                              disabled={!soundsEnabled}
                            />
                            <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:bg-green-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Experimental Tab */}
              {activeTab === "experimental" && (
                <div className="space-y-6 pb-10">
                  {/* AI Suggestions Toggle */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium">AI-Powered Suggestions</h3>
                          <Sparkles className="h-4 w-4 text-amber-500" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Enable smart typeahead suggestions powered by AI to help you complete tasks faster.
                        </p>
                      </div>
                      <div className="ml-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={aiSuggestionsEnabled}
                            onChange={(e) => {
                              const isEnabled = e.target.checked;
                              setAiSuggestionsEnabled(isEnabled);
                              localStorage.setItem('aiSuggestionsEnabled', isEnabled.toString());
                              // Dispatch custom event to notify components about the change
                              window.dispatchEvent(new CustomEvent('aiSuggestionsSettingChanged', { 
                                detail: { enabled: isEnabled } 
                              }));
                              trackEvent('ai_suggestions_setting_changed', { enabled: isEnabled });
                            }}
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:bg-green-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      When enabled, your task content may be sent to our AI service to generate relevant suggestions.
                      All data is encrypted and not stored.
                    </div>
                  </div>
                </div>
              )}
              
              {/* Account Tab */}
              {activeTab === "profile" && (
                <div className="space-y-6 pb-10">
                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-6">Account Information</h3>
                    
                    {user ? (
                      <div className="space-y-6">
                        {/* Profile Picture Row */}
                        <div className="flex justify-center mb-6">
                          <Avatar className="h-24 w-24">
                            {avatarUrl ? (
                              <AvatarImage src={avatarUrl} alt="User avatar" />
                            ) : null}
                            <AvatarFallback className="text-xl">{userInitial}</AvatarFallback>
                          </Avatar>
                        </div>
                        
                        {/* Name Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <input
                              id="firstName"
                              className="w-full px-3 py-2 border rounded-md bg-background"
                              value={user.user_metadata?.full_name?.split(' ')[0] || ''}
                              disabled
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <input
                              id="lastName"
                              className="w-full px-3 py-2 border rounded-md bg-background"
                              value={user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || ''}
                              disabled
                            />
                          </div>
                        </div>
                        
                        {/* Email Row */}
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            <input
                              id="email"
                              className="w-full px-3 py-2 border rounded-md bg-background"
                              value={userEmail}
                              disabled
                            />
                          </div>
                        </div>
                        
                        {/* Sign Out Button */}
                        <div className="pt-4">
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={signOut}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-medium mb-2">Not Signed In</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Sign in with Google to sync your tasks across devices and access them from anywhere.
                        </p>
                        <Button 
                          onClick={signIn}
                          className="mx-auto"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Sign In with Google
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsPanel;
