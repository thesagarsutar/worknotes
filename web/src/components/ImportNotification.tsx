
import { useState, useEffect } from "react";

interface ImportNotificationProps {
  isVisible: boolean;
  message: string;
  onDismiss: () => void;
}

const ImportNotification = ({ isVisible, message, onDismiss }: ImportNotificationProps) => {
  const [isShown, setIsShown] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      setIsShown(true);
      const timer = setTimeout(() => {
        setIsShown(false);
        setTimeout(onDismiss, 300); // Wait for transition to complete
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!isVisible && !isShown) return null;

  return (
    <div 
      className={`fixed top-4 left-0 right-0 mx-auto w-auto max-w-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-4 py-2 rounded-md shadow-md z-50 flex items-center justify-between transition-opacity duration-300 ${isShown ? 'opacity-100' : 'opacity-0'}`}
    >
      <span>{message}</span>
    </div>
  );
};

export default ImportNotification;
