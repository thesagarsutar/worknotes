
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface DateIndexProps {
  dates: string[];
  onDateClick: (date: string) => void;
}

const DateIndex = ({ dates, onDateClick }: DateIndexProps) => {
  const [expandedMode, setExpandedMode] = useState(false);
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

  // Extract task title if it's in the date string format
  const getTaskTitle = (dateStr: string) => {
    try {
      // Try to parse as date first
      new Date(dateStr).toISOString();
      return formatDisplayDate(dateStr);
    } catch {
      // If not a valid date, it might be a task title
      return dateStr;
    }
  };

  // Check if this is today's date
  const isToday = (dateStr: string) => {
    try {
      const today = new Date();
      const taskDate = new Date(dateStr);
      return (
        today.getDate() === taskDate.getDate() &&
        today.getMonth() === taskDate.getMonth() &&
        today.getFullYear() === taskDate.getFullYear()
      );
    } catch {
      return false;
    }
  };

  const handleDateClick = (date: string) => {
    onDateClick(date);
    const dateElement = document.getElementById(`date-section-${date}`);
    if (dateElement) {
      dateElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleMouseEnter = () => {
    setExpandedMode(true);
  };

  const handleMouseLeave = () => {
    setExpandedMode(false);
  };

  return (
    <div 
      className="fixed left-0 top-1/2 transform -translate-y-1/2 z-10"
      ref={indexRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={cn(
        "date-index relative transition-all duration-300 flex",
        expandedMode ? "pl-2" : "pl-2"
      )}>
        <div className="flex flex-col">
          {dates.map((date, index) => (
            <div 
              key={date} 
              className="relative"
              onClick={() => handleDateClick(date)}
            >
              <div 
                className={cn(
                  "date-line w-6 h-0.5 my-3 cursor-pointer transition-all duration-200",
                  isToday(date) ? "bg-[#222222]" : "bg-[#C8C8C9]",
                  "hover:bg-[#9b87f5] hover:w-8"
                )}
              />
            </div>
          ))}
        </div>
        
        {expandedMode && (
          <div 
            className="bg-black/80 text-gray-300 rounded-lg ml-2 p-4 min-w-[200px] transition-all duration-300 flex flex-col gap-3"
          >
            {dates.map((date) => (
              <div
                key={`expanded-${date}`}
                className={cn(
                  "cursor-pointer hover:text-white transition-colors text-left text-sm",
                  isToday(date) ? "text-white font-medium" : ""
                )}
                onClick={() => handleDateClick(date)}
              >
                {getTaskTitle(date)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DateIndex;
