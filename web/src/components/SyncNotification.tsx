
import { useEffect } from "react";
import { CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncNotificationProps {
  isSyncing: boolean;
}

const SyncNotification = ({ isSyncing }: SyncNotificationProps) => {
  if (!isSyncing) return null;
  
  return (
    <div className="fixed bottom-16 right-4 z-10 text-primary animate-pulse">
      <CloudUpload className="h-5 w-5" />
    </div>
  );
};

export default SyncNotification;
