import { useState, useEffect } from "react";
import { Check, FlaskConical, Volume2, User, AlertTriangle, Mail, Edit, LogOut } from "lucide-react";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
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
  const { user, signIn, signOut, deleteUser } = useAuth();
  const [activeTab, setActiveTab] = useState("sounds");
  const [soundsEnabled, setSoundsEnabled] = useState(localStorage.getItem('soundsEnabled') !== 'false');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(localStorage.getItem('aiSuggestionsEnabled') !== 'false');
  const [taskAddSoundEnabled, setTaskAddSoundEnabled] = useState(localStorage.getItem('taskAddSoundEnabled') !== 'false');
  const [taskCompleteSoundEnabled, setTaskCompleteSoundEnabled] = useState(localStorage.getItem('taskCompleteSoundEnabled') !== 'false');
  const [taskUncheckSoundEnabled, setTaskUncheckSoundEnabled] = useState(localStorage.getItem('taskUncheckSoundEnabled') !== 'false');

  // Check if all sound toggles are off and update parent toggle accordingly
  useEffect(() => {
    if (soundsEnabled) {
      const allSoundsOff = !taskAddSoundEnabled && !taskCompleteSoundEnabled && !taskUncheckSoundEnabled;
      if (allSoundsOff) {
        setSoundsEnabled(false);
        localStorage.setItem('soundsEnabled', 'false');
        // Dispatch custom event to notify components about the change
        window.dispatchEvent(new CustomEvent('soundsSettingChanged', { 
          detail: { enabled: false } 
        }));
        trackEvent('sounds_setting_changed', { enabled: false });
      }
    }
  }, [taskAddSoundEnabled, taskCompleteSoundEnabled, taskUncheckSoundEnabled]);
  
  // Get user information from Google sign-in
  const userFullName = user?.user_metadata?.full_name || '';
  const userEmail = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  const userInitial = userFullName ? userFullName.charAt(0).toUpperCase() : '?';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-32px)] sm:w-full p-0 overflow-hidden md:w-[90vw] lg:w-[720px]" style={{ 
        height: '460px',
        maxHeight: '90vh',
        maxWidth: '720px',
        width: 'calc(100% - 32px)',
        margin: '0 auto'
      }}>
        <div className="flex flex-col h-full bg-background">
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
                    data-tab="account"
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
            <div className="flex-1 p-4 sm:p-6" style={{ height: 'calc(100% - 10px)', overflowY: 'auto', msOverflowStyle: 'auto', scrollbarWidth: 'auto' }}>

              
              {/* Sounds Tab */}
              {activeTab === "sounds" && (
                <div className="space-y-6 pb-10">
                  {/* Master Sound Toggle */}
                  <div>
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
                              
                              // If turning off parent toggle, ensure all child toggles match the parent state
                              if (!isEnabled) {
                                // No need to update child toggles in UI since they'll be hidden
                              } else {
                                // When turning on parent toggle, ensure at least one child toggle is on
                                // If all were previously off, turn them all on
                                const allOff = !taskAddSoundEnabled && !taskCompleteSoundEnabled && !taskUncheckSoundEnabled;
                                if (allOff) {
                                  setTaskAddSoundEnabled(true);
                                  setTaskCompleteSoundEnabled(true);
                                  setTaskUncheckSoundEnabled(true);
                                  localStorage.setItem('taskAddSoundEnabled', 'true');
                                  localStorage.setItem('taskCompleteSoundEnabled', 'true');
                                  localStorage.setItem('taskUncheckSoundEnabled', 'true');
                                }
                              }
                              
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
                  
                  {/* Separator between parent and child sections */}
                  {soundsEnabled && <div className="border-t my-4"></div>}
                  
                  {/* Individual Sound Toggles - Only shown when master sound toggle is ON */}
                  {soundsEnabled && (
                    <div className="space-y-4">
                      <div>
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
                              />
                              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:bg-green-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div>
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
                              />
                              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:bg-green-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div>
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
                              />
                              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:bg-green-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Experimental Tab */}
              {activeTab === "experimental" && (
                <div className="space-y-6 pb-10">
                  {/* AI Suggestions Toggle */}
                  <div>
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
                    <div className="mt-3 text-sm text-muted-foreground">
                      <span className="font-semibold">Note:</span> When enabled, your task content may be sent to our AI service to generate relevant suggestions.
                      All data is encrypted and not stored.
                    </div>
                  </div>
                </div>
              )}
              
              {/* Account Tab */}
              {activeTab === "profile" && (
                <div className="space-y-6 pb-10">
                  {user ? (
                    <>
                      {/* Profile Details Section */}
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Profile Details</h3>
                        
                        <div className="flex items-start gap-4 mb-2">
                          <Avatar className="h-14 w-14">
                            {avatarUrl ? (
                              <AvatarImage src={avatarUrl} alt="User avatar" />
                            ) : null}
                            <AvatarFallback className="text-lg">{userInitial}</AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="font-medium text-lg">{userFullName} <span className="text-muted-foreground font-normal text-sm">(Signed in using Google)</span></div>
                            <div className="text-muted-foreground">{userEmail}</div>
                            <Button 
                              variant="outline" 
                              className="mt-2 px-2 py-4 text-xs h-6"
                              onClick={signOut}
                            >
                              <LogOut className="h-3 w-3 mr-1" />
                              Sign Out
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t my-4"></div>
                      
                      {/* Delete Account Section */}
                      <div>
                        <div className="flex flex-col gap-2">
                          <h3 className="text-xl font-semibold text-destructive">Delete Account</h3>
                          <p className="text-sm text-muted-foreground">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                        </div>
                        
                        <Button 
                          variant="destructive" 
                          className="w-36 h-8 mt-4 text-sm flex items-center gap-2"
                          onClick={() => setShowDeleteConfirmation(true)}
                        >
                          Delete Account
                        </Button>

                        {/* Sign in button when not authenticated */}
                        {!user && (
                          <Button 
                            variant="outline" 
                            className="w-full mt-4"
                            onClick={signIn}
                          >
                            <GoogleIcon className="h-4 w-4 mr-2" />
                            Sign in with Google
                          </Button>
                        )}

                        {/* Delete Account Confirmation Modal */}
                        <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
                          <DialogContent className="sm:max-w-md p-6">
                            <DialogHeader>
                              <DialogTitle className="text-destructive text-2xl font-bold">Delete Account</DialogTitle>
                              <p className="text-sm text-muted-foreground">
                                This action will permanently delete your account and all associated data. This cannot be undone.
                              </p>
                            </DialogHeader>
                            
                            <div className="mt-3 space-y-6">
                              <div className="space-y-2">
                                <Label htmlFor="deleteConfirmation" className="text-sm font-medium">
                                  Type 'DELETE' to confirm
                                </Label>
                                <input
                                  id="deleteConfirmation"
                                  type="text"
                                  className="w-full px-4 py-1.5 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                                  value={deleteConfirmationText}
                                  onChange={(e) => setDeleteConfirmationText(e.target.value.toUpperCase())}
                                  autoFocus
                                />
                              </div>

                              <div className="flex justify-end space-x-4">
                                <Button variant="outline" onClick={() => setShowDeleteConfirmation(false)}>
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  disabled={deleteConfirmationText !== 'DELETE'}
                                  className="w-36"
                                  onClick={async () => {
                                    setIsDeleting(true);
                                    try {
                                      await deleteUser();
                                      trackEvent('account_deleted');
                                      onOpenChange(false); // Close settings panel
                                    } catch (error) {
                                      console.error('Error deleting account:', error);
                                      // Reset state on error
                                      setIsDeleting(false);
                                      setShowDeleteConfirmation(true);
                                    }
                                  }}
                                >
                                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </>
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
                        <GoogleIcon className="h-4 w-4 mr-2" />
                        Sign In with Google
                      </Button>
                    </div>
                  )}
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
