
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TasksByDate } from "@/lib/types";

interface DateCalendarProps {
  tasksByDate: TasksByDate;
  onDateSelect: (date: string) => void;
}

const DateCalendar = ({ tasksByDate, onDateSelect }: DateCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Function to get dates with completed tasks
  const getDatesWithCompletedTasks = (): Date[] => {
    return Object.entries(tasksByDate).reduce((dates: Date[], [dateStr, tasks]) => {
      if (tasks.some(task => task.isCompleted)) {
        dates.push(new Date(dateStr));
      }
      return dates;
    }, []);
  };
  
  // Custom day renderer to show dots for dates with tasks
  const renderDayContent = (day: Date, selectedDate: Date | undefined, dayProps: React.HTMLAttributes<HTMLDivElement>) => {
    const dateStr = day.toISOString().split('T')[0];
    const isToday = new Date().toISOString().split('T')[0] === dateStr;
    const hasCompletedTasks = Object.entries(tasksByDate).some(
      ([taskDate, tasks]) => taskDate === dateStr && tasks.some(task => task.isCompleted)
    );
    
    return (
      <div {...dayProps} className={cn(dayProps.className, "relative")}>
        {day.getDate()}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
          {hasCompletedTasks && (
            <span className="h-[5px] w-[5px] rounded-full bg-green-500"></span>
          )}
          {isToday && (
            <span className="h-[5px] w-[5px] rounded-full bg-orange-500"></span>
          )}
        </div>
      </div>
    );
  };

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      onDateSelect(formattedDate);
    }
  };

  return (
    <div className="fixed left-2 bottom-2 z-10">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full"
          >
            <CalendarIcon className="h-5 w-5 text-gray-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
            modifiers={{
              today: [new Date()],
              completed: getDatesWithCompletedTasks(),
            }}
            modifiersClassNames={{
              today: "bg-orange-100 dark:bg-orange-900/20",
              completed: "bg-green-100 dark:bg-green-900/20",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateCalendar;
