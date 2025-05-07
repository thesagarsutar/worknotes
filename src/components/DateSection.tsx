
import { useState, useRef } from "react";
import { Task } from "@/lib/types";
import TaskItem from "./TaskItem";
import { cn } from "@/lib/utils";

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
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  
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
    // Set effectAllowed to move to indicate this is a move operation
    e.dataTransfer.effectAllowed = 'move';
  };

  const findInsertionIndex = (e: React.DragEvent): number | null => {
    if (!sectionRef.current) return null;
    
    const taskItems = Array.from(sectionRef.current.querySelectorAll('.task-item'));
    
    if (taskItems.length === 0) return 0;
    
    // Get mouse position relative to the viewport
    const mouseY = e.clientY;
    
    // Find the task item the mouse is closest to
    for (let i = 0; i < taskItems.length; i++) {
      const taskRect = taskItems[i].getBoundingClientRect();
      const taskMiddle = taskRect.top + taskRect.height / 2;
      
      // If mouse is above the middle of this task, insert above it
      if (mouseY < taskMiddle) {
        return i;
      }
    }
    
    // If we get here, insert at the end
    return taskItems.length;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Remove any existing drag-over classes
    const draggedOverItem = (e.target as HTMLElement).closest('.task-item');
    if (draggedOverItem) {
      draggedOverItem.classList.remove('drag-over');
    }
    
    // Find insertion index and update state
    const index = findInsertionIndex(e);
    setInsertionIndex(index);
    
    // Set dropEffect to move to indicate this is a move operation
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only hide the insertion line if we're leaving the section
    // and not just moving between tasks within the section
    if (!sectionRef.current?.contains(e.relatedTarget as Node)) {
      setInsertionIndex(null);
    }
    
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
    
    // Reset insertion line
    setInsertionIndex(null);
    
    // Remove any drag-over classes
    const draggedOverItem = (e.target as HTMLElement).closest('.task-item');
    if (draggedOverItem) {
      draggedOverItem.classList.remove('drag-over');
    }
    
    // Ensure we have valid indices
    if (isNaN(fromIndex) || toIndex === null) return;
    
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
    // Set insertion index to 0 for empty section
    setInsertionIndex(0);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleEmptySectionDragLeave = (e: React.DragEvent) => {
    // Remove visual indicator
    (e.currentTarget as HTMLElement).classList.remove('bg-muted/20');
    // Only reset if we're leaving the section
    if (!sectionRef.current?.contains(e.relatedTarget as Node)) {
      setInsertionIndex(null);
    }
  };

  const handleEmptySectionDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // Remove visual indicator
    (e.currentTarget as HTMLElement).classList.remove('bg-muted/20');
    setInsertionIndex(null);
    
    const taskId = e.dataTransfer.getData('taskId');
    const fromDate = e.dataTransfer.getData('fromDate');
    
    if (fromDate !== date && taskId) {
      onTaskMove(taskId, fromDate, date);
    }
  };
  
  // Accessibility keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Implement keyboard navigation for tasks
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      // Move task up
      onTaskReorder(index, index - 1, date);
    } else if (e.key === 'ArrowDown' && index < sortedTasks.length - 1) {
      e.preventDefault();
      // Move task down
      onTaskReorder(index, index + 1, date);
    }
  };

  return (
    <div 
      className="date-section mb-8"
      id={`date-section-${date}`}
      ref={sectionRef}
    >
      <h2 className="date-header">
        {isToday(date) ? "Today" : formatDisplayDate(date)}
      </h2>
      <div 
        className={cn(
          "date-tasks relative space-y-1",
          tasks.length === 0 ? 'empty-date-section min-h-[50px]' : ''
        )}
        onDragOver={tasks.length === 0 ? handleEmptySectionDragOver : handleDragOver}
        onDragLeave={tasks.length === 0 ? handleEmptySectionDragLeave : handleDragLeave}
        onDrop={tasks.length === 0 ? handleEmptySectionDrop : (e) => handleDrop(e, date, tasks.length)}
        role="list"
        aria-label={`Tasks for ${isToday(date) ? 'Today' : formatDisplayDate(date)}`}
      >
        {/* Insertion line - render for each possible insertion point */}
        {Array.from({ length: sortedTasks.length + 1 }).map((_, i) => (
          <div
            key={`insertion-line-${date}-${i}`}
            className={cn(
              "absolute left-0 w-full h-0.5 bg-[#0EA5E9] transition-all duration-150 z-10",
              insertionIndex === i ? "opacity-100" : "opacity-0"
            )}
            style={{
              top: i === 0 
                ? 0 
                : i === sortedTasks.length 
                  ? '100%' 
                  : `calc(${(i / sortedTasks.length) * 100}% - 1px)`
            }}
            role="presentation"
          />
        ))}
        
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
