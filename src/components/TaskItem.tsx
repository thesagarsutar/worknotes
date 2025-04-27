
import { useState, useEffect, useRef } from "react";
import TaskCheckbox from "./TaskCheckbox";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onStatusChange: (id: string, isCompleted: boolean) => void;
  onTaskUpdate: (id: string, content: string) => void;
}

const TaskItem = ({ task, onStatusChange, onTaskUpdate }: TaskItemProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(task.content);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Handle animation when task is completed
  useEffect(() => {
    if (task.isCompleted) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [task.isCompleted]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  const handleCheckboxChange = (isCompleted: boolean) => {
    onStatusChange(task.id, isCompleted);
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditContent(task.content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const saveEdit = () => {
    if (editContent.trim() !== '') {
      onTaskUpdate(task.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent(task.content);
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
      {isEditing ? (
        <div className="task-edit-container flex-1">
          <input
            ref={editInputRef}
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            className="w-full border-none bg-transparent p-0 focus:outline-none focus:ring-0"
          />
        </div>
      ) : (
        <div 
          className={cn("task-content flex-1", task.isCompleted && "completed")}
          onDoubleClick={handleDoubleClick}
        >
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default TaskItem;
