
import { Task } from "@/lib/types";
import TaskItem from "./TaskItem";

interface DateSectionProps {
  date: string;
  tasks: Task[];
  onTaskStatusChange: (id: string, isCompleted: boolean) => void;
  onTaskUpdate: (id: string, content: string) => void;
  onTaskDelete: (id: string) => void;
  onTaskPriorityChange: (id: string, priority: Task["priority"]) => void;
  onTaskMove: (taskId: string, fromDate: string, toDate: string) => void;
  onTaskReorder: (fromIndex: number, toIndex: number, date: string) => void;
}

const DateSection = ({ 
  date, 
  tasks, 
  onTaskStatusChange, 
  onTaskUpdate,
  onTaskDelete,
  onTaskPriorityChange,
  onTaskMove,
  onTaskReorder
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

  const handleDragStart = (e: React.DragEvent, taskId: string, fromDate: string, index: number) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('fromDate', fromDate);
    e.dataTransfer.setData('fromIndex', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedOverItem = (e.target as HTMLElement).closest('.task-item');
    if (draggedOverItem) {
      draggedOverItem.classList.add('drag-over');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const draggedOverItem = (e.target as HTMLElement).closest('.task-item');
    if (draggedOverItem) {
      draggedOverItem.classList.remove('drag-over');
    }
  };

  const handleDrop = (e: React.DragEvent, toDate: string, toIndex: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const fromDate = e.dataTransfer.getData('fromDate');
    const fromIndex = parseInt(e.dataTransfer.getData('fromIndex'));
    
    const draggedOverItem = (e.target as HTMLElement).closest('.task-item');
    if (draggedOverItem) {
      draggedOverItem.classList.remove('drag-over');
    }
    
    if (fromDate === toDate) {
      // Don't reorder if dropped on itself
      if (fromIndex !== toIndex) {
        onTaskReorder(fromIndex, toIndex, fromDate);
      }
    } else {
      // Move to different section
      onTaskMove(taskId, fromDate, toDate);
    }
  };

  // Sort tasks by priority (high > medium > low > none) and then by completion status
  const sortedTasks = [...tasks].sort((a, b) => {
    // First sort by completion status
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    
    // Then by priority
    const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const handleEmptySectionDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Add visual indicator when dragging over the empty section
    (e.currentTarget as HTMLElement).classList.add('bg-muted/20');
  };

  const handleEmptySectionDragLeave = (e: React.DragEvent) => {
    // Remove visual indicator
    (e.currentTarget as HTMLElement).classList.remove('bg-muted/20');
  };

  const handleEmptySectionDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // Remove visual indicator
    (e.currentTarget as HTMLElement).classList.remove('bg-muted/20');
    
    const taskId = e.dataTransfer.getData('taskId');
    const fromDate = e.dataTransfer.getData('fromDate');
    
    if (fromDate !== date && taskId) {
      onTaskMove(taskId, fromDate, date);
    }
  };

  return (
    <div className="date-section mb-8" id={`date-section-${date}`}>
      <h2 className="date-header">
        {isToday(date) ? "Today" : formatDisplayDate(date)}
      </h2>
      <div 
        className={`date-tasks space-y-1 ${tasks.length === 0 ? 'empty-date-section min-h-[50px]' : ''}`}
        onDragOver={handleEmptySectionDragOver}
        onDragLeave={handleEmptySectionDragLeave}
        onDrop={handleEmptySectionDrop}
      >
        {sortedTasks.map((task, index) => (
          <TaskItem
            key={task.id}
            task={task}
            index={index}
            onStatusChange={onTaskStatusChange}
            onTaskUpdate={onTaskUpdate}
            onTaskDelete={onTaskDelete}
            onPriorityChange={onTaskPriorityChange}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
};

export default DateSection;
