
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface DateIndexProps {
  dates: string[];
  onDateClick: (date: string) => void;
}

const DateIndex = ({ dates, onDateClick }: DateIndexProps) => {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0 });
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

  const handleMouseEnter = (date: string, index: number) => {
    setHoveredDate(date);
    if (indexRef.current) {
      const lineHeight = 28; // Approximate height of each line
      const tooltipTop = index * lineHeight;
      
      // Adjust tooltip position if it would go off-screen
      const maxTop = window.innerHeight - 40; // Leave some space at bottom
      const adjustedTop = Math.min(tooltipTop, maxTop);
      
      setTooltipPosition({ top: adjustedTop });
    }
  };

  const handleMouseLeave = () => {
    setHoveredDate(null);
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
    >
      <div className="date-index relative">
        {dates.map((date, index) => (
          <div 
            key={date} 
            className="relative"
            onMouseEnter={() => handleMouseEnter(date, index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleDateClick(date)}
          >
            <div 
              className={cn(
                "date-line h-0.5 my-3 cursor-pointer transition-all duration-200",
                isToday(date) ? "bg-[#222222]" : "bg-gray-300 dark:bg-gray-600",
                "hover:bg-gray-700 dark:hover:bg-gray-300 hover:w-6"
              )}
              style={{ width: '16px' }}
            />
          </div>
        ))}
        
        {hoveredDate && (
          <div 
            className="absolute left-10 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 shadow-md text-sm whitespace-nowrap"
            style={{ 
              top: tooltipPosition.top,
              transform: 'translateY(-50%)', // Center vertically
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {formatDisplayDate(hoveredDate)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DateIndex;
