
import { useState, useEffect } from "react";
import TaskCheckbox from "./TaskCheckbox";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onStatusChange: (id: string, isCompleted: boolean) => void;
}

const TaskItem = ({ task, onStatusChange }: TaskItemProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle animation when task is completed
  useEffect(() => {
    if (task.isCompleted) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [task.isCompleted]);

  const handleCheckboxChange = (isCompleted: boolean) => {
    onStatusChange(task.id, isCompleted);
  };

  // Function to display formatted content with markdown
  const renderContent = () => {
    // For now, just basic formatting
    return task.content;
  };

  return (
    <div
      className={cn(
        "task-item",
        task.isCompleted && "completed",
        isAnimating && "animate-fade-in"
      )}
      data-priority={task.priority}
    >
      <TaskCheckbox 
        isCompleted={task.isCompleted} 
        onChange={handleCheckboxChange} 
      />
      <div className={cn("task-content", task.isCompleted && "completed")}>
        {renderContent()}
      </div>
    </div>
  );
};

export default TaskItem;
