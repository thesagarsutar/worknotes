
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface DateIndexProps {
  dates: string[];
  onDateClick: (date: string) => void;
}

const DateIndex = ({ dates, onDateClick }: DateIndexProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const indexRef = useRef<HTMLDivElement>(null);

  // Format the date for display
  const formatDisplayDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  // Check if this is today's date
  const isToday = (dateStr: string) => {
    const today = new Date();
    const taskDate = new Date(dateStr);
    return (
      today.getDate() === taskDate.getDate() &&
      today.getMonth() === taskDate.getMonth() &&
      today.getFullYear() === taskDate.getFullYear()
    );
  };

  const handleMouseEnter = (date: string) => {
    setHoveredDate(date);
  };

  const handleMouseLeave = () => {
    setHoveredDate(null);
  };
  
  const handleSectionMouseEnter = () => {
    setIsHovering(true);
  };
  
  const handleSectionMouseLeave = () => {
    setIsHovering(false);
  };

  const handleDateClick = (date: string) => {
    onDateClick(date);
    const dateElement = document.getElementById(`date-section-${date}`);
    if (dateElement) {
      dateElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div 
      className="fixed left-0 top-1/2 transform -translate-y-1/2 z-10 pl-2"
      ref={indexRef}
      onMouseEnter={handleSectionMouseEnter}
      onMouseLeave={handleSectionMouseLeave}
    >
      <div className="date-index relative flex items-center">
        <div className="date-lines transition-all duration-200">
          {dates.map((date) => (
            <div 
              key={date} 
              className={cn(
                "relative flex items-center transition-all duration-200",
                isHovering ? "h-7" : "h-3.5"
              )}
              onMouseEnter={() => handleMouseEnter(date)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleDateClick(date)}
            >
              <motion.div 
                className={cn(
                  "date-line h-0.5 cursor-pointer transition-colors duration-200",
                  isToday(date) ? "bg-[#222222]" : "bg-gray-300 dark:bg-gray-600",
                  hoveredDate === date ? "bg-gray-700 dark:bg-gray-300" : ""
                )}
                initial={{ width: '16px' }}
                animate={{ 
                  width: isHovering ? '16px' : '16px'
                }}
                transition={{ duration: 0.2 }}
              />
              
              <AnimatePresence>
                {isHovering && (
                  <motion.div 
                    initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                    animate={{ opacity: 1, width: 'auto', marginLeft: 8 }}
                    exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "text-sm whitespace-nowrap overflow-hidden cursor-pointer",
                      hoveredDate === date ? "font-medium" : "",
                      isToday(date) ? "text-black dark:text-white" : "text-gray-600 dark:text-gray-400"
                    )}
                    onClick={() => handleDateClick(date)}
                  >
                    {formatDisplayDate(date)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DateIndex;
