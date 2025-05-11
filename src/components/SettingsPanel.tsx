import { useState } from "react";
import { Check, FlaskConical, Volume2, User, AlertTriangle, Mail, Edit, LogOut } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("sounds");
  const [soundsEnabled, setSoundsEnabled] = useState(localStorage.getItem('soundsEnabled') !== 'false');
  const [taskAddSoundEnabled, setTaskAddSoundEnabled] = useState(localStorage.getItem('taskAddSoundEnabled') !== 'false');
  const [taskCompleteSoundEnabled, setTaskCompleteSoundEnabled] = useState(localStorage.getItem('taskCompleteSoundEnabled') !== 'false');
  const [taskUncheckSoundEnabled, setTaskUncheckSoundEnabled] = useState(localStorage.getItem('taskUncheckSoundEnabled') !== 'false');

  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(localStorage.getItem('aiSuggestionsEnabled') !== 'false');
  
  // Get user information from Google sign-in
  const userFullName = user?.user_metadata?.full_name || '';
  const userEmail = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  const userInitial = userFullName ? userFullName.charAt(0).toUpperCase() : '?';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-32px)] sm:w-full p-0 overflow-hidden md:w-[90vw] lg:w-[720px] min-h-[300px] sm:min-h-[520px]" style={{ 
        height: 'auto', 
        maxHeight: '90vh',
        maxWidth: '720px',
        width: 'calc(100% - 32px)',
        margin: '0 auto'
      }}>
        <div className="flex flex-col h-full">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
            {/* Left sidebar with tabs */}
            <div className="w-full sm:w-[200px] p-4 sm:p-6">
              <div className="w-full">
                <div className="flex flex-row flex-wrap sm:flex-col gap-2 sm:gap-0 sm:space-y-1 pb-2 sm:pb-0">
                  <button
                    onClick={() => setActiveTab("sounds")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 sm:px-2 sm:py-1.5 text-sm transition-colors rounded-md w-full",
                      activeTab === "sounds" 
                        ? "bg-accent text-accent-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Volume2 className="h-5 w-5" />
                    Sounds
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("experimental")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 sm:px-2 sm:py-1.5 text-sm transition-colors rounded-md w-full",
                      activeTab === "experimental" 
                        ? "bg-accent text-accent-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-center" style={{ width: '20px', height: '20px' }}>
                      <FlaskConical className="h-4 w-4" style={{ transform: 'scale(1.2)' }} />
                    </div>
                    Experimental
                  </button>
                  

                  <button
                    onClick={() => setActiveTab("profile")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 sm:px-2 sm:py-1.5 text-sm transition-colors rounded-md w-full",
                      activeTab === "profile" 
                        ? "bg-accent text-accent-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <User className="h-5 w-5" />
                    Account
                  </button>
                </div>
              </div>
            </div>
            
            {/* Right content area */}
            <div className="flex-1 p-4 sm:p-6" style={{ maxHeight: 'calc(100% - 10px)', overflowY: 'auto', msOverflowStyle: 'auto', scrollbarWidth: 'auto' }}>

              
              {/* Sounds Tab */}
              {activeTab === "sounds" && (
                <div className="space-y-6 pb-10">
                  {/* Master Sound Toggle */}
                  <div className="border rounded-lg p-3 sm:p-4">
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
                    <div className="p-3 sm:p-4">
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
                    
                    <div className="p-3 sm:p-4">
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
                    
                    <div className="p-3 sm:p-4">
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
                    

                  </div>
                </div>
              )}
              
              {/* Experimental Tab */}
              {activeTab === "experimental" && (
                <div className="space-y-6 pb-10">
                  {/* AI Suggestions Toggle */}
                  <div className="border rounded-lg p-3 sm:p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium">AI-Powered Suggestions</h3>
                          <div className="flex items-center justify-center" style={{ width: '20px', height: '20px' }}>
                            <FlaskConical className="h-5 w-5 text-amber-500" strokeWidth={1.5} style={{ transform: 'scale(1.2)' }} />
                          </div>
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
                  <div className="border rounded-lg p-4 sm:p-6">
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
