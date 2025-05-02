
import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncNotificationProps {
  isSynced: boolean;
  isSyncing: boolean;
}

const SyncNotification = ({ isSynced, isSyncing }: SyncNotificationProps) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    if (isSynced) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
      }, 2000); // Hide after 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isSynced]);

  if (!show) return null;
  
  return (
    <div 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm font-medium animate-fade-in",
        isSyncing ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {isSyncing ? (
          "Syncing your tasks..."
        ) : (
          <>
            <Check className="h-4 w-4" />
            Tasks saved to cloud
          </>
        )}
      </div>
    </div>
  );
};

export default SyncNotification;
