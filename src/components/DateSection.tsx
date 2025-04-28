import { Task } from "@/lib/types";
import TaskItem from "./TaskItem";

interface DateSectionProps {
  date: string;
  tasks: Task[];
  onTaskStatusChange: (id: string, isCompleted: boolean) => void;
  onTaskUpdate: (id: string, content: string) => void;
  onTaskDelete: (id: string) => void;
  onTaskMove: (taskId: string, fromDate: string, toDate: string) => void;
}

const DateSection = ({ 
  date, 
  tasks, 
  onTaskStatusChange, 
  onTaskUpdate,
  onTaskDelete,
  onTaskMove 
}: DateSectionProps) => {
  // Format the date for display (e.g., "2023-04-27" to "April 27, 2023")
  const formatDisplayDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
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

  const handleDragStart = (e: React.DragEvent, taskId: string, fromDate: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('fromDate', fromDate);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, toDate: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const fromDate = e.dataTransfer.getData('fromDate');
    
    if (fromDate !== toDate) {
      onTaskMove(taskId, fromDate, toDate);
    }
  };

  // Sort tasks to show uncompleted tasks first
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.isCompleted === b.isCompleted) return 0;
    return a.isCompleted ? 1 : -1;
  });

  return (
    <div className="date-section mb-8">
      <h2 className="date-header">
        {isToday(date) ? "Today" : formatDisplayDate(date)}
      </h2>
      <div className="date-tasks space-y-1">
        {sortedTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onStatusChange={onTaskStatusChange}
            onTaskUpdate={onTaskUpdate}
            onTaskDelete={onTaskDelete}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
};

export default DateSection;
